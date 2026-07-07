import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const isNewUser = (Date.now() - new Date(user.created_at).getTime()) < 60000
        
        if (isNewUser) {
          const cookieStore = await cookies()
          const role = cookieStore.get('signup_role')?.value
          
          if (role === 'company') {
            return NextResponse.redirect(`${origin}/company-setup`)
          }
          return NextResponse.redirect(`${origin}/onboarding`)
        }
        
        // Returning user check
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('id', user.id)
          .single();
          
        const isCompany = user.user_metadata?.role === 'company' || profile?.account_type === 'company';
          
        if (isCompany) {
          return NextResponse.redirect(`${origin}/company`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there's an error or no code, redirect back to auth page
  return NextResponse.redirect(`${origin}/auth?error=Could not authenticate with Google`)
}
