import { getSession } from '@/lib/jwt';
import { getDb } from '@/lib/db';
import { getFormStructure, submitFormResponse } from '@/utils/googleSheet';
import { google } from 'googleapis';
import { getGoogleAuth } from '@/utils/googleApiAuth';
import { uploadFile } from '@/utils/googleDrive';
import crypto from 'crypto';
import formidable from 'formidable';

const sheets = google.sheets('v4');

export const config = {
  api: {
    bodyParser: false // Disable Next.js body parsing so formidable can parse multipart/form-data
  }
};

const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = formidable({ keepExtensions: true });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
};

const getFirstValue = (val) => {
  if (Array.isArray(val)) return val[0];
  return val;
};

const getFirstFile = (fileOrArray) => {
  if (Array.isArray(fileOrArray)) return fileOrArray[0];
  return fileOrArray;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { slug } = req.query;
  const session = getSession(req, 'USER');

  // 1. Authenticate user session
  if (!session || session.role !== 'USER' || session.formSlug !== slug) {
    return res.status(401).json({ error: 'Unauthorized: Student session has expired or is invalid.' });
  }

  const { regno, rowNumber } = session;

  try {
    const { fields, files } = await parseForm(req);
    const action = getFirstValue(fields.action);
    const responsesStr = getFirstValue(fields.responses);

    if (!responsesStr) {
      return res.status(400).json({ error: 'Missing form responses payload.' });
    }

    const responses = JSON.parse(responsesStr);
    const db = getDb();
    
    // 2. Map slug directly to Spreadsheet ID and use standard sheet names
    const spreadsheet_id = slug;
    const data_sheet_name = session.dataSheetName || 'data';
    const info_sheet_name = session.infoSheetName || 'info';

    // 3. Real-time verification of "is_locked" directly from Google Sheets to prevent race-condition edits
    const auth = await getGoogleAuth();
    const sheetDataResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: spreadsheet_id,
      range: `${data_sheet_name}!A1:ZZ${rowNumber}`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });

    const rows = sheetDataResponse.data.values || [];
    const headers = (rows[0] || []).map(h => String(h || '').trim().toLowerCase());
    const lockIndex = headers.indexOf('is_locked');
    
    if (lockIndex !== -1 && rows[rowNumber - 1]) {
      const lockVal = String(rows[rowNumber - 1][lockIndex] || '').trim().toLowerCase();
      const isLocked = ['true', 'yes', '1'].includes(lockVal);
      if (isLocked) {
        return res.status(403).json({ error: 'This form has been locked by the school administrator and cannot be modified.' });
      }
    }

    // Extract student info for file renaming
    let classcode = '';
    let classno = '';
    let cname = '';
    let ename = '';
    let studentNameField = '';

    const studentRow = rows[rowNumber - 1];
    if (studentRow) {
      const classcodeIndex = headers.indexOf('classcode');
      const classnoIndex = headers.indexOf('classno');
      const cnameIndex = headers.indexOf('cname');
      const enameIndex = headers.indexOf('ename');
      const nameIndex = headers.indexOf('name');

      if (classcodeIndex !== -1) classcode = String(studentRow[classcodeIndex] || '').trim();
      if (classnoIndex !== -1) classno = String(studentRow[classnoIndex] || '').trim();
      if (cnameIndex !== -1) cname = String(studentRow[cnameIndex] || '').trim();
      if (enameIndex !== -1) ename = String(studentRow[enameIndex] || '').trim();
      if (nameIndex !== -1) studentNameField = String(studentRow[nameIndex] || '').trim();
    }

    const studentName = cname || ename || studentNameField || '';
    const paddedClassno = classno ? String(classno).padStart(2, '0') : '';

    // 4. Parse the form fields to handle signature, file uploads & formatting
    const structure = await getFormStructure(spreadsheet_id, data_sheet_name, info_sheet_name);
    const mappedResponses = {};

    // Validate and format form answers
    for (const field of structure.fields) {
      if (field.isSystem) continue;

      let userAns = responses[field.key];

      if (field.type === 'file') {
        const fileKey = `file_${field.key}`;
        const uploadedFile = getFirstFile(files[fileKey]);
        
        if (uploadedFile) {
          // A file was newly uploaded! Upload it to Google Drive
          if (!structure.formFolder) {
            return res.status(400).json({ error: 'Google Drive target folder is not configured on the Google Sheet Info sheet.' });
          }

          // Rename file according to format: [slug]_[classcode][classno]_[regno]_[cname||ename]_original_filename.ext
          const origName = uploadedFile.originalFilename || uploadedFile.name || 'file';
          const newFilename = `${slug}_${classcode}${paddedClassno}_${regno}_${studentName}_${origName}`;
          uploadedFile.originalFilename = newFilename;
          uploadedFile.name = newFilename;

          const driveResult = await uploadFile(structure.formFolder, uploadedFile);
          userAns = driveResult.webViewLink;
        } else {
          // No file uploaded in this session, check if there is an existing value (URL) to preserve
        }
        
        if (action === 'confirm' && field.isRequired && (!userAns || String(userAns).trim() === '')) {
          return res.status(400).json({ error: `The file field "${field.title}" is required.` });
        }
        mappedResponses[field.key] = userAns !== undefined ? String(userAns).trim() : '';

      } else if (field.type === 'signature') {
        if (action === 'confirm' && field.isRequired && (!userAns || String(userAns).trim() === '')) {
          return res.status(400).json({ error: `The signature field "${field.title}" is required.` });
        }

        // If there's drawing data, save it to SQLite & map formula to Google Sheets
        if (userAns && userAns.startsWith('data:image/')) {
          // A: Generate a cryptographic secure token (password)
          const token = crypto.randomBytes(16).toString('hex');

          // B: Store in SQLite signatures table
          db.prepare(`
            INSERT OR REPLACE INTO signatures (form_slug, regno, signature_token, signature_base64)
            VALUES (?, ?, ?, ?)
          `).run(slug, regno, token, userAns);

          // C: Store the formula back to Google Sheets instead of base64
          const protocol = req.headers['x-forwarded-proto'] || (req.headers.referer ? new URL(req.headers.referer).protocol.replace(':', '') : 'http');
          const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
          const currentBasePath = process.env.BASE_PATH || (process.env.NODE_ENV === 'production' ? '/forms' : '');
          const appUrl = `${protocol}://${host}${currentBasePath}`;
          const signatureFormula = `=IMAGE("${appUrl}/api/signature/${slug}/${regno}/${token}", 1)`;
          
          mappedResponses[field.key] = signatureFormula;
        } else if (!userAns || String(userAns).trim() === '') {
          // If the signature is explicitly cleared, clear it in Google Sheets too
          mappedResponses[field.key] = '';
        } else {
          // If the signature is untouched, preserve the existing value in Sheets (which might be the formula)
        }
      } else {
        // Standard text, selects, date inputs
        if (action === 'confirm' && field.isRequired && (userAns === undefined || String(userAns).trim() === '')) {
          return res.status(400).json({ error: `The field "${field.title}" is required.` });
        }
        mappedResponses[field.key] = userAns !== undefined ? String(userAns).trim() : '';
      }
    }

    // 5. Submit responses to Google Sheets row
    const actionType = action === 'confirm' ? 'confirm' : 'save';
    await submitFormResponse(spreadsheet_id, data_sheet_name, rowNumber, mappedResponses, actionType);

    return res.status(200).json({ success: true, message: 'Responses submitted successfully!' });
  } catch (error) {
    console.error('[API Submit Error]:', error);
    return res.status(500).json({ error: 'Failed to save responses. Please check spreadsheet configurations.' });
  }
}
