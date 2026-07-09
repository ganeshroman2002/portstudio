import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

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
      const authHeader = req.headers.get('Authorization');
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: authHeader || ''
          }
        }
      });
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (user) {
        // Fetch current profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('available_pitches, purchased_pitches')
          .eq('id', user.id)
          .single();

        const currentPitches = profile?.available_pitches ?? 3;
        const currentPurchased = profile?.purchased_pitches ?? 0;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            available_pitches: currentPitches + 3,
            purchased_pitches: currentPurchased + 3,
            subscription_tier: 'premium'
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error("Failed to update profile pitches:", updateError);
        }
      } else {
        console.error("User not found in verify route:", userError);
      }

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
