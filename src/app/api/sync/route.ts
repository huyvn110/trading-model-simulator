import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getServerSession } from "next-auth/next";

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const body = await request.json();
    const { storeName, state } = body;

    if (!storeName || !state) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('user_stores')
      .upsert({
        email,
        store_name: storeName,
        state,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'email, store_name'
      });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync data' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const { searchParams } = new URL(request.url);
    const storeName = searchParams.get('storeName');

    if (!storeName) {
      return NextResponse.json({ error: 'Missing storeName parameter' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('user_stores')
      .select('state')
      .eq('email', email)
      .eq('store_name', storeName)
      .single();

    // PGRST116 is "No rows returned"
    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      return NextResponse.json({ state: null });
    }

    return NextResponse.json({ state: data.state });

  } catch (error: any) {
    console.error('Sync fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
