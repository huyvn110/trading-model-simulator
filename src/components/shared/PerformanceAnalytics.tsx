'use client';

import React, { useMemo, useState } from 'react';
import {
    alpha,
    Box,
    Chip,
    Divider,
    LinearProgress,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
    useTheme,
} from '@mui/material';
import {
    AccountBalance as AccountBalanceIcon,
    CalendarMonth as CalendarIcon,
    Insights as InsightsIcon,
    Leaderboard as LeaderboardIcon,
    Storefront as MarketIcon,
    TrendingDown as TrendingDownIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

export interface AnalyticsTrade {
    id?: string;
    timestamp: number;
    tradeDate?: string;
    result: 'win' | 'lose';
    measurementValue: number;
    pnl?: number;
    rr?: number;
    market?: string;
    setupName?: string;
}

interface PerformanceAnalyticsProps {
    trades: AnalyticsTrade[];
    initialBalance: number;
    measurementMode: 'RR' | '$' | '%';
}

interface GroupStats {
    key: string;
    totalTrades: number;
    wins: number;
    losses: number;
    winTotal: number;
    lossTotal: number;
    net: number;
    avgPnl: number;
    avgWin: number;
    avgLoss: number;
    winRate: number;
    profitFactor: number | null;
    expectancy: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
    return (
        <Box role="tabpanel" hidden={value !== index}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </Box>
    );
}

function getTradeDate(trade: AnalyticsTrade) {
    return trade.tradeDate || new Date(trade.timestamp).toISOString().split('T')[0];
}

function getTradeValue(trade: AnalyticsTrade, measurementMode: PerformanceAnalyticsProps['measurementMode']) {
    if (measurementMode === '$') return trade.pnl ?? trade.measurementValue;
    if (measurementMode === 'RR') return trade.rr ?? trade.measurementValue;
    return trade.measurementValue;
}

function signedTradeValue(trade: AnalyticsTrade, measurementMode: PerformanceAnalyticsProps['measurementMode']) {
    const value = Math.abs(getTradeValue(trade, measurementMode));
    return trade.result === 'win' ? value : -value;
}

function makeStats(key: string, trades: AnalyticsTrade[], measurementMode: PerformanceAnalyticsProps['measurementMode']): GroupStats {
    const values = trades.map((trade) => signedTradeValue(trade, measurementMode));
    const wins = trades.filter((trade) => trade.result === 'win');
    const losses = trades.filter((trade) => trade.result === 'lose');
    const winTotal = wins.reduce((sum, trade) => sum + Math.abs(getTradeValue(trade, measurementMode)), 0);
    const lossTotal = losses.reduce((sum, trade) => sum + Math.abs(getTradeValue(trade, measurementMode)), 0);
    const net = values.reduce((sum, value) => sum + value, 0);
    const avgWin = wins.length ? winTotal / wins.length : 0;
    const avgLoss = losses.length ? -(lossTotal / losses.length) : 0;

    return {
        key,
        totalTrades: trades.length,
        wins: wins.length,
        losses: losses.length,
        winTotal,
        lossTotal,
        net,
        avgPnl: trades.length ? net / trades.length : 0,
        avgWin,
        avgLoss,
        winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
        profitFactor: lossTotal > 0 ? winTotal / lossTotal : winTotal > 0 ? null : 0,
        expectancy: trades.length ? net / trades.length : 0,
    };
}

function groupBy(
    trades: AnalyticsTrade[],
    measurementMode: PerformanceAnalyticsProps['measurementMode'],
    getKey: (trade: AnalyticsTrade) => string
) {
    const map = new Map<string, AnalyticsTrade[]>();
    trades.forEach((trade) => {
        const key = getKey(trade);
        map.set(key, [...(map.get(key) || []), trade]);
    });
    return Array.from(map.entries()).map(([key, groupTrades]) => makeStats(key, groupTrades, measurementMode));
}

function formatNumber(value: number, measurementMode: PerformanceAnalyticsProps['measurementMode'], options?: { signed?: boolean }) {
    const sign = options?.signed && value > 0 ? '+' : '';
    if (measurementMode === '$') {
        return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (measurementMode === '%') return `${sign}${value.toFixed(2)}%`;
    return `${sign}${value.toFixed(2)}R`;
}

function formatSigned(value: number, measurementMode: PerformanceAnalyticsProps['measurementMode']) {
    if (value < 0 && measurementMode === '$') {
        return `-$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return formatNumber(value, measurementMode, { signed: true });
}

function formatProfitFactor(value: number | null) {
    if (value === null) return 'MAX';
    return value.toFixed(2);
}

function MetricTile({
    label,
    value,
    helper,
    tone = 'neutral',
}: {
    label: string;
    value: string;
    helper?: string;
    tone?: 'positive' | 'negative' | 'neutral' | 'accent';
}) {
    const theme = useTheme();
    const palette = {
        positive: '#10b981',
        negative: '#f43f5e',
        accent: '#2563eb',
        neutral: theme.palette.text.secondary,
    };
    const color = palette[tone];

    return (
        <Box
            sx={{
                minWidth: 160,
                flex: 1,
                p: 1.75,
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(color, tone === 'neutral' ? 0.12 : 0.22),
                bgcolor: alpha(color, tone === 'neutral' ? 0.03 : 0.08),
            }}
        >
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase' }}>
                {label}
            </Typography>
            <Typography sx={{ mt: 0.5, fontSize: '1.35rem', fontWeight: 800, color }}>
                {value}
            </Typography>
            {helper && (
                <Typography sx={{ mt: 0.25, fontSize: '0.75rem', color: 'text.secondary' }}>
                    {helper}
                </Typography>
            )}
        </Box>
    );
}

function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
    return (
        <Stack direction="row" spacing={1.25} alignItems="center">
            <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>{title}</Typography>
                {subtitle && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>{subtitle}</Typography>}
            </Box>
        </Stack>
    );
}

function BarCell({
    value,
    max,
    measurementMode,
}: {
    value: number;
    max: number;
    measurementMode: PerformanceAnalyticsProps['measurementMode'];
}) {
    const theme = useTheme();
    const color = value >= 0 ? '#10b981' : '#f43f5e';
    const width = max > 0 ? Math.max(8, (Math.abs(value) / max) * 100) : 0;

    return (
        <Stack spacing={0.75}>
            <Typography sx={{ fontWeight: 700, color }}>{formatSigned(value, measurementMode)}</Typography>
            <LinearProgress
                variant="determinate"
                value={width}
                sx={{
                    height: 6,
                    borderRadius: 999,
                    bgcolor: alpha(theme.palette.text.primary, 0.08),
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        bgcolor: color,
                    },
                }}
            />
        </Stack>
    );
}

function StatsTable({
    rows,
    firstColumn,
    maxNet,
    measurementMode,
    tags,
}: {
    rows: GroupStats[];
    firstColumn: string;
    maxNet: number;
    measurementMode: PerformanceAnalyticsProps['measurementMode'];
    tags?: Record<string, string>;
}) {
    const theme = useTheme();

    return (
        <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
                <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.09) }}>
                        <TableCell sx={{ fontWeight: 800 }}>{firstColumn}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Trades</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>W/L</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Win Rate</TableCell>
                        <TableCell sx={{ minWidth: 150, fontWeight: 800 }}>Net</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Avg / Trade</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Avg Win</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Avg Loss</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>PF</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Expectancy</TableCell>
                        {tags && <TableCell sx={{ fontWeight: 800 }}>Tag</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.key} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{row.key}</TableCell>
                            <TableCell align="right">{row.totalTrades}</TableCell>
                            <TableCell align="right">{row.wins}/{row.losses}</TableCell>
                            <TableCell align="right">
                                <Chip
                                    size="small"
                                    label={`${row.winRate.toFixed(2)}%`}
                                    sx={{
                                        height: 22,
                                        fontWeight: 700,
                                        color: row.winRate >= 60 ? '#047857' : row.winRate >= 40 ? '#2563eb' : '#be123c',
                                        bgcolor: row.winRate >= 60 ? alpha('#10b981', 0.12) : row.winRate >= 40 ? alpha('#2563eb', 0.12) : alpha('#f43f5e', 0.12),
                                    }}
                                />
                            </TableCell>
                            <TableCell>
                                <BarCell value={row.net} max={maxNet} measurementMode={measurementMode} />
                            </TableCell>
                            <TableCell align="right">{formatSigned(row.avgPnl, measurementMode)}</TableCell>
                            <TableCell align="right" sx={{ color: '#047857', fontWeight: 700 }}>{formatNumber(row.avgWin, measurementMode)}</TableCell>
                            <TableCell align="right" sx={{ color: row.avgLoss < 0 ? '#be123c' : 'text.secondary', fontWeight: 700 }}>{formatSigned(row.avgLoss, measurementMode)}</TableCell>
                            <TableCell align="right">{formatProfitFactor(row.profitFactor)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: row.expectancy >= 0 ? '#047857' : '#be123c' }}>
                                {formatSigned(row.expectancy, measurementMode)}
                            </TableCell>
                            {tags && (
                                <TableCell>
                                    {tags[row.key] && (
                                        <Chip size="small" label={tags[row.key]} sx={{ height: 22, fontWeight: 700 }} />
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

export function PerformanceAnalytics({ trades, initialBalance, measurementMode }: PerformanceAnalyticsProps) {
    const theme = useTheme();
    const [tab, setTab] = useState(0);

    const analytics = useMemo(() => {
        const summary = makeStats('ALL', trades, measurementMode);
        const values = trades.map((trade) => signedTradeValue(trade, measurementMode));
        const bestTrade = values.length ? Math.max(...values) : 0;
        const worstTrade = values.length ? Math.min(...values) : 0;
        const totalRR = trades.reduce((sum, trade) => sum + signedTradeValue(trade, 'RR'), 0);
        const totalPnl = trades.reduce((sum, trade) => sum + signedTradeValue(trade, '$'), 0);

        const weekdayRows = groupBy(trades, measurementMode, (trade) => WEEKDAYS[new Date(getTradeDate(trade)).getDay()])
            .sort((a, b) => WEEKDAY_ORDER.indexOf(a.key) - WEEKDAY_ORDER.indexOf(b.key));

        const marketRows = groupBy(trades, measurementMode, (trade) => trade.market?.trim() || 'Unspecified')
            .sort((a, b) => b.net - a.net);

        const setupRows = groupBy(trades, measurementMode, (trade) => {
            const market = trade.market?.trim() || 'Unspecified';
            const setup = trade.setupName?.trim() || 'None';
            return `${market} / ${setup}`;
        }).sort((a, b) => b.expectancy - a.expectancy);

        const bestByWinRate = [...weekdayRows].sort((a, b) => b.winRate - a.winRate || b.totalTrades - a.totalTrades)[0];
        const bestDayByPnl = [...weekdayRows].sort((a, b) => b.net - a.net)[0];
        const worstDayByPnl = [...weekdayRows].sort((a, b) => a.net - b.net)[0];
        const bestMarket = marketRows[0];
        const bestSetup = setupRows[0];
        const weakSetups = setupRows.filter((row) => row.net < 0).slice(0, 3);

        return {
            summary,
            bestTrade,
            worstTrade,
            totalRR,
            totalPnl,
            pnlPerR: totalRR !== 0 ? totalPnl / totalRR : 0,
            currentBalance: initialBalance + totalPnl,
            weekdayRows,
            marketRows,
            setupRows,
            bestByWinRate,
            bestDayByPnl,
            worstDayByPnl,
            bestMarket,
            bestSetup,
            weakSetups,
        };
    }, [trades, initialBalance, measurementMode]);

    if (trades.length === 0) return null;

    const maxWeekdayNet = Math.max(...analytics.weekdayRows.map((row) => Math.abs(row.net)), 1);
    const maxMarketNet = Math.max(...analytics.marketRows.map((row) => Math.abs(row.net)), 1);
    const maxSetupNet = Math.max(...analytics.setupRows.map((row) => Math.abs(row.net)), 1);

    const weekdayTags: Record<string, string> = {};
    if (analytics.bestByWinRate) weekdayTags[analytics.bestByWinRate.key] = 'Best WR';
    if (analytics.bestDayByPnl) weekdayTags[analytics.bestDayByPnl.key] = 'Best PnL';
    if (analytics.worstDayByPnl && analytics.worstDayByPnl.key !== analytics.bestDayByPnl?.key) {
        weekdayTags[analytics.worstDayByPnl.key] = 'Worst PnL';
    }

    const setupTags: Record<string, string> = {};
    if (analytics.bestSetup) setupTags[analytics.bestSetup.key] = 'Top Setup';
    analytics.weakSetups.forEach((row) => {
        setupTags[row.key] = 'Needs Review';
    });

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                bgcolor: alpha(theme.palette.background.paper, 0.82),
            }}
        >
            <Box sx={{ p: 2.5 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
                    <SectionHeader
                        icon={<InsightsIcon />}
                        title="Performance Analytics"
                        subtitle="Summary, weekday, market and setup combo analysis"
                    />
                    <Chip
                        icon={analytics.summary.net >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={`Net ${formatSigned(analytics.summary.net, measurementMode)}`}
                        sx={{
                            alignSelf: { xs: 'flex-start', md: 'center' },
                            fontWeight: 800,
                            color: analytics.summary.net >= 0 ? '#047857' : '#be123c',
                            bgcolor: analytics.summary.net >= 0 ? alpha('#10b981', 0.12) : alpha('#f43f5e', 0.12),
                        }}
                    />
                </Stack>

                <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                    <MetricTile label="Total Trades" value={String(analytics.summary.totalTrades)} helper={`${analytics.summary.wins} wins / ${analytics.summary.losses} losses`} />
                    <MetricTile label="Win Rate" value={`${analytics.summary.winRate.toFixed(2)}%`} helper="All combos" tone={analytics.summary.winRate >= 50 ? 'positive' : 'negative'} />
                    <MetricTile label="Total RR" value={formatSigned(analytics.totalRR, 'RR')} helper="Risk reward total" tone={analytics.totalRR >= 0 ? 'positive' : 'negative'} />
                    <MetricTile label="Total P&L" value={formatSigned(analytics.totalPnl, '$')} helper={`Start ${formatNumber(initialBalance, '$')}`} tone={analytics.totalPnl >= 0 ? 'positive' : 'negative'} />
                    <MetricTile label="Balance" value={formatNumber(analytics.currentBalance, '$')} helper="Current account" tone={analytics.currentBalance >= initialBalance ? 'positive' : 'negative'} />
                    <MetricTile label="$ / 1R" value={formatSigned(analytics.pnlPerR, '$')} helper="PnL per RR" tone={analytics.pnlPerR >= 0 ? 'positive' : 'negative'} />
                </Stack>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 1.5 }}>
                    <MetricTile label="Avg Win" value={formatNumber(analytics.summary.avgWin, measurementMode)} tone="positive" />
                    <MetricTile label="Avg Loss" value={formatSigned(analytics.summary.avgLoss, measurementMode)} tone="negative" />
                    <MetricTile label="Profit Factor" value={formatProfitFactor(analytics.summary.profitFactor)} tone="accent" />
                    <MetricTile label="Expectancy" value={formatSigned(analytics.summary.expectancy, measurementMode)} tone={analytics.summary.expectancy >= 0 ? 'positive' : 'negative'} />
                    <MetricTile label="Best / Worst" value={`${formatSigned(analytics.bestTrade, measurementMode)} / ${formatSigned(analytics.worstTrade, measurementMode)}`} />
                </Stack>
            </Box>

            <Divider />

            <Box sx={{ px: 2.5, pt: 1.25 }}>
                <Tabs
                    value={tab}
                    onChange={(_, value) => setTab(value)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 40, '& .MuiTab-root': { minHeight: 40, fontWeight: 700 } }}
                >
                    <Tab icon={<CalendarIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Weekday" />
                    <Tab icon={<MarketIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Market" />
                    <Tab icon={<LeaderboardIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Setup Combo" />
                </Tabs>

                <TabPanel value={tab} index={0}>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                            <MetricTile label="Best Day by WR" value={analytics.bestByWinRate?.key || '-'} helper={analytics.bestByWinRate ? `${analytics.bestByWinRate.winRate.toFixed(2)}%` : undefined} tone="positive" />
                            <MetricTile label="Best Day by PnL" value={analytics.bestDayByPnl?.key || '-'} helper={analytics.bestDayByPnl ? formatSigned(analytics.bestDayByPnl.net, measurementMode) : undefined} tone="positive" />
                            <MetricTile label="Worst Day by PnL" value={analytics.worstDayByPnl?.key || '-'} helper={analytics.worstDayByPnl ? formatSigned(analytics.worstDayByPnl.net, measurementMode) : undefined} tone={analytics.worstDayByPnl && analytics.worstDayByPnl.net < 0 ? 'negative' : 'neutral'} />
                        </Stack>
                        <StatsTable rows={analytics.weekdayRows} firstColumn="Day" maxNet={maxWeekdayNet} measurementMode={measurementMode} tags={weekdayTags} />
                    </Stack>
                </TabPanel>

                <TabPanel value={tab} index={1}>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                            <MetricTile label="Best Market" value={analytics.bestMarket?.key || '-'} helper={analytics.bestMarket ? formatSigned(analytics.bestMarket.net, measurementMode) : undefined} tone="positive" />
                            <MetricTile label="Market Count" value={String(analytics.marketRows.length)} helper="Tracked symbols" />
                            <MetricTile label="All Market Net" value={formatSigned(analytics.summary.net, measurementMode)} helper={`${analytics.summary.totalTrades} trades`} tone={analytics.summary.net >= 0 ? 'positive' : 'negative'} />
                        </Stack>
                        <StatsTable
                            rows={[...analytics.marketRows, analytics.summary]}
                            firstColumn="Market"
                            maxNet={maxMarketNet}
                            measurementMode={measurementMode}
                        />
                    </Stack>
                </TabPanel>

                <TabPanel value={tab} index={2}>
                    <Stack spacing={2}>
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                            <MetricTile label="Top Setup" value={analytics.bestSetup?.key || '-'} helper={analytics.bestSetup ? `Expectancy ${formatSigned(analytics.bestSetup.expectancy, measurementMode)}` : undefined} tone="positive" />
                            <MetricTile label="Setup Count" value={String(analytics.setupRows.length)} helper="Market / combo pairs" />
                            <MetricTile label="Review Needed" value={String(analytics.weakSetups.length)} helper="Negative net setups" tone={analytics.weakSetups.length ? 'negative' : 'positive'} />
                        </Stack>
                        <StatsTable rows={analytics.setupRows} firstColumn="Market / Setup" maxNet={maxSetupNet} measurementMode={measurementMode} tags={setupTags} />
                    </Stack>
                </TabPanel>
            </Box>
        </Paper>
    );
}

export default PerformanceAnalytics;
