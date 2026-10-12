import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth as getFirebaseAuth } from 'firebase-admin/auth';
import fs from 'node:fs';
import path from 'node:path';

let initialized = false;

export const initializeFirebase = (): void => {
  if (initialized) return;

  let credentialData: any;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error('file does not exist');
      }
      credentialData = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    } catch (err) {
      console.warn(`⚠️ Could not load service account from ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH}`);
    }
  } 
  
  if (!credentialData) {
    const projectId = process.env.FIREBASE_PROJECT_ID || 'grocery-14969';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (clientEmail && privateKey && privateKey !== 'your-private-key' && privateKey !== '"your-private-key"') {
      credentialData = { projectId, clientEmail, privateKey };
    }
  }

  try {
    if (credentialData) {
      initializeApp({
        credential: cert(credentialData),
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ Firebase Admin credentials missing. Server will run, but authentication routes will fail.');
      // Initialize without credentials so it doesn't crash the server on boot
      initializeApp({ projectId: 'grocery-14969' });
    }
  } catch (err: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
  }

  initialized = true;
};

export const getAuth = () => getFirebaseAuth();
