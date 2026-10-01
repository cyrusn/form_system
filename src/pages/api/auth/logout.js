import { clearSessionCookie } from '@/lib/jwt';

export default function handler(req, res) {
  clearSessionCookie(res);
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
}
