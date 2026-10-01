import { google } from 'googleapis';
import { getGoogleAuth } from './googleApiAuth';

const sheets = google.sheets('v4');

/**
 * Dynamically resolves sheet names within a Google Spreadsheet by listing
 * all sheets and finding ones containing "info" and "data" (case-insensitive).
 */
export async function resolveSheetNames(spreadsheetId) {
  const auth = await getGoogleAuth();
  try {
    const response = await sheets.spreadsheets.get({
      auth,
      spreadsheetId
    });
    const sheetsList = response.data.sheets || [];
    const titles = sheetsList.map(s => s.properties.title);

    const infoSheetName = titles.find(t => t.toLowerCase().includes('info')) || 'info';
    const dataSheetName = titles.find(t => t.toLowerCase().includes('data')) || 'data';

    return { infoSheetName, dataSheetName, allSheets: titles };
  } catch (err) {
    console.error(`[GoogleSheet] Error resolving sheet names for "${spreadsheetId}":`, err.message);
    return { infoSheetName: 'info', dataSheetName: 'data', allSheets: ['info', 'data'] };
  }
}

/**
 * Fetches form metadata (Title from Info sheet, fields from first 7 rows of Data sheet)
 */
export async function getFormStructure(spreadsheetId, dataSheetName, infoSheetName) {
  const auth = await getGoogleAuth();
  
  // 1. Fetch Notice Title, Description, and Folder (Cells A1:B3)
  let formTitle = 'Form System';
  let formDescription = '';
  let formFolder = '';
  
  try {
    const infoResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: `${infoSheetName}!A1:B3`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    });
    
    const infoValues = infoResponse.data.values || [];
    if (infoValues[0] && infoValues[0][1]) formTitle = infoValues[0][1];
    if (infoValues[1] && infoValues[1][1]) formDescription = infoValues[1][1];
    if (infoValues[2] && infoValues[2][1]) formFolder = infoValues[2][1];
  } catch (err) {
    console.error(`[GoogleSheet] Error reading info sheet "${infoSheetName}":`, err.message);
  }

  // 2. Fetch Form Field definitions (Rows 1-7 in Data Sheet)
  const metaResponse = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${dataSheetName}!A1:ZZ7`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  const rows = metaResponse.data.values || [];
  if (rows.length < 5) {
    throw new Error(`Invalid data sheet schema in "${dataSheetName}". Minimum 5 rows are required for headers and metadata.`);
  }

  const rowHeaders     = rows[0] || []; // Row 1

  // Enforce mandatory standard Columns B to K (indices 1 to 10)
  const expectedHeaders = ['regno', 'classcode', 'classno', 'ename', 'cname', 'sex', 'house', 'password', 'timestamp', 'is_locked'];
  for (let idx = 0; idx < expectedHeaders.length; idx++) {
    const sheetHeader = String(rowHeaders[idx + 1] || '').trim().toLowerCase();
    if (sheetHeader !== expectedHeaders[idx]) {
      throw new Error(`Invalid spreadsheet schema. Column ${String.fromCharCode(66 + idx)} must be "${expectedHeaders[idx]}".`);
    }
  }
  const rowTypes       = rows[1] || []; // Row 2
  const rowGroupings   = rows[2] || []; // Row 3
  const rowRequired    = rows[3] || []; // Row 4
  const rowTitles      = rows[4] || []; // Row 5
  const rowDescriptions = rows[5] || []; // Row 6
  const rowOptions     = rows[6] || []; // Row 7 (Options row for selects/checkboxes/etc.)

  const fields = [];
  const systemHeaders = ['timestamp', 'regno', 'password', 'is_locked'];

  for (let i = 1; i < rowHeaders.length; i++) {
    const key = String(rowHeaders[i] || '').trim();
    if (!key) continue;

    // Check if system column
    const isSystem = systemHeaders.includes(key.toLowerCase());

    fields.push({
      key,
      type: String(rowTypes[i] || 'text').trim().toLowerCase(),
      grouping: String(rowGroupings[i] || '').trim(),
      isRequired: ['true', 'yes', '1'].includes(String(rowRequired[i] || '').trim().toLowerCase()),
      title: String(rowTitles[i] || key).trim(),
      description: String(rowDescriptions[i] || '').trim(),
      options: String(rowOptions[i] || '').trim() ? String(rowOptions[i]).split(',').map(s => s.trim()) : [],
      isSystem
    });
  }

  return {
    formTitle,
    formDescription,
    formFolder,
    fields
  };
}

/**
 * Validates credentials against Row 8+ of the data sheet
 */
export async function authenticateStudent(spreadsheetId, dataSheetName, regno, password) {
  const auth = await getGoogleAuth();
  
  // Fetch full data starting from Row 1 so we map columns perfectly
  const response = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${dataSheetName}!A1:ZZ1000`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  const rows = response.data.values || [];
  if (rows.length < 8) {
    return { error: 'No student accounts configured in spreadsheet.' };
  }

  const headers = (rows[0] || []).map(h => String(h || '').trim().toLowerCase());
  const regnoIndex = headers.indexOf('regno');
  const passwordIndex = headers.indexOf('password');
  const lockIndex = headers.indexOf('is_locked');
  const timestampIndex = headers.indexOf('timestamp');

  if (regnoIndex === -1 || passwordIndex === -1) {
    return { error: 'Spreadsheet missing standard "regno" or "password" columns in Row 1.' };
  }

  const targetRegno = String(regno).trim().toLowerCase();
  const targetPassword = String(password).trim();

  // Search students starting from Row 8 (index 7)
  for (let i = 7; i < rows.length; i++) {
    const row = rows[i];
    const rowRegno = String(row[regnoIndex] || '').trim().toLowerCase();
    
    if (rowRegno === targetRegno) {
      const rowPassword = String(row[passwordIndex] || '').trim();
      
      if (rowPassword === targetPassword) {
        // Build logged-in student object
        const isLocked = lockIndex !== -1 ? ['true', 'yes', '1'].includes(String(row[lockIndex] || '').trim().toLowerCase()) : false;
        const submitted = timestampIndex !== -1 ? !!row[timestampIndex] : false;
        
        // Return student details mapped from header columns
        const studentInfo = {};
        headers.forEach((h, idx) => {
          if (idx > 0 && h && !['password', 'is_locked', 'timestamp'].includes(h)) {
            studentInfo[h] = row[idx] || '';
          }
        });

        return {
          success: true,
          rowNumber: i + 1, // 1-indexed for spreadsheet updates
          isLocked,
          submitted,
          studentInfo
        };
      } else {
        return { error: 'Incorrect pin/password.' };
      }
    }
  }

  return { error: 'Registration number not found.' };
}

/**
 * Updates a student response row
 */
export async function submitFormResponse(spreadsheetId, dataSheetName, rowNumber, responses, action = 'save') {
  const auth = await getGoogleAuth();

  // 1. Fetch headers to match columns
  const response = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${dataSheetName}!A1:ZZ1`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  const headers = (response.data.values || [])[0] || [];
  
  // 2. Read the existing row so we don't wipe out other fields (like password!)
  const rowResponse = await sheets.spreadsheets.values.get({
    auth,
    spreadsheetId,
    range: `${dataSheetName}!A${rowNumber}:ZZ${rowNumber}`,
    valueRenderOption: 'UNFORMATTED_VALUE'
  });

  const existingRowValues = (rowResponse.data.values || [])[0] || [];
  const updatedRowValues = [...existingRowValues];

  // Fill in trailing empty cells if the fetched row is shorter than headers
  while (updatedRowValues.length < headers.length) {
    updatedRowValues.push('');
  }

  // 3. Map new responses to corresponding columns (Strictly protect Columns A through K / indices 0 to 10)
  headers.forEach((header, idx) => {
    // Skip Columns A-K (indices 0 to 10) to prevent accidental erasure of student profile data or locking status
    if (idx <= 10) return;

    const key = String(header || '').trim();
    if (key && responses[key] !== undefined) {
      updatedRowValues[idx] = responses[key];
    }
  });

  // Always write current timestamp in requested format
  const timestampIndex = headers.map(h => String(h || '').trim().toLowerCase()).indexOf('timestamp');
  if (timestampIndex !== -1) {
    const prefix = action === 'confirm' ? 'confirmed' : 'saved';
    updatedRowValues[timestampIndex] = `${prefix}@${new Date().toISOString().substring(0, 19)}`;
  }

  // Lock form if confirmed
  const lockIndex = headers.map(h => String(h || '').trim().toLowerCase()).indexOf('is_locked');
  if (lockIndex !== -1 && action === 'confirm') {
    updatedRowValues[lockIndex] = 'TRUE';
  }

  // 4. Update the sheet
  await sheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: `${dataSheetName}!A${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [updatedRowValues]
    }
  });

  return true;
}

/**
 * Updates the title and description in the Info sheet (Admin only)
 */
export async function updateFormInfo(spreadsheetId, infoSheetName, title, description) {
  const auth = await getGoogleAuth();

  await sheets.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: `${infoSheetName}!A1:B2`,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [
        ['FORM_TITLE', title],
        ['FORM_DESC', description]
      ]
    }
  });

  return true;
}
