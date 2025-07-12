// lib/database.ts
import { collection, addDoc, doc, updateDoc, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface GiveawayEntry {
  id?: string;
  name: string;
  email: string;
  phone: string;
  upiId: string;
  otp: string;
  date: string;
  timestamp: Timestamp;
  status: 'pending' | 'verified' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Collection reference
const ENTRIES_COLLECTION = 'giveaway_entries';

// Add a new giveaway entry
export const addGiveawayEntry = async (entryData: Omit<GiveawayEntry, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = Timestamp.now();
    const entry: Omit<GiveawayEntry, 'id'> = {
      ...entryData,
      timestamp: now,
      createdAt: now,
      updatedAt: now
    };

    const docRef = await addDoc(collection(db, ENTRIES_COLLECTION), entry);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding giveaway entry:', error);
    return { success: false, error: error };
  }
};

// Update an existing entry
export const updateGiveawayEntry = async (id: string, updates: Partial<GiveawayEntry>) => {
  try {
    const docRef = doc(db, ENTRIES_COLLECTION, id);
    const updateData = {
      ...updates,
      updatedAt: Timestamp.now()
    };
    
    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating giveaway entry:', error);
    return { success: false, error: error };
  }
};

// Get entries for today
export const getTodaysEntries = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, ENTRIES_COLLECTION),
      where('date', '==', today),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const entries: GiveawayEntry[] = [];
    
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() } as GiveawayEntry);
    });
    
    return { success: true, entries };
  } catch (error) {
    console.error('Error getting today\'s entries:', error);
    return { success: false, error: error, entries: [] };
  }
};

// Get total entries count for today
export const getTodaysEntryCount = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, ENTRIES_COLLECTION),
      where('date', '==', today)
    );
    
    const querySnapshot = await getDocs(q);
    return { success: true, count: querySnapshot.size };
  } catch (error) {
    console.error('Error getting today\'s entry count:', error);
    return { success: false, error: error, count: 0 };
  }
};

// Check if email already entered today
export const checkTodaysEntry = async (email: string) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, ENTRIES_COLLECTION),
      where('email', '==', email),
      where('date', '==', today),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    return { success: true, exists: !querySnapshot.empty };
  } catch (error) {
    console.error('Error checking today\'s entry:', error);
    return { success: false, error: error, exists: false };
  }
};