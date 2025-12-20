import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'mon_super_secret_jwt_123';

export function generateInvitationToken(email: string, role: string): string {
  return jwt.sign(
    { email, role, type: 'invitation' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyInvitationToken(token: string): { email: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'invitation') return null;
    return { email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}