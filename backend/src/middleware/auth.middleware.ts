import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawHeader = (req.headers.authorization || req.headers.Authorization || '') as string;
    const authHeader = rawHeader.trim();

    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      res.status(401).json({ success: false, message: 'No authorization token provided' });
      return;
    }

    const token = authHeader.split(/\s+/)[1];
    if (!token) {
      res.status(401).json({ success: false, message: 'No authorization token provided' });
      return;
    }

    // Verify Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;

    // Find user in MongoDB
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    // Fallback: search by email from decoded token if firebaseUid hasn't synced yet
    if (!user && decodedToken.email) {
      user = await User.findOne({ email: decodedToken.email.toLowerCase() });
      if (user) {
        user.firebaseUid = decodedToken.uid;
        await user.save();
      }
    }

    if (!user) {
      res.status(401).json({ success: false, message: 'User not found. Please register first.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, message: 'Account is suspended. Contact support.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/id-token-expired') {
      res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    } else if (err.code === 'auth/argument-error' || err.code === 'auth/invalid-id-token') {
      res.status(401).json({ success: false, message: 'Invalid token.' });
    } else {
      res.status(401).json({ success: false, message: 'Authentication failed.' });
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    const decodedToken = await getAuth().verifyIdToken(token);
    req.firebaseUid = decodedToken.uid;
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user && user.isActive) {
      req.user = user;
    }
  } catch {
    // silently ignore invalid tokens for optional auth
  }
  next();
};
