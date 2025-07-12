import { NextRequest, NextResponse } from 'next/server';
import { getDocs, query, where, updateDoc, doc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/otp/verify - Verify OTP and create entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp, upiId } = body;

    if (!phone || !otp || !upiId) {
      return NextResponse.json(
        { success: false, error: 'Phone, OTP, and UPI ID are required' },
        { status: 400 }
      );
    }

    // Find the OTP record
    const otpQuery = query(
      collection(db, 'otp_codes'),
      where('phone', '==', phone),
      where('otp', '==', otp),
      where('isUsed', '==', false)
    );

    const otpSnapshot = await getDocs(otpQuery);
    
    if (otpSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid OTP or OTP already used' },
        { status: 400 }
      );
    }

    const otpDoc = otpSnapshot.docs[0];
    const otpData = otpDoc.data();

    // Check if OTP is expired
    const now = new Date();
    const expiresAt = otpData.expiresAt.toDate();
    
    if (now > expiresAt) {
      return NextResponse.json(
        { success: false, error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Check if user already entered today
    const today = new Date().toISOString().split('T')[0];
    const existingEntryQuery = query(
      collection(db, 'giveaway_entries'),
      where('email', '==', otpData.email),
      where('date', '==', today)
    );

    const existingEntrySnapshot = await getDocs(existingEntryQuery);
    
    if (!existingEntrySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'You have already entered today\'s giveaway' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await updateDoc(doc(db, 'otp_codes', otpDoc.id), {
      isUsed: true,
      usedAt: Timestamp.now(),
    });

    // Create giveaway entry
    const entryData = {
      name: otpData.name,
      email: otpData.email,
      phone: otpData.phone,
      upiId,
      otp,
      date: today,
      timestamp: Timestamp.now(),
      status: 'verified',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const entryRef = await addDoc(collection(db, 'giveaway_entries'), entryData);

    return NextResponse.json({
      success: true,
      message: 'Entry verified and created successfully',
      entryId: entryRef.id,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
} 