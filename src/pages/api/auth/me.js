import { getSession } from '@/lib/jwt';

export default function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(200).json({ loggedIn: false });
  }
  return res.status(200).json({ loggedIn: true, ...session });
}
