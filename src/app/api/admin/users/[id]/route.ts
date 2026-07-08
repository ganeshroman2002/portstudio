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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceClient();

  try {
    // Delete from profiles (cascades to portfolios, experiences, etc.)
    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
