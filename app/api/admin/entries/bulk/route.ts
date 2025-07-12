import { NextRequest, NextResponse } from 'next/server';
import { writeBatch, doc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/admin/entries/bulk - Bulk operations
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, entryIds, status } = body;

    if (!operation || !entryIds || !Array.isArray(entryIds)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const batch = writeBatch(db);

    switch (operation) {
      case 'delete':
        // Bulk delete entries
        entryIds.forEach((entryId: string) => {
          const docRef = doc(db, 'giveaway_entries', entryId);
          batch.delete(docRef);
        });
        break;

      case 'updateStatus':
        // Bulk update status
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for update operation' },
            { status: 400 }
          );
        }
        entryIds.forEach((entryId: string) => {
          const docRef = doc(db, 'giveaway_entries', entryId);
          batch.update(docRef, { 
            status, 
            updatedAt: new Date() 
          });
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid operation' },
          { status: 400 }
        );
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `Bulk ${operation} completed successfully` 
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { success: false, error: 'Bulk operation failed' },
      { status: 500 }
    );
  }
} 