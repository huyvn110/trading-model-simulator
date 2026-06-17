import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/authOptions';
import { supabaseAdmin } from '@/lib/supabase';

// Helper: Lấy hoặc tạo root folder "Trading Simulator Images"
async function getRootFolder(drive: any, email: string): Promise<string> {
  const { data: saved } = await supabaseAdmin
    .from('user_stores')
    .select('state')
    .eq('email', email)
    .eq('store_name', '_drive_folder_id')
    .single();

  if (saved?.state?.folderId) {
    try {
      const check = await drive.files.get({ fileId: saved.state.folderId, fields: 'id, trashed' });
      if (!check.data.trashed) return saved.state.folderId;
    } catch { /* folder đã bị xóa, tạo lại */ }
  }

  const created = await drive.files.create({
    requestBody: { name: 'Trading Simulator Images', mimeType: 'application/vnd.google-apps.folder' },
    fields: 'id',
  });
  const folderId = created.data.id!;

  await supabaseAdmin.from('user_stores').upsert({
    email, store_name: '_drive_folder_id',
    state: { folderId }, updated_at: new Date().toISOString(),
  }, { onConflict: 'email, store_name' });

  return folderId;
}

// Helper: Lấy hoặc tạo session subfolder
async function getSessionFolder(drive: any, email: string, rootFolderId: string, sessionId: string, sessionName: string): Promise<string> {
  const storeKey = `_session_folder_${sessionId}`;

  const { data: saved } = await supabaseAdmin
    .from('user_stores')
    .select('state')
    .eq('email', email)
    .eq('store_name', storeKey)
    .single();

  if (saved?.state?.folderId) {
    try {
      const check = await drive.files.get({ fileId: saved.state.folderId, fields: 'id, trashed' });
      if (!check.data.trashed) return saved.state.folderId;
    } catch { /* folder đã bị xóa, tạo lại */ }
  }

  const created = await drive.files.create({
    requestBody: {
      name: sessionName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [rootFolderId],
    },
    fields: 'id',
  });
  const folderId = created.data.id!;

  await supabaseAdmin.from('user_stores').upsert({
    email, store_name: storeKey,
    state: { folderId }, updated_at: new Date().toISOString(),
  }, { onConflict: 'email, store_name' });

  return folderId;
}

// Helper: Tạo Drive client từ session
function createDriveClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth: oauth2Client });
}

// Helper: Trích xuất fileId từ URL Drive
function extractFileIdFromUrl(url: string): string | null {
  // Format: https://drive.google.com/thumbnail?id=XXXXX&sz=w1600
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

// ==================== POST: Upload ảnh ====================
export async function POST(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;
    const sessionName = formData.get('sessionName') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const drive = createDriveClient(session.accessToken);
    const rootFolderId = await getRootFolder(drive, email);

    // Nếu có sessionId thì upload vào subfolder của phiên, không thì vào root
    let targetFolderId = rootFolderId;
    if (sessionId && sessionName) {
      targetFolderId = await getSessionFolder(drive, email, rootFolderId, sessionId, sessionName);
    }

    // Chuẩn bị file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { Readable } = require('stream');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    // Upload
    const response = await drive.files.create({
      requestBody: {
        name: file.name || `trade_${Date.now()}.webp`,
        parents: [targetFolderId],
      },
      media: { mimeType: file.type || 'image/webp', body: stream },
      fields: 'id',
    });

    const fileId = response.data.id!;

    // Mở quyền xem công khai
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    return NextResponse.json({ success: true, url, fileId });

  } catch (error: any) {
    console.error('Upload error:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 });
  }
}

// ==================== DELETE: Xóa ảnh hoặc folder phiên ====================
export async function DELETE(request: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user.email.toLowerCase();
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');        // Xóa 1 ảnh
    const sessionId = searchParams.get('sessionId'); // Xóa cả folder phiên

    const drive = createDriveClient(session.accessToken);

    // Xóa 1 ảnh cụ thể
    if (imageUrl) {
      const fileId = extractFileIdFromUrl(imageUrl);
      if (fileId) {
        try {
          await drive.files.delete({ fileId });
        } catch (e: any) {
          console.log('File already deleted or not found:', fileId);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Xóa toàn bộ folder phiên
    if (sessionId) {
      const storeKey = `_session_folder_${sessionId}`;
      const { data: saved } = await supabaseAdmin
        .from('user_stores')
        .select('state')
        .eq('email', email)
        .eq('store_name', storeKey)
        .single();

      if (saved?.state?.folderId) {
        try {
          await drive.files.delete({ fileId: saved.state.folderId });
        } catch (e: any) {
          console.log('Session folder already deleted:', saved.state.folderId);
        }

        // Xóa record trong Supabase
        await supabaseAdmin
          .from('user_stores')
          .delete()
          .eq('email', email)
          .eq('store_name', storeKey);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing url or sessionId parameter' }, { status: 400 });

  } catch (error: any) {
    console.error('Delete error:', error?.message || error);
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 });
  }
}
