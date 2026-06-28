import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Box } from '@mui/material';
import { SharedTradeView, SharedSessionView } from './SharedViews';

// Hàm lấy dữ liệu từ Supabase (Chạy trên Server)
async function getSharedData(id: string) {
    const { data, error } = await supabaseAdmin
        .from('shared_sessions')
        .select('session_data')
        .eq('id', id)
        .single();

    if (error || !data) {
        return null;
    }
    return data.session_data;
}

export default async function SharedPage({ params }: { params: { id: string } }) {
    const payload = await getSharedData(params.id);

    if (!payload) {
        notFound(); // Trả về trang 404 nếu link sai
    }

    const { type, data } = payload;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#020617' }}>
            {type === 'trade' ? (
                <SharedTradeView trade={data} />
            ) : (
                <SharedSessionView session={data} />
            )}
        </Box>
    );
}
