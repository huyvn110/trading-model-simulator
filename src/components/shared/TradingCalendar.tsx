'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Stack, Tooltip, useTheme, alpha } from '@mui/material';
import {
    ChevronLeft as PrevIcon,
    ChevronRight as NextIcon,
    CalendarMonth as CalIcon,
} from '@mui/icons-material';

interface Trade {
    timestamp: number;
    tradeDate?: string;
    result: 'win' | 'lose';
    measurementValue: number;
    pnl?: number;
    rr?: number;
}

interface TradingCalendarProps {
    trades: Trade[];
    measurementMode: 'RR' | '$' | '%';
}

interface DayData {
    date: string;
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
}

const MONTH_NAMES = [
    'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
    'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];
const DAY_NAMES = ['CN','T2','T3','T4','T5','T6','T7'];

export function TradingCalendar({ trades, measurementMode }: TradingCalendarProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const today = new Date();
    const [month, setMonth] = React.useState(today.getMonth());
    const [year, setYear]   = React.useState(today.getFullYear());

    const calendarData = useMemo(() => {
        const getValue = (t: Trade) => {
            if (measurementMode === '$') return t.pnl !== undefined ? t.pnl : t.measurementValue;
            if (measurementMode === 'RR') return t.rr !== undefined ? t.rr : t.measurementValue;
            return t.measurementValue;
        };

        const map: Record<string, DayData> = {};
        trades.forEach(t => {
            const ds = t.tradeDate || new Date(t.timestamp).toISOString().split('T')[0];
            if (!map[ds]) map[ds] = { date: ds, trades: 0, wins: 0, losses: 0, pnl: 0 };
            map[ds].trades++;
            if (t.result === 'win') { map[ds].wins++; map[ds].pnl += getValue(t); }
            else { map[ds].losses++; map[ds].pnl -= getValue(t); }
        });
        return map;
    }, [trades, measurementMode]);

    // Monthly summary for current month
    const monthlySummary = useMemo(() => {
        const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        let totalTrades = 0, totalWins = 0, totalLosses = 0, totalPnl = 0;
        Object.values(calendarData).forEach(d => {
            if (d.date.startsWith(prefix)) {
                totalTrades += d.trades; totalWins += d.wins;
                totalLosses += d.losses; totalPnl += d.pnl;
            }
        });
        return { totalTrades, totalWins, totalLosses, totalPnl };
    }, [calendarData, month, year]);

    const daysInMonth  = new Date(year, month + 1, 0).getDate();
    const firstDay     = new Date(year, month, 1).getDay();
    const todayStr     = today.toISOString().split('T')[0];

    const fmt = (v: number) => {
        if (measurementMode === '$') return `$${v.toFixed(0)}`;
        if (measurementMode === '%') return `${v.toFixed(1)}%`;
        return `${v.toFixed(1)}R`;
    };

    const prevMonth = () => {
        if (month === 0) { setMonth(11); setYear(y => y - 1); }
        else setMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (month === 11) { setMonth(0); setYear(y => y + 1); }
        else setMonth(m => m + 1);
    };

    // Color helpers
    const bg         = isDark ? 'rgba(15,22,41,0.9)' : 'rgba(248,250,255,0.9)';
    const border     = isDark ? 'rgba(241,245,249,0.08)' : 'rgba(15,23,42,0.08)';
    const textMuted  = isDark ? 'rgba(100,116,139,0.8)' : '#94a3b8';

    return (
        <Box sx={{
            p: 2.5, borderRadius: 3,
            background: isDark
                ? 'linear-gradient(135deg, rgba(15,22,41,0.9) 0%, rgba(10,14,26,0.95) 100%)'
                : 'linear-gradient(135deg, rgba(248,250,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
            border: `1px solid ${border}`,
            backdropFilter: 'blur(8px)',
        }}>
            {/* ── Header ── */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CalIcon sx={{ fontSize: 18, color: '#529aec' }} />
                    <Typography sx={{
                        fontWeight: 700, fontSize: '0.95rem',
                        background: 'linear-gradient(90deg, #529aec 0%, #a78bfa 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        {MONTH_NAMES[month]} {year}
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5}>
                    <Box onClick={prevMonth} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 2, cursor: 'pointer',
                        border: `1px solid ${border}`,
                        bgcolor: isDark ? 'rgba(241,245,249,0.05)' : 'rgba(15,23,42,0.04)',
                        color: 'text.secondary', transition: 'all 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(241,245,249,0.1)' : 'rgba(15,23,42,0.08)', color: 'text.primary' },
                    }}>
                        <PrevIcon sx={{ fontSize: 16 }} />
                    </Box>
                    <Box onClick={nextMonth} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28, borderRadius: 2, cursor: 'pointer',
                        border: `1px solid ${border}`,
                        bgcolor: isDark ? 'rgba(241,245,249,0.05)' : 'rgba(15,23,42,0.04)',
                        color: 'text.secondary', transition: 'all 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(241,245,249,0.1)' : 'rgba(15,23,42,0.08)', color: 'text.primary' },
                    }}>
                        <NextIcon sx={{ fontSize: 16 }} />
                    </Box>
                </Stack>
            </Stack>

            {/* ── Day names ── */}
            <Stack direction="row" sx={{ mb: 0.75 }}>
                {DAY_NAMES.map(d => (
                    <Box key={d} sx={{ flex: 1, textAlign: 'center' }}>
                        <Typography sx={{
                            fontSize: '0.67rem', fontWeight: 700,
                            color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            {d}
                        </Typography>
                    </Box>
                ))}
            </Stack>

            {/* ── Calendar grid ── */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                    <Box key={`e-${i}`} sx={{ width: `${100 / 7}%`, aspectRatio: '1 / 1.2' }} />
                ))}

                {/* Days */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const d  = calendarData[ds];
                    const isToday  = ds === todayStr;
                    const hasTrade = !!d;
                    const isWin  = hasTrade && d.pnl > 0;
                    const isLoss = hasTrade && d.pnl < 0;

                    const cellBg = hasTrade
                        ? isWin
                            ? isDark ? alpha('#10b981', 0.18) : alpha('#10b981', 0.1)
                            : isLoss
                                ? isDark ? alpha('#f43f5e', 0.18) : alpha('#f43f5e', 0.1)
                                : isDark ? alpha('#64748b', 0.15) : alpha('#64748b', 0.08)
                        : 'transparent';

                    const cellBorder = isToday
                        ? '2px solid #529aec'
                        : hasTrade
                            ? `1px solid ${isWin ? alpha('#10b981', 0.35) : isLoss ? alpha('#f43f5e', 0.35) : alpha('#64748b', 0.2)}`
                            : `1px solid transparent`;

                    return (
                        <Tooltip
                            key={day}
                            arrow
                            title={hasTrade ? (
                                <Box sx={{ fontSize: '0.75rem' }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                        {day}/{month + 1}/{year}
                                    </Typography>
                                    <Box>📊 {d.trades} trades | ✅ {d.wins} | ❌ {d.losses}</Box>
                                    <Box sx={{ color: d.pnl >= 0 ? '#34d399' : '#fb7185', fontWeight: 700 }}>
                                        P/L: {d.pnl >= 0 ? '+' : ''}{fmt(d.pnl)}
                                    </Box>
                                </Box>
                            ) : `${day}/${month + 1}`}
                        >
                            <Box sx={{
                                width: `${100 / 7}%`, aspectRatio: '1 / 1.2',
                                p: 0.25, display: 'flex', flexDirection: 'column',
                                alignItems: 'center', justifyContent: 'center',
                                cursor: hasTrade ? 'pointer' : 'default',
                            }}>
                                <Box sx={{
                                    width: '100%', height: '100%',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    borderRadius: 1.5,
                                    bgcolor: cellBg,
                                    border: cellBorder,
                                    transition: 'all 0.15s ease',
                                    '&:hover': hasTrade ? {
                                        bgcolor: isWin
                                            ? alpha('#10b981', 0.25)
                                            : isLoss ? alpha('#f43f5e', 0.25) : alpha('#64748b', 0.2),
                                        transform: 'scale(1.05)',
                                    } : {},
                                    gap: 0.25,
                                }}>
                                    {/* Day number */}
                                    <Typography sx={{
                                        fontSize: '0.75rem',
                                        fontWeight: isToday ? 800 : 500,
                                        color: isToday
                                            ? '#529aec'
                                            : isDark ? 'rgba(241,245,249,0.85)' : '#0f172a',
                                        lineHeight: 1,
                                    }}>
                                        {day}
                                    </Typography>

                                    {/* Trade dots */}
                                    {hasTrade && (
                                        <Stack direction="row" spacing={0.25} justifyContent="center" flexWrap="wrap">
                                            {Array.from({ length: Math.min(d.wins, 3) }).map((_, i) => (
                                                <Box key={`w${i}`} sx={{
                                                    width: 4, height: 4, borderRadius: '50%',
                                                    bgcolor: '#10b981',
                                                    boxShadow: '0 0 4px rgba(16,185,129,0.6)',
                                                }} />
                                            ))}
                                            {Array.from({ length: Math.min(d.losses, 3) }).map((_, i) => (
                                                <Box key={`l${i}`} sx={{
                                                    width: 4, height: 4, borderRadius: '50%',
                                                    bgcolor: '#f43f5e',
                                                    boxShadow: '0 0 4px rgba(244,63,94,0.6)',
                                                }} />
                                            ))}
                                        </Stack>
                                    )}

                                    {/* PnL value */}
                                    {hasTrade && (
                                        <Typography sx={{
                                            fontSize: '0.55rem', fontWeight: 700, lineHeight: 1,
                                            color: isWin ? '#10b981' : isLoss ? '#f43f5e' : textMuted,
                                            fontFamily: '"JetBrains Mono", monospace',
                                        }}>
                                            {d.pnl >= 0 ? '+' : ''}{fmt(d.pnl)}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            {/* ── Monthly Summary ── */}
            {monthlySummary.totalTrades > 0 && (
                <Box sx={{
                    mt: 2, pt: 2,
                    borderTop: `1px solid ${border}`,
                }}>
                    <Stack direction="row" justifyContent="space-around">
                        {[
                            { label: 'Trades', value: monthlySummary.totalTrades, color: '#529aec' },
                            { label: 'Thắng', value: monthlySummary.totalWins, color: '#10b981' },
                            { label: 'Thua', value: monthlySummary.totalLosses, color: '#f43f5e' },
                            {
                                label: 'P/L',
                                value: `${monthlySummary.totalPnl >= 0 ? '+' : ''}${fmt(monthlySummary.totalPnl)}`,
                                color: monthlySummary.totalPnl >= 0 ? '#10b981' : '#f43f5e',
                            },
                        ].map(item => (
                            <Box key={item.label} sx={{ textAlign: 'center' }}>
                                <Typography sx={{
                                    fontSize: '0.85rem', fontWeight: 800,
                                    color: item.color, fontFamily: '"JetBrains Mono", monospace',
                                }}>
                                    {item.value}
                                </Typography>
                                <Typography sx={{ fontSize: '0.65rem', color: textMuted, fontWeight: 600 }}>
                                    {item.label}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            )}
        </Box>
    );
}

export default TradingCalendar;
