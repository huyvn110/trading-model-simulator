'use client';

import React, { useState, Suspense, lazy, useCallback, useContext } from 'react';
import {
    Box,
    Container,
    Grid,
    Tabs,
    Tab,
    Paper,
    CircularProgress,
    Collapse,
    IconButton,
    Typography,
    Stack,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Analytics as TestIcon,
    LocalFireDepartment as LiveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Description as NotesIcon,
} from '@mui/icons-material';
import { Header } from '@/components/Header';
import { FactorList } from '@/components/FactorList/FactorList';
import {
    SessionPanel,
    TradeRecorder,
} from '@/components/TestMode';
import { ModelList, ModelDialog } from '@/components/LiveTrading/ModelList';
import { TradingModel } from '@/types';
import { ThemeContext } from '@/components/ThemeRegistry';

// Lazy load heavy components
const TestTrades   = lazy(() => import('@/components/TestMode/TestTrades'));
const TestCharts   = lazy(() => import('@/components/TestMode/TestCharts'));
const TradePanel   = lazy(() => import('@/components/LiveTrading/TradePanel'));
const TradeList    = lazy(() => import('@/components/LiveTrading/TradeList'));
const LiveCharts   = lazy(() => import('@/components/LiveTrading/LiveCharts'));
const LiveSessionHistory = lazy(() => import('@/components/LiveTrading/SessionHistory'));
const NotesPage    = lazy(() => import('@/components/Notes/NotesPage'));

const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
        <CircularProgress size={28} thickness={3} />
    </Box>
);

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`results-tabpanel-${index}`}
            aria-labelledby={`results-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ pt: 2.5 }} className="fade-in">
                    {children}
                </Box>
            )}
        </div>
    );
}

type AppMode = 'test' | 'live' | 'notes';

// ─── Mode definitions ────────────────────────────────────────────────────────
const MODES: {
    id: AppMode;
    icon: React.ReactNode;
    label: string;
    subtitle: string;
    activeGradient: string;
    activeShadow: string;
}[] = [
    {
        id: 'test',
        icon: <TestIcon sx={{ fontSize: 20 }} />,
        label: 'Test Mode',
        subtitle: 'Mô phỏng & phân tích',
        activeGradient: 'linear-gradient(135deg, #2383e2 0%, #529aec 100%)',
        activeShadow: '0 4px 20px rgba(35, 131, 226, 0.4)',
    },
    {
        id: 'live',
        icon: <LiveIcon sx={{ fontSize: 20 }} />,
        label: 'Thực Chiến',
        subtitle: 'Giao dịch thực tế',
        activeGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
        activeShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
    },
    {
        id: 'notes',
        icon: <NotesIcon sx={{ fontSize: 20 }} />,
        label: 'Notes',
        subtitle: 'Ghi chú & quy tắc',
        activeGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        activeShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
    },
];

// ─── Collapsible Panel Header ─────────────────────────────────────────────────
function PanelHeader({
    title,
    open,
    onToggle,
    accentColor,
}: {
    title: string;
    open: boolean;
    onToggle: () => void;
    accentColor?: string;
}) {
    const theme = useTheme();
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                background: theme.palette.mode === 'dark'
                    ? 'rgba(241, 245, 249, 0.04)'
                    : 'rgba(15, 23, 42, 0.03)',
                borderBottom: open ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'background 0.2s ease',
                '&:hover': {
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(241, 245, 249, 0.07)'
                        : 'rgba(15, 23, 42, 0.05)',
                },
            }}
            onClick={onToggle}
        >
            <Stack direction="row" alignItems="center" spacing={1}>
                {accentColor && (
                    <Box
                        sx={{
                            width: 3,
                            height: 16,
                            borderRadius: 4,
                            background: accentColor,
                            flexShrink: 0,
                        }}
                    />
                )}
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, fontSize: '0.82rem', color: 'text.primary' }}
                >
                    {title}
                </Typography>
            </Stack>
            <IconButton size="small" sx={{ p: 0.25 }}>
                {open
                    ? <ExpandLessIcon sx={{ fontSize: 18 }} />
                    : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
            </IconButton>
        </Stack>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
    const theme = useTheme();
    const { isDarkMode } = useContext(ThemeContext);
    const [appMode, setAppMode] = useState<AppMode>('test');
    const [testTab, setTestTab]   = useState(0);
    const [liveTab, setLiveTab]   = useState(0);

    // Collapsible panels
    const [sessionOpen,    setSessionOpen]    = useState(true);
    const [recorderOpen,   setRecorderOpen]   = useState(true);
    const [liveTradeOpen,  setLiveTradeOpen]  = useState(true);

    // Model dialog
    const [modelDialogOpen, setModelDialogOpen] = useState(false);
    const [editingModel,    setEditingModel]    = useState<TradingModel | null>(null);

    React.useEffect(() => {
        setModelDialogOpen(false);
        setEditingModel(null);
    }, [appMode]);

    const handleAddModel   = useCallback(() => { setEditingModel(null); setModelDialogOpen(true); }, []);
    const handleEditModel  = useCallback((m: TradingModel) => { setEditingModel(m); setModelDialogOpen(true); }, []);
    const handleCloseModelDialog = useCallback(() => { setModelDialogOpen(false); setEditingModel(null); }, []);

    const panelBg = isDarkMode
        ? 'rgba(15, 22, 41, 0.6)'
        : 'rgba(255, 255, 255, 0.8)';
    const panelBorder = isDarkMode
        ? '1px solid rgba(241, 245, 249, 0.08)'
        : '1px solid rgba(15, 23, 42, 0.08)';

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {/* ── Mode Switcher ── */}
            <Box
                sx={{
                    py: 2.5,
                    px: { xs: 2, sm: 3 },
                    bgcolor: isDarkMode ? 'rgba(10, 14, 26, 0.9)' : 'rgba(248, 250, 255, 0.9)',
                    borderBottom: panelBorder,
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Stack direction="row" justifyContent="center" spacing={1.5}>
                    {MODES.map((mode) => {
                        const isActive = appMode === mode.id;
                        return (
                            <Box
                                key={mode.id}
                                onClick={() => setAppMode(mode.id)}
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    px: { xs: 2, sm: 3.5 },
                                    py: 1.5,
                                    borderRadius: 3,
                                    cursor: 'pointer',
                                    minWidth: { xs: 90, sm: 130 },
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.25s ease',
                                    background: isActive
                                        ? mode.activeGradient
                                        : isDarkMode
                                            ? 'rgba(241, 245, 249, 0.05)'
                                            : 'rgba(15, 23, 42, 0.04)',
                                    border: '1px solid',
                                    borderColor: isActive
                                        ? 'transparent'
                                        : isDarkMode
                                            ? 'rgba(241, 245, 249, 0.08)'
                                            : 'rgba(15, 23, 42, 0.1)',
                                    boxShadow: isActive ? mode.activeShadow : 'none',
                                    color: isActive ? 'white' : 'text.secondary',
                                    transform: isActive ? 'translateY(-1px)' : 'none',
                                    '&:hover': {
                                        transform: 'translateY(-2px)',
                                        background: isActive
                                            ? mode.activeGradient
                                            : isDarkMode
                                                ? 'rgba(241, 245, 249, 0.09)'
                                                : 'rgba(15, 23, 42, 0.07)',
                                        boxShadow: isActive
                                            ? mode.activeShadow
                                            : isDarkMode
                                                ? '0 4px 12px rgba(0,0,0,0.3)'
                                                : '0 4px 12px rgba(15,23,42,0.1)',
                                    },
                                }}
                            >
                                {/* Icon */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'inherit',
                                        opacity: isActive ? 1 : 0.65,
                                        transition: 'opacity 0.2s',
                                    }}
                                >
                                    {mode.icon}
                                </Box>
                                {/* Label */}
                                <Typography
                                    sx={{
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: 'inherit',
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {mode.label}
                                </Typography>
                                {/* Subtitle - only show on larger screens */}
                                <Typography
                                    sx={{
                                        fontSize: '0.65rem',
                                        color: isActive ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                                        display: { xs: 'none', sm: 'block' },
                                        lineHeight: 1,
                                        fontWeight: 500,
                                    }}
                                >
                                    {mode.subtitle}
                                </Typography>
                            </Box>
                        );
                    })}
                </Stack>
            </Box>

            {/* ── Content ── */}
            <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>

                {/* Test Mode */}
                {appMode === 'test' && (
                    <Grid container spacing={2.5} className="mode-panel">
                        {/* Left Column */}
                        <Grid item xs={12} md={4} lg={3}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Session Panel */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: panelBorder,
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(8px)',
                                        bgcolor: panelBg,
                                    }}
                                >
                                    <PanelHeader
                                        title="📋  Session"
                                        open={sessionOpen}
                                        onToggle={() => setSessionOpen(o => !o)}
                                        accentColor="linear-gradient(135deg, #2383e2, #8b5cf6)"
                                    />
                                    <Collapse in={sessionOpen}>
                                        <SessionPanel />
                                    </Collapse>
                                </Paper>

                                {/* Factors & Recorder */}
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 3,
                                        border: panelBorder,
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(8px)',
                                        bgcolor: panelBg,
                                    }}
                                >
                                    <PanelHeader
                                        title="✍️  Ghi Trade"
                                        open={recorderOpen}
                                        onToggle={() => setRecorderOpen(o => !o)}
                                        accentColor="linear-gradient(135deg, #10b981, #34d399)"
                                    />
                                    <Collapse in={recorderOpen}>
                                        <FactorList />
                                        <TradeRecorder />
                                    </Collapse>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Right Column */}
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <Tabs
                                    value={testTab}
                                    onChange={(_, v) => setTestTab(v)}
                                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 0 }}
                                >
                                    <Tab label="Thống kê & Charts" />
                                    <Tab label="Lịch sử Trades" />
                                </Tabs>

                                <TabPanel value={testTab} index={0}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TestCharts />
                                    </Suspense>
                                </TabPanel>
                                <TabPanel value={testTab} index={1}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TestTrades />
                                    </Suspense>
                                </TabPanel>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Live Mode */}
                {appMode === 'live' && (
                    <Grid container spacing={2.5} className="mode-panel">
                        {/* Left */}
                        <Grid item xs={12} md={4} lg={3}>
                            <Paper
                                elevation={0}
                                sx={{
                                    borderRadius: 3,
                                    border: panelBorder,
                                    overflow: 'hidden',
                                    backdropFilter: 'blur(8px)',
                                    bgcolor: panelBg,
                                }}
                            >
                                <PanelHeader
                                    title="🔥  Giao dịch"
                                    open={liveTradeOpen}
                                    onToggle={() => setLiveTradeOpen(o => !o)}
                                    accentColor="linear-gradient(135deg, #f43f5e, #fb923c)"
                                />
                                <Collapse in={liveTradeOpen}>
                                    <ModelList onAddModel={handleAddModel} onEditModel={handleEditModel} />
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TradePanel />
                                    </Suspense>
                                </Collapse>
                            </Paper>
                        </Grid>

                        {/* Right */}
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2.5,
                                    borderRadius: 3,
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <Tabs
                                    value={liveTab}
                                    onChange={(_, v) => setLiveTab(v)}
                                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                                >
                                    <Tab label="Trades" />
                                    <Tab label="Charts & Stats" />
                                    <Tab label="History" />
                                </Tabs>

                                <TabPanel value={liveTab} index={0}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TradeList />
                                    </Suspense>
                                </TabPanel>
                                <TabPanel value={liveTab} index={1}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <LiveCharts />
                                    </Suspense>
                                </TabPanel>
                                <TabPanel value={liveTab} index={2}>
                                    <Suspense fallback={<LoadingFallback />}>
                                        <LiveSessionHistory />
                                    </Suspense>
                                </TabPanel>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* Notes Mode */}
                {appMode === 'notes' && (
                    <Box className="mode-panel">
                        <Suspense fallback={<LoadingFallback />}>
                            <NotesPage />
                        </Suspense>
                    </Box>
                )}
            </Container>

            {/* Model Dialog */}
            <ModelDialog
                open={modelDialogOpen}
                onClose={handleCloseModelDialog}
                editModel={editingModel}
            />
        </Box>
    );
}
