import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-security-key-321-default';
const ADMIN_COOKIE_NAME = 'form_admin_session';
const STUDENT_COOKIE_NAME = 'form_student_session';

export function signToken(payload, expiresIn = '4h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function setSessionCookie(res, payload) {
  const isAdmin = payload.role === 'SUPERADMIN';
  const cookieName = isAdmin ? ADMIN_COOKIE_NAME : STUDENT_COOKIE_NAME;
  const expiresIn = isAdmin ? '1h' : '2h';
  const maxAge = isAdmin ? 60 * 60 : 2 * 60 * 60; // 1 hour for admin, 2 hours for student

  const token = signToken(payload, expiresIn);
  const cookieStr = serialize(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge,
    path: '/'
  });
  res.setHeader('Set-Cookie', cookieStr);
}

export function clearSessionCookie(res) {
  const adminCookieStr = serialize(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  });
  const studentCookieStr = serialize(STUDENT_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: -1,
    path: '/'
  });
  res.setHeader('Set-Cookie', [adminCookieStr, studentCookieStr]);
}

export function getSession(req, expectedRole = null) {
  const cookies = parse(req.headers.cookie || '');
  
  if (expectedRole === 'SUPERADMIN') {
    const token = cookies[ADMIN_COOKIE_NAME];
    return token ? verifyToken(token) : null;
  }
  if (expectedRole === 'USER') {
    const token = cookies[STUDENT_COOKIE_NAME];
    return token ? verifyToken(token) : null;
  }

  // Fallback if no role specified: try admin first, then student
  const adminToken = cookies[ADMIN_COOKIE_NAME];
  if (adminToken) {
    const verified = verifyToken(adminToken);
    if (verified) return verified;
  }

  const studentToken = cookies[STUDENT_COOKIE_NAME];
  return studentToken ? verifyToken(studentToken) : null;
}

export function requireAuth(req, res, allowedRoles = ['USER', 'SUPERADMIN']) {
  // Extract expectedRole if only one is allowed
  let expectedRole = null;
  if (allowedRoles && allowedRoles.length === 1) {
    expectedRole = allowedRoles[0];
  }

  const session = getSession(req, expectedRole);
  if (!session) {
    res.status(401).json({ error: 'Unauthorized: Session missing or expired' });
    return null;
  }
  
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    return null;
  }
  
  return session;
}
