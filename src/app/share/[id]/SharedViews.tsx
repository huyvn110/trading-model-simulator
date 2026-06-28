'use client';

import React from 'react';
import { Box, Container, Typography, Paper, Stack, Grid } from '@mui/material';
import { TopMetrics } from '@/components/shared/TopMetrics';
import { EquityChart } from '@/components/shared/EquityChart';
import { TradingCalendar } from '@/components/shared/TradingCalendar';
import { NotionEditor } from '@/components/shared/NotionEditor';

// Bố cục trang dành cho việc share 1 Trade (Lệnh đơn)
export function SharedTradeView({ trade }: { trade: any }) {
    // Tái cấu trúc lại dữ liệu cho giống TestTrade
    const hasContent = trade.content || trade.notes || trade.images;
    
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, bgcolor: '#111827', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#60a5fa' }}>
                    Chi tiết Giao dịch
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
                    Được chia sẻ từ Trade Tracker
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#1e2537', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>KẾT QUẢ</Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: trade.result === 'win' ? '#4ade80' : '#fb7185' }}>
                                {trade.result === 'win' ? 'WIN' : 'LOSS'}
                                {trade.pnl !== undefined ? ` ($${trade.pnl})` : trade.rr !== undefined ? ` (${trade.rr}R)` : ''}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#1e2537', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>THỜI GIAN</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, color: '#f8fafc' }}>
                                {trade.tradeDate || new Date(trade.timestamp).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2.5, bgcolor: '#1e2537', borderRadius: 2 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>THỊ TRƯỜNG / SESSION</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, mt: 1, color: '#f8fafc' }}>
                                {trade.market || 'Unknown'} - {trade.session || 'N/A'}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {hasContent && (
                    <Box sx={{ mt: 4, pt: 4, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Ghi chú & Hình ảnh</Typography>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', p: 3, borderRadius: 2 }}>
                            {/* Chế độ readOnly để ẩn đi các thanh công cụ Edit */}
                            <NotionEditor 
                                blocks={trade.content || []} 
                                onChange={() => {}} 
                                readOnly={true} 
                            />
                        </Box>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

// Bố cục trang dành cho việc share cả Session (Thống kê)
export function SharedSessionView({ session }: { session: any }) {
    const transformedTrades = session.trades?.map((t: any) => ({
        timestamp: t.timestamp,
        tradeDate: t.tradeDate,
        result: t.result,
        measurementValue: t.measurementValue,
        pnl: t.pnl,
        rr: t.rr,
    })) || [];

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: '#3b82f6' }}>
                    Thống kê Giao dịch
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    {session.name || 'Test Session'}
                </Typography>
            </Box>

            <Stack spacing={4}>
                <TopMetrics 
                    trades={transformedTrades} 
                    initialBalance={session.initialBalance || 0} 
                    measurementMode={session.measurementMode || '$'} 
                />

                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
                            <EquityChart 
                                trades={transformedTrades} 
                                initialBalance={session.initialBalance || 0} 
                                measurementMode={session.measurementMode || '$'} 
                            />
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%', bgcolor: 'background.paper' }}>
                            <TradingCalendar 
                                trades={transformedTrades} 
                                measurementMode={session.measurementMode || '$'} 
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Stack>
        </Container>
    );
}
