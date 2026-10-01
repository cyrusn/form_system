import { google } from 'googleapis';
import fs from 'fs';
import { getGoogleAuth } from './googleApiAuth';

const drive = google.drive('v3');

/**
 * Uploads a file parsed by Formidable to a specified Google Drive folder.
 * Supports both formidable v2 (path, name, type) and v3 (filepath, originalFilename, mimetype).
 * 
 * @param {string} folderId Google Drive folder ID
 * @param {object} file Formidable file object
 * @returns {Promise<object>} response data containing id, webViewLink, and name
 */
export async function uploadFile(folderId, file) {
  const auth = await getGoogleAuth();
  
  if (!file) {
    throw new Error('No file provided to uploadFile');
  }

  const filename = file.originalFilename || file.name || 'unnamed_file';
  const filepath = file.filepath || file.path;
  const mimeType = file.mimetype || file.type || 'application/octet-stream';

  if (!filepath) {
    throw new Error('File path is missing from file object');
  }

  const metadata = {
    name: filename,
    parents: [folderId]
  };

  const media = {
    mimeType,
    body: fs.createReadStream(filepath)
  };

  try {
    const response = await drive.files.create({
      auth,
      resource: metadata,
      media: media,
      fields: 'id,webViewLink,name',
      supportsAllDrives: true, // Allow operations on shared drives
      includeItemsFromAllDrives: true // Include items from shared drives
    });

    // Clean up temporary file
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (cleanupErr) {
      console.warn(`[GoogleDrive] Failed to clean up temp file at ${filepath}:`, cleanupErr.message);
    }

    return response.data;
  } catch (err) {
    console.error(`[GoogleDrive] Error uploading file "${filename}" to folder "${folderId}":`, err.message);
    throw err;
  }
}
