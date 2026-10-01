import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

let cachedAuth = null;

const customFetch = (input, init) => {
  if (init && init.body && !init.duplex) {
    init.duplex = 'half';
  }
  return globalThis.fetch(input, init);
};

export async function getGoogleAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  const filename = process.env.GOOGLE_API_KEY_FILENAME || '.env.key.json';
  const keyPath = path.resolve(process.cwd(), filename);

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Google API key file not found at ${keyPath}. Please configure GOOGLE_API_KEY_FILENAME in your environment.`);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive'
    ],
    clientOptions: {
      transporterOptions: {
        fetchImplementation: customFetch
      }
    }
  });

  cachedAuth = auth;
  return auth;
}
