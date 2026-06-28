'use client';

import React, { useMemo } from 'react';
import { Box, Typography, Stack, useTheme, alpha } from '@mui/material';
import {
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Timeline as TimelineIcon,
    LocalFireDepartment as FireIcon,
    AccountBalance as BalanceIcon,
    SwapVert as SwapVertIcon,
} from '@mui/icons-material';

interface Trade {
    timestamp: number;
    tradeDate?: string;
    result: 'win' | 'lose';
    measurementValue: number;
    pnl?: number;
    rr?: number;
}

interface TopMetricsProps {
    trades: Trade[];
    initialBalance: number;
    measurementMode: 'RR' | '$' | '%';
}

// ─── Sparkline mini SVG ───────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 60, h = 24;
    const points = data.map((v, i) => ({
        x: (i / (data.length - 1)) * w,
        y: h - ((v - min) / range) * h,
    }));
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const fill = `${d} L ${w} ${h} L 0 ${h} Z`;

    return (
        <svg width={w} height={h} style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.35 }}>
            <defs>
                <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={fill} fill={`url(#sg-${color.replace('#', '')})`} />
            <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

// ─── Metric Card ──────────────────────────────────────────────────────────────
interface MetricCardProps {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
    trend?: number; // positive = up, negative = down
    sparkData?: number[];
}

function MetricCard({ icon, label, value, subValue, color, trend, sparkData }: MetricCardProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            className="hover-lift"
            sx={{
                flex: 1,
                minWidth: 130,
                p: 2,
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                background: isDark
                    ? `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha('#0f1629', 0.9)} 100%)`
                    : `linear-gradient(135deg, ${alpha(color, 0.07)} 0%, ${alpha('#ffffff', 0.9)} 100%)`,
                border: `1px solid ${alpha(color, isDark ? 0.2 : 0.15)}`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.25s ease',
                '&:hover': {
                    border: `1px solid ${alpha(color, 0.4)}`,
                    boxShadow: `0 8px 24px ${alpha(color, 0.2)}`,
                },
            }}
        >
            {/* Top accent line */}
            <Box sx={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${color} 0%, transparent 100%)`,
            }} />

            {/* Header row */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" alignItems="center" spacing={0.75}>
                    <Box sx={{
                        color,
                        display: 'flex',
                        fontSize: 17,
                        filter: `drop-shadow(0 0 4px ${alpha(color, 0.5)})`,
                    }}>
                        {icon}
                    </Box>
                    <Typography variant="caption" sx={{
                        color: isDark ? 'rgba(148,163,184,0.8)' : 'text.secondary',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                    }}>
                        {label}
                    </Typography>
                </Stack>

                {/* Trend indicator */}
                {trend !== undefined && (
                    <Stack direction="row" alignItems="center" spacing={0.25}
                        sx={{
                            px: 0.75, py: 0.25, borderRadius: 2,
                            bgcolor: trend >= 0 ? alpha('#10b981', 0.15) : alpha('#f43f5e', 0.15),
                        }}>
                        {trend >= 0
                            ? <TrendingUpIcon sx={{ fontSize: 11, color: '#10b981' }} />
                            : <TrendingDownIcon sx={{ fontSize: 11, color: '#f43f5e' }} />}
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: trend >= 0 ? '#10b981' : '#f43f5e' }}>
                            {Math.abs(trend).toFixed(1)}%
                        </Typography>
                    </Stack>
                )}
            </Stack>

            {/* Main value */}
            <Typography
                className="num"
                sx={{
                    fontWeight: 800,
                    fontSize: '1.4rem',
                    letterSpacing: '-0.03em',
                    color: isDark ? 'rgba(241, 245, 249, 0.95)' : '#0f172a',
                    lineHeight: 1.1,
                    mb: 0.5,
                }}
            >
                {value}
            </Typography>

            {subValue && (
                <Typography variant="caption" sx={{
                    color: isDark ? 'rgba(100,116,139,0.9)' : 'text.secondary',
                    fontSize: '0.72rem',
                    fontWeight: 500,
                }}>
                    {subValue}
                </Typography>
            )}

            {/* Sparkline */}
            {sparkData && <Sparkline data={sparkData} color={color} />}
        </Box>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TopMetrics({ trades, initialBalance, measurementMode }: TopMetricsProps) {
    const metrics = useMemo(() => {
        if (trades.length === 0) return null;

        const wins   = trades.filter(t => t.result === 'win');
        const losses = trades.filter(t => t.result === 'lose');
        const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;

        const getValue = (t: Trade) => {
            if (measurementMode === '$') return Math.abs(t.pnl !== undefined ? t.pnl : t.measurementValue);
            if (measurementMode === 'RR') return Math.abs(t.rr !== undefined ? t.rr : t.measurementValue);
            return Math.abs(t.measurementValue);
        };

        // P&L
        let pnl = 0;
        let currentBalance = initialBalance;
        if (measurementMode === '%') {
            let bal = initialBalance;
            trades.forEach(t => {
                bal *= t.result === 'win'
                    ? (1 + getValue(t) / 100)
                    : (1 - getValue(t) / 100);
            });
            currentBalance = bal;
            pnl = currentBalance - initialBalance;
        } else {
            trades.forEach(t => { pnl += t.result === 'win' ? getValue(t) : -getValue(t); });
            if (measurementMode === '$') currentBalance = initialBalance + pnl;
            else currentBalance = initialBalance + pnl;
        }

        // Win/Loss ratio
        const avgWin  = wins.length > 0 ? wins.reduce((s, t) => s + getValue(t), 0) / wins.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + getValue(t), 0) / losses.length : 1;
        const winLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin;

        // Today
        const today = new Date().toISOString().split('T')[0];
        const todayTrades = trades.filter(t => (t.tradeDate || new Date(t.timestamp).toISOString().split('T')[0]) === today);
        const dailyWinRate = todayTrades.length > 0
            ? (todayTrades.filter(t => t.result === 'win').length / todayTrades.length) * 100
            : 0;

        // Streak
        let streak = 0;
        let streakType: 'win' | 'lose' | null = null;
        for (let i = trades.length - 1; i >= 0; i--) {
            if (!streakType) { streakType = trades[i].result; streak = 1; }
            else if (trades[i].result === streakType) streak++;
            else break;
        }
        const winStreak = streakType === 'win' ? streak : -streak;

        // Trend: compare first half vs second half winrate
        const half = Math.floor(trades.length / 2);
        let trend: number | undefined;
        if (half > 0) {
            const firstHalfWR = (trades.slice(0, half).filter(t => t.result === 'win').length / half) * 100;
            const secondHalfWR = (trades.slice(half).filter(t => t.result === 'win').length / (trades.length - half)) * 100;
            trend = secondHalfWR - firstHalfWR;
        }

        // Sparkline: rolling 8-trade winrate
        const sparkData = trades.slice(-10).reduce<number[]>((acc, _, i, arr) => {
            const slice = arr.slice(0, i + 1);
            acc.push((slice.filter(t => t.result === 'win').length / slice.length) * 100);
            return acc;
        }, []);

        // Balance sparkline
        const balanceSpark: number[] = [initialBalance];
        let bal = initialBalance;
        trades.slice(-10).forEach(t => {
            if (measurementMode === '$' || measurementMode === 'RR') {
                bal += t.result === 'win' ? getValue(t) : -getValue(t);
            } else {
                bal *= t.result === 'win' ? (1 + getValue(t) / 100) : (1 - getValue(t) / 100);
            }
            balanceSpark.push(bal);
        });

        return {
            winRate, dailyWinRate, winLossRatio, winStreak,
            currentBalance, pnl, trend, sparkData, balanceSpark,
            winsCount: wins.length, totalCount: trades.length,
        };
    }, [trades, initialBalance, measurementMode]);

    const fmt = (val: number) => {
        if (measurementMode === '$') return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (measurementMode === '%') return `${val.toFixed(2)}%`;
        return `${val.toFixed(2)}R`;
    };

    if (!metrics) {
        return (
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                <Typography variant="body2">Chưa có dữ liệu để hiển thị metrics</Typography>
            </Box>
        );
    }

    return (
        <Stack
            direction="row"
            spacing={1.5}
            className="stagger-children"
            sx={{
                overflowX: 'auto',
                pb: 1,
                '&::-webkit-scrollbar': { height: 4 },
                '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
            }}
        >
            <MetricCard
                icon={<TrendingUpIcon />}
                label="Winrate"
                value={`${metrics.winRate.toFixed(1)}%`}
                subValue={`${metrics.winsCount}/${metrics.totalCount} trades`}
                color="#10b981"
                trend={metrics.trend}
                sparkData={metrics.sparkData}
            />
            <MetricCard
                icon={<TimelineIcon />}
                label="Daily WR"
                value={`${metrics.dailyWinRate.toFixed(1)}%`}
                subValue="Hôm nay"
                color="#529aec"
            />
            <MetricCard
                icon={<SwapVertIcon />}
                label="Avg W/L"
                value={metrics.winLossRatio.toFixed(2)}
                subValue="Tỷ lệ trung bình"
                color="#a78bfa"
            />
            <MetricCard
                icon={<FireIcon />}
                label="Streak"
                value={Math.abs(metrics.winStreak)}
                subValue={metrics.winStreak >= 0 ? '🔥 Thắng liên tiếp' : '❄️ Thua liên tiếp'}
                color={metrics.winStreak >= 0 ? '#fb923c' : '#64748b'}
            />
            <MetricCard
                icon={<BalanceIcon />}
                label="Balance"
                value={fmt(metrics.currentBalance)}
                subValue={`P/L: ${metrics.pnl >= 0 ? '+' : ''}${fmt(metrics.pnl)}`}
                color={metrics.pnl >= 0 ? '#10b981' : '#f43f5e'}
                sparkData={metrics.balanceSpark}
            />
        </Stack>
    );
}

export default TopMetrics;
