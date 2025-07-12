import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET /api/admin/entries/[id] - Get a specific entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'giveaway_entries', params.id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { success: false, error: 'Entry not found' },
        { status: 404 }
      );
    }

    const data = docSnap.data();
    const entry = {
      id: docSnap.id,
      ...data,
      timestamp: data.timestamp?.toDate?.() || data.timestamp,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
    };

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Error fetching entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch entry' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/entries/[id] - Update an entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, ...updates } = body;

    const docRef = doc(db, 'giveaway_entries', params.id);
    const updateData = {
      ...updates,
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
    }

    await updateDoc(docRef, updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/entries/[id] - Delete an entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'giveaway_entries', params.id);
    await deleteDoc(docRef);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
} 