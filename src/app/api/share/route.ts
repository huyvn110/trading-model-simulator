import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.sessionData) {
      return NextResponse.json(
        { error: 'Thiếu dữ liệu sessionData' },
        { status: 400 }
      );
    }

    // Insert dữ liệu vào bảng shared_sessions
    const { data: insertedData, error } = await supabaseAdmin
      .from('shared_sessions')
      .insert([
        {
          session_data: data.sessionData
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Lỗi khi lưu lên Supabase:', error);
      return NextResponse.json(
        { error: 'Không thể lưu dữ liệu' },
        { status: 500 }
      );
    }

    // Trả về ID của link vừa tạo
    return NextResponse.json({ success: true, shareId: insertedData.id });
    
  } catch (err) {
    console.error('Lỗi server:', err);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống' },
      { status: 500 }
    );
  }
}
