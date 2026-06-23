'use client';

import React, { useMemo, useState } from 'react';
import { Box, Typography, Stack, useTheme, alpha, Chip } from '@mui/material';

interface Trade {
    timestamp: number;
    tradeDate?: string;
    result: 'win' | 'lose';
    measurementValue: number;
    pnl?: number;
    rr?: number;
}

interface EquityChartProps {
    trades: Trade[];
    initialBalance: number;
    measurementMode: 'RR' | '$' | '%';
}

export function EquityChart({ trades, initialBalance, measurementMode }: EquityChartProps) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    const chartData = useMemo(() => {
        const getValue = (t: Trade) => {
            if (measurementMode === '$') return t.pnl !== undefined ? t.pnl : t.measurementValue;
            if (measurementMode === 'RR') return t.rr !== undefined ? t.rr : t.measurementValue;
            return t.measurementValue;
        };

        if (trades.length === 0) return [];
        const points: { index: number; balance: number; label: string; result?: string }[] = [];
        let balance = initialBalance;
        points.push({ index: 0, balance, label: 'Start' });

        trades.forEach((trade, idx) => {
            if (measurementMode === '$' || measurementMode === 'RR') {
                balance += trade.result === 'win' ? getValue(trade) : -getValue(trade);
            } else {
                balance *= trade.result === 'win'
                    ? (1 + getValue(trade) / 100)
                    : (1 - getValue(trade) / 100);
            }
            points.push({ index: idx + 1, balance, label: `#${idx + 1}`, result: trade.result });
        });
        return points;
    }, [trades, initialBalance, measurementMode]);

    const theme_border = isDark ? 'rgba(241,245,249,0.08)' : 'rgba(15,23,42,0.08)';
    const textSecondary = isDark ? 'rgba(100,116,139,0.8)' : '#94a3b8';

    if (chartData.length < 2) {
        return (
            <Box sx={{
                p: 3, borderRadius: 3,
                background: isDark
                    ? 'linear-gradient(135deg, rgba(30,41,59,0.6) 0%, rgba(15,23,42,0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(248,250,255,0.9) 0%, rgba(255,255,255,0.95) 100%)',
                border: `1px solid ${theme_border}`,
                height: 220,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <Typography sx={{ color: textSecondary, fontSize: '0.875rem' }}>
                    Cần ít nhất 1 trade để hiển thị biểu đồ
                </Typography>
            </Box>
        );
    }

    const maxBalance = Math.max(...chartData.map(d => d.balance));
    const minBalance = Math.min(...chartData.map(d => d.balance));
    const range = maxBalance - minBalance || 1;
    const padding = range * 0.12;

    const W = 600, H = 160;
    const GRID_LINES = 4;

    const getY = (v: number) => H - ((v - minBalance + padding) / (range + padding * 2)) * H;
    const getX = (i: number) => (i / (chartData.length - 1)) * W;

    // Smooth bezier curve
    const smoothPath = () => {
        const pts = chartData.map(p => ({ x: getX(p.index), y: getY(p.balance) }));
        if (pts.length < 2) return '';
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const prev = pts[i - 1];
            const curr = pts[i];
            const cx1 = prev.x + (curr.x - prev.x) * 0.5;
            const cy1 = prev.y;
            const cx2 = prev.x + (curr.x - prev.x) * 0.5;
            const cy2 = curr.y;
            d += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
        }
        return d;
    };

    const linePath = smoothPath();
    const fillPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

    const currentBalance = chartData[chartData.length - 1]?.balance || initialBalance;
    const pnl = currentBalance - initialBalance;
    const pnlPct = initialBalance > 0 ? ((pnl / initialBalance) * 100) : 0;
    const isProfit = pnl >= 0;

    const mainColor    = isProfit ? '#10b981' : '#f43f5e';
    const shadowColor  = isProfit ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)';

    const fmt = (v: number) => {
        if (measurementMode === '$') return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (measurementMode === '%') return `${v.toFixed(2)}%`;
        return `${v.toFixed(2)}R`;
    };

    const hovered = hoveredIdx !== null ? chartData[hoveredIdx] : null;
    const gradId = `eq-grad-${isProfit ? 'g' : 'r'}`;

    return (
        <Box sx={{
            p: 2.5, borderRadius: 3,
            background: isDark
                ? `linear-gradient(135deg, rgba(15,22,41,0.9) 0%, rgba(10,14,26,0.95) 100%)`
                : `linear-gradient(135deg, rgba(248,250,255,0.9) 0%, rgba(255,255,255,0.95) 100%)`,
            border: `1px solid ${theme_border}`,
            backdropFilter: 'blur(8px)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Subtle glow bg */}
            <Box sx={{
                position: 'absolute', top: -60, right: -60,
                width: 200, height: 200, borderRadius: '50%',
                background: `radial-gradient(circle, ${shadowColor} 0%, transparent 70%)`,
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                <Box>
                    <Typography sx={{
                        fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.03em',
                        color: isDark ? '#f1f5f9' : '#0f172a',
                        fontFamily: '"JetBrains Mono", monospace',
                    }}>
                        {fmt(currentBalance)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: textSecondary, fontWeight: 500 }}>
                        Equity Curve
                    </Typography>
                </Box>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip
                        label={`${isProfit ? '+' : ''}${fmt(pnl)}`}
                        size="small"
                        sx={{
                            bgcolor: alpha(mainColor, 0.15),
                            color: mainColor,
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            border: `1px solid ${alpha(mainColor, 0.3)}`,
                        }}
                    />
                    <Chip
                        label={`${isProfit ? '+' : ''}${pnlPct.toFixed(1)}%`}
                        size="small"
                        sx={{
                            bgcolor: alpha(mainColor, 0.08),
                            color: textSecondary,
                            fontWeight: 600,
                            fontSize: '0.72rem',
                        }}
                    />
                </Stack>
            </Stack>

            {/* Chart SVG */}
            <Box sx={{ position: 'relative', userSelect: 'none' }}>
                <svg
                    width="100%"
                    height={H}
                    viewBox={`0 0 ${W} ${H}`}
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible', display: 'block' }}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={mainColor} stopOpacity="0.25" />
                            <stop offset="80%" stopColor={mainColor} stopOpacity="0.02" />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    {Array.from({ length: GRID_LINES }).map((_, i) => {
                        const y = (H / (GRID_LINES + 1)) * (i + 1);
                        return (
                            <line
                                key={i}
                                x1={0} y1={y} x2={W} y2={y}
                                stroke={isDark ? 'rgba(241,245,249,0.06)' : 'rgba(15,23,42,0.06)'}
                                strokeWidth={1}
                                strokeDasharray="4 6"
                            />
                        );
                    })}

                    {/* Zero / start line */}
                    <line
                        x1={0} y1={getY(initialBalance)} x2={W} y2={getY(initialBalance)}
                        stroke={isDark ? 'rgba(241,245,249,0.12)' : 'rgba(15,23,42,0.1)'}
                        strokeWidth={1}
                        strokeDasharray="6 4"
                    />

                    {/* Fill area */}
                    <path d={fillPath} fill={`url(#${gradId})`} />

                    {/* Main line */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke={mainColor}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="chart-line"
                        style={{ filter: `drop-shadow(0 0 4px ${alpha(mainColor, 0.5)})` }}
                    />

                    {/* Hover dots */}
                    {chartData.map((pt, i) => {
                        const x = getX(pt.index);
                        const y = getY(pt.balance);
                        return (
                            <circle
                                key={i}
                                cx={x} cy={y} r={hoveredIdx === i ? 5 : 0}
                                fill={mainColor}
                                stroke={isDark ? '#0a0e1a' : '#fff'}
                                strokeWidth={2}
                                style={{ transition: 'r 0.15s ease', cursor: 'crosshair' }}
                            />
                        );
                    })}

                    {/* Invisible hover targets */}
                    {chartData.map((pt, i) => {
                        const x = getX(pt.index);
                        const segW = W / chartData.length;
                        return (
                            <rect
                                key={`h-${i}`}
                                x={x - segW / 2} y={0}
                                width={segW} height={H}
                                fill="transparent"
                                style={{ cursor: 'crosshair' }}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                            />
                        );
                    })}

                    {/* End dot */}
                    <circle
                        cx={W} cy={getY(currentBalance)} r={5}
                        fill={mainColor}
                        stroke={isDark ? '#0a0e1a' : '#fff'}
                        strokeWidth={2}
                        style={{ filter: `drop-shadow(0 0 6px ${mainColor})` }}
                    />
                </svg>

                {/* Hover tooltip */}
                {hovered && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 4,
                            left: `${Math.min(90, (hovered.index / chartData.length) * 100)}%`,
                            transform: 'translateX(-50%)',
                            bgcolor: isDark ? '#1e2537' : '#0f172a',
                            color: 'white',
                            px: 1.5, py: 0.75,
                            borderRadius: 2,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            fontFamily: '"JetBrains Mono", monospace',
                            pointerEvents: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            whiteSpace: 'nowrap',
                            zIndex: 10,
                        }}
                    >
                        {hovered.label}: {fmt(hovered.balance)}
                        {hovered.result && (
                            <span style={{ marginLeft: 6, color: hovered.result === 'win' ? '#10b981' : '#f43f5e' }}>
                                {hovered.result === 'win' ? '▲' : '▼'}
                            </span>
                        )}
                    </Box>
                )}
            </Box>

            {/* X-axis */}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="caption" sx={{ color: textSecondary }}>Start</Typography>
                <Typography variant="caption" sx={{ color: textSecondary }}>{trades.length} trades</Typography>
            </Stack>
        </Box>
    );
}

export default EquityChart;
