import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isAdminAuthenticated(request: NextRequest): boolean {
  const session = request.cookies.get('admin_session')?.value;
  if (!session) return false;
  try {
    const decoded = JSON.parse(Buffer.from(session, 'base64').toString('utf-8'));
    return decoded.email === 'admin@portstudio.in' && decoded.role === 'admin';
  } catch {
    return false;
  }
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();

  try {
    // Fetch all data in parallel
    const [
      profilesRes,
      pitchesRes,
      conversationsRes,
      messagesRes,
      notificationsRes,
    ] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('talent_pitches').select('*, profiles(full_name, username, avatar_url)').order('created_at', { ascending: false }),
      supabase.from('conversations').select('*'),
      supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    const profiles = profilesRes.data || [];
    const pitches = pitchesRes.data || [];
    const conversations = conversationsRes.data || [];
    const messages = messagesRes.data || [];
    const notifications = notificationsRes.data || [];

    // Compute stats
    const totalUsers = profiles.length;
    const talentUsers = profiles.filter((p: any) => p.account_type === 'talent' || !p.account_type).length;
    const companyUsers = profiles.filter((p: any) => p.account_type === 'company').length;
    const premiumUsers = profiles.filter((p: any) => p.subscription_tier && p.subscription_tier !== 'free').length;
    const totalPitches = pitches.length;
    const totalConversations = conversations.length;
    const totalMessages = messages.length;

    return NextResponse.json({
      stats: {
        totalUsers,
        talentUsers,
        companyUsers,
        premiumUsers,
        totalPitches,
        totalConversations,
        totalMessages,
      },
      profiles,
      pitches,
      conversations,
      messages,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
