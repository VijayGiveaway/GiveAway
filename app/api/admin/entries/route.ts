import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection, query, where, orderBy, limit, Timestamp, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET /api/admin/entries - Get all entries with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const limitParam = searchParams.get('limit');

    let q = query(collection(db, 'giveaway_entries'), orderBy('createdAt', 'desc'));

    // Add date filter if provided
    if (date) {
      q = query(q, where('date', '==', date));
    }

    // Add status filter if provided
    if (status) {
      q = query(q, where('status', '==', status));
    }

    // Add limit if provided
    if (limitParam) {
      q = query(q, limit(parseInt(limitParam)));
    }

    const querySnapshot = await getDocs(q);
    const entries: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      });
    });

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    console.error('Error fetching entries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}

// POST /api/admin/entries - Create a pending entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, date, status } = body;
    if (!name || !email || !phone || !date) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and date are required' },
        { status: 400 }
      );
    }
    // Check for duplicate entry for today
    const q = query(
      collection(db, 'giveaway_entries'),
      where('email', '==', email),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already entered today\'s giveaway' },
        { status: 400 }
      );
    }
    const now = Timestamp.now();
    const entry = {
      name,
      email,
      phone,
      date,
      status: status || 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(collection(db, 'giveaway_entries'), entry);
    return NextResponse.json({ success: true, entryId: docRef.id });
  } catch (error) {
    console.error('Error creating entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create entry' },
      { status: 500 }
    );
  }
} 