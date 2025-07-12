import { NextRequest, NextResponse } from 'next/server';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// POST /api/otp/generate - Generate and send OTP
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name, email } = body;

    if (!phone || !name || !email) {
      return NextResponse.json(
        { success: false, error: 'Phone, name, and email are required' },
        { status: 400 }
      );
    }

    // Generate a 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    // Store OTP in database with expiration (5 minutes)
    const otpData = {
      phone,
      name,
      email,
      otp,
      createdAt: Timestamp.now(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      isUsed: false,
    };

    const docRef = await addDoc(collection(db, 'otp_codes'), otpData);

    // In a real app, you would integrate with SMS service here
    // For demo purposes, we'll just return the OTP
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      otpId: docRef.id,
      // In production, remove this line and use actual SMS
      demoOtp: otp,
    });
  } catch (error) {
    console.error('Error generating OTP:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate OTP' },
      { status: 500 }
    );
  }
} 