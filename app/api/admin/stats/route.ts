import { NextRequest, NextResponse } from 'next/server';
import { getDocs, collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// GET /api/admin/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's entries
    const todayQuery = query(
      collection(db, 'giveaway_entries'),
      where('date', '==', today)
    );
    const todaySnapshot = await getDocs(todayQuery);
    const todayCount = todaySnapshot.size;

    // Get all entries for total count
    const allQuery = query(collection(db, 'giveaway_entries'));
    const allSnapshot = await getDocs(allQuery);
    const totalCount = allSnapshot.size;

    // Get entries by status
    const pendingQuery = query(
      collection(db, 'giveaway_entries'),
      where('status', '==', 'pending')
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    const pendingCount = pendingSnapshot.size;

    const verifiedQuery = query(
      collection(db, 'giveaway_entries'),
      where('status', '==', 'verified')
    );
    const verifiedSnapshot = await getDocs(verifiedQuery);
    const verifiedCount = verifiedSnapshot.size;

    const completedQuery = query(
      collection(db, 'giveaway_entries'),
      where('status', '==', 'completed')
    );
    const completedSnapshot = await getDocs(completedQuery);
    const completedCount = completedSnapshot.size;

    // Get recent entries (last 10)
    const recentQuery = query(
      collection(db, 'giveaway_entries'),
      orderBy('createdAt', 'desc')
    );
    const recentSnapshot = await getDocs(recentQuery);
    const recentEntries: any[] = [];
    
    recentSnapshot.forEach((doc) => {
      const data = doc.data();
      recentEntries.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || data.timestamp,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
      });
    });

    const stats = {
      totalUsers: totalCount,
      todayUsers: todayCount,
      pendingEntries: pendingCount,
      verifiedEntries: verifiedCount,
      completedEntries: completedCount,
      recentEntries: recentEntries.slice(0, 10), // Only first 10
    };

    return NextResponse.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 