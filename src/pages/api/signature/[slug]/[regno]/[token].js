import { getDb } from '@/lib/db';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { slug, regno, token } = req.query;

  if (!slug || !regno || !token) {
    return res.status(400).json({ error: 'Missing parameter in request path.' });
  }

  const cleanSlug = String(slug).trim().toLowerCase();
  const cleanRegno = String(regno).trim().toLowerCase();
  const cleanToken = String(token).trim();

  try {
    const db = getDb();
    
    // Look up signature with perfect match on slug, regno, and secure password-token
    const row = db.prepare(`
      SELECT signature_base64 
      FROM signatures 
      WHERE form_slug = ? AND regno = ? AND signature_token = ?
    `).get(cleanSlug, cleanRegno, cleanToken);

    if (!row) {
      return res.status(403).json({ error: 'Forbidden: Invalid signature token or credentials.' });
    }

    const rawBase64 = row.signature_base64;
    // Extract base64 payload from data url if present
    const base64Data = rawBase64.includes(';base64,') 
      ? rawBase64.split(';base64,')[1] 
      : rawBase64;

    const imgBuffer = Buffer.from(base64Data, 'base64');

    // Serve binary PNG image
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(imgBuffer);
  } catch (error) {
    console.error('[API Signature Stream Error]:', error);
    return res.status(500).json({ error: 'Failed to stream signature image.' });
  }
}
