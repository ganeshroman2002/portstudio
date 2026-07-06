import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';
    
    // Create the expected signature
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ status: 'success', message: 'Payment verified successfully' });
    } else {
      return NextResponse.json(
        { status: 'failure', message: 'Invalid payment signature' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return NextResponse.json(
      { status: 'failure', message: 'Error verifying payment' },
      { status: 500 }
    );
  }
}
