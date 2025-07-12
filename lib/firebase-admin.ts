// lib/firebase-admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
};

// Initialize Firebase Admin
export const adminApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseAdminConfig);
export const adminDb = getFirestore(adminApp);

// Admin functions for server-side operations
export async function getEntriesForAdmin() {
  try {
    const snapshot = await adminDb.collection('giveaway_entries').get();
    const entries = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return entries;
  } catch (error) {
    console.error('Error getting entries:', error);
    throw error;
  }
}

export async function deleteEntry(entryId: string) {
  try {
    await adminDb.collection('giveaway_entries').doc(entryId).delete();
    return { success: true };
  } catch (error) {
    console.error('Error deleting entry:', error);
    throw error;
  }
}