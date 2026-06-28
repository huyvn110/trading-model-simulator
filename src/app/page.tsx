'use client';

import React, { useState, Suspense, lazy, useCallback, useContext } from 'react';
import {
    Box,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Tabs,
    Tab,
    Paper,
    Button,
    CircularProgress,
    Collapse,
    IconButton,
    Typography,
    Stack,
    TextField,
    Tooltip,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Analytics as TestIcon,
    LocalFireDepartment as LiveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    InsertDriveFileOutlined as SessionFileIcon,
    KeyboardDoubleArrowLeft as HideSidebarIcon,
    KeyboardDoubleArrowRight as ShowSidebarIcon,
    Description as NotesIcon,
    Stop as StopIcon,
} from '@mui/icons-material';
import { Header } from '@/components/Header';
import { FactorList } from '@/components/FactorList/FactorList';
import {
    SessionPanel,
    TradeRecorder,
} from '@/components/TestMode';
import { ModelDialog } from '@/components/LiveTrading/ModelList';
import { TradingModel } from '@/types';
import { ThemeContext } from '@/components/ThemeRegistry';
import { useLiveSessionStore } from '@/store/liveSessionStore';

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
        icon: <TestIcon sx={{ fontSize: 17 }} />,
        label: 'Test Mode',
        subtitle: 'Mô phỏng & phân tích',
        activeGradient: 'linear-gradient(135deg, #2383e2 0%, #529aec 100%)',
        activeShadow: '0 4px 20px rgba(35, 131, 226, 0.4)',
    },
    {
        id: 'live',
        icon: <LiveIcon sx={{ fontSize: 17 }} />,
        label: 'Thực Chiến',
        subtitle: 'Giao dịch thực tế',
        activeGradient: 'linear-gradient(135deg, #f43f5e 0%, #fb923c 100%)',
        activeShadow: '0 4px 20px rgba(244, 63, 94, 0.4)',
    },
    {
        id: 'notes',
        icon: <NotesIcon sx={{ fontSize: 17 }} />,
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
                px: 1.1,
                py: 0.85,
                cursor: 'pointer',
                background: theme.palette.mode === 'dark'
                    ? 'rgba(245, 245, 245, 0.035)'
                    : 'rgba(15, 23, 42, 0.03)',
                borderBottom: open ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'background 0.2s ease',
                '&:hover': {
                    background: theme.palette.mode === 'dark'
                        ? 'rgba(245, 245, 245, 0.07)'
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
                            height: 14,
                            borderRadius: '3px',
                            background: accentColor,
                            flexShrink: 0,
                        }}
                    />
                )}
                <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 700, fontSize: '0.78rem', color: 'text.primary' }}
                >
                    {title}
                </Typography>
            </Stack>
            <IconButton size="small" sx={{ width: 24, height: 24, p: 0.25 }}>
                {open
                    ? <ExpandLessIcon sx={{ fontSize: 16 }} />
                    : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
            </IconButton>
        </Stack>
    );
}

function SidebarToggleButton({
    open,
    onToggle,
}: {
    open: boolean;
    onToggle: () => void;
}) {
    const theme = useTheme();
    const title = open ? 'Ẩn sidebar' : 'Mở sidebar';

    return (
        <Tooltip title={title}>
            <IconButton
                size="small"
                aria-label={title}
                onClick={onToggle}
                sx={{
                    width: 30,
                    height: 30,
                    flexShrink: 0,
                    border: open ? 'none' : '1px solid',
                    borderColor: open ? 'transparent' : 'divider',
                    borderRadius: '8px',
                    bgcolor: theme.palette.mode === 'dark'
                        ? open ? 'transparent' : 'rgba(245, 245, 245, 0.05)'
                        : 'rgba(255, 255, 255, 0.85)',
                    '&:hover': {
                        bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(245, 245, 245, 0.08)'
                            : 'rgba(15, 23, 42, 0.05)',
                    },
                }}
            >
                {open ? <HideSidebarIcon sx={{ fontSize: 16 }} /> : <ShowSidebarIcon sx={{ fontSize: 16 }} />}
            </IconButton>
        </Tooltip>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function LiveSessionMiniPanel({
    createOpen,
    onCreateOpenChange,
}: {
    createOpen: boolean;
    onCreateOpenChange: (open: boolean) => void;
}) {
    const { currentSession, sessionHistory, setMeasurementMode, startSession, endSession } = useLiveSessionStore();
    const [sessionName, setSessionName] = useState('');
    const [initialBalance, setInitialBalance] = useState('1000');

    const defaultSessionName = `Phiên thực chiến ${sessionHistory.length + (currentSession ? 2 : 1)}`;

    const handleCreateSession = () => {
        setMeasurementMode('$');
        startSession(parseFloat(initialBalance) || 0, sessionName.trim() || defaultSessionName);
        setSessionName('');
        setInitialBalance('1000');
        onCreateOpenChange(false);
    };

    return (
        <Box sx={{ py: 0.35, pr: 0.25 }}>
            {[...(currentSession ? [currentSession] : []), ...sessionHistory].length === 0 ? (
                <Stack direction="row" alignItems="center" spacing={0.9} sx={{ minHeight: 32, px: 0.8, color: 'text.secondary' }}>
                    <SessionFileIcon sx={{ fontSize: 16 }} />
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 650 }}>Chưa có phiên</Typography>
                </Stack>
            ) : (
                [...(currentSession ? [currentSession] : []), ...sessionHistory].map((session, index) => {
                    const active = session.id === currentSession?.id;
                    return (
                        <Stack
                            key={session.id}
                            direction="row"
                            alignItems="center"
                            spacing={0.45}
                            sx={{
                                minHeight: 32,
                                px: 0.7,
                                borderRadius: '7px',
                                color: active ? 'text.primary' : 'text.secondary',
                                bgcolor: active ? 'rgba(52, 211, 153, 0.08)' : 'transparent',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                            }}
                        >
                            <SessionFileIcon sx={{ fontSize: 16, color: active ? '#34d399' : 'text.secondary' }} />
                            <Typography sx={{ minWidth: 0, flex: 1, fontSize: '0.8rem', fontWeight: active ? 800 : 650 }} noWrap>
                                {session.name || `Phiên thực chiến ${index + 1}`}
                            </Typography>
                            <Typography sx={{ minWidth: 18, textAlign: 'right', color: 'text.secondary', fontSize: '0.72rem', fontWeight: 700 }}>
                                {session.trades.length}
                            </Typography>
                            {active && (
                                <Tooltip title="Kết thúc phiên">
                                    <IconButton
                                        size="small"
                                        aria-label="Kết thúc phiên"
                                        onClick={endSession}
                                        sx={{ width: 24, height: 24, p: 0, color: 'error.main', borderRadius: '6px' }}
                                    >
                                        <StopIcon sx={{ fontSize: 15 }} />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Stack>
                    );
                })
            )}

            <Dialog open={createOpen} onClose={() => onCreateOpenChange(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Tạo phiên mới</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.5} sx={{ pt: 0.75 }}>
                        <TextField
                            autoFocus
                            size="small"
                            label="Tên phiên"
                            placeholder={defaultSessionName}
                            value={sessionName}
                            onChange={(event) => setSessionName(event.target.value)}
                            fullWidth
                        />
                        <TextField
                            size="small"
                            label="Số dư ($)"
                            type="number"
                            value={initialBalance}
                            onChange={(event) => setInitialBalance(event.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onCreateOpenChange(false)}>Hủy</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSession}>
                        Tạo
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

function SidebarFrame({
    title,
    subtitle,
    accentColor,
    panelBg,
    panelBorder,
    onHide,
    children,
}: {
    title: string;
    subtitle: string;
    accentColor: string;
    panelBg: string;
    panelBorder: string;
    onHide: () => void;
    children: React.ReactNode;
}) {
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 3,
                border: panelBorder,
                overflow: 'hidden',
                backdropFilter: 'blur(8px)',
                bgcolor: panelBg,
                minWidth: 0,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1.5}
                sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
            >
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 8,
                            height: 34,
                            borderRadius: 2,
                            background: accentColor,
                            flexShrink: 0,
                        }}
                    />
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.15 }} noWrap>
                            {title}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: '0.72rem', lineHeight: 1.2 }} noWrap>
                            {subtitle}
                        </Typography>
                    </Box>
                </Stack>
                <SidebarToggleButton open onToggle={onHide} />
            </Stack>

            <Box
                sx={{
                    maxHeight: { md: 'calc(100vh - 174px)' },
                    overflowY: { md: 'auto' },
                    '&::-webkit-scrollbar': { width: 4 },
                    '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
                }}
            >
                {children}
            </Box>
        </Paper>
    );
}

function AppSidebar({
    appMode,
    onModeChange,
    onHide,
    panelBg,
    panelBorder,
    modePanels,
    modeSections,
}: {
    appMode: AppMode;
    onModeChange: (mode: AppMode) => void;
    onHide: () => void;
    panelBg: string;
    panelBorder: string;
    modePanels?: Partial<Record<AppMode, React.ReactNode>>;
    modeSections?: Partial<Record<AppMode, {
        open: boolean;
        onToggle: () => void;
        onAdd: () => void;
    }>>;
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    return (
        <Box
            component="aside"
            sx={{
                width: '100%',
                flexShrink: 0,
                p: { xs: 1.25, md: 1.5 },
                borderRight: { md: panelBorder },
                borderBottom: { xs: panelBorder, md: 'none' },
                bgcolor: isDark ? '#191919' : 'rgba(248, 250, 252, 0.96)',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.25,
                minHeight: { md: 'calc(100vh - 54px)' },
            }}
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} sx={{ minHeight: 32 }}>
                <Stack direction="row" alignItems="center" spacing={0.8} sx={{ minWidth: 0 }}>
                    <Box
                        sx={{
                            width: 22,
                            height: 22,
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            background: 'linear-gradient(135deg, #5fd0b5 0%, #e89b82 100%)',
                            flexShrink: 0,
                        }}
                    >
                        <TestIcon sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.84rem', lineHeight: 1.2 }} noWrap>
                        My Space
                    </Typography>
                    <ExpandMoreIcon sx={{ fontSize: 15, color: 'text.secondary', flexShrink: 0 }} />
                </Stack>
                <SidebarToggleButton open onToggle={onHide} />
            </Stack>

            <Stack spacing={0.25}>
                {MODES.map((mode) => {
                    const active = appMode === mode.id;
                    const section = modeSections?.[mode.id];

                    return (
                        <React.Fragment key={mode.id}>
                            <Box
                                sx={{
                                    width: '100%',
                                    minHeight: 34,
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderRadius: '8px',
                                    color: active ? 'text.primary' : 'text.secondary',
                                    bgcolor: active
                                        ? isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
                                        : 'transparent',
                                    '&:hover': {
                                        bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                                    },
                                }}
                            >
                                <Box
                                    component="button"
                                    type="button"
                                    onClick={() => onModeChange(mode.id)}
                                    sx={{
                                        minWidth: 0,
                                        minHeight: 34,
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 1,
                                        py: 0.55,
                                        border: 0,
                                        color: 'inherit',
                                        bgcolor: 'transparent',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', color: active ? 'primary.main' : 'text.secondary' }}>
                                        {mode.icon}
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography sx={{ fontWeight: active ? 800 : 700, fontSize: '0.82rem' }} noWrap>
                                            {mode.label}
                                        </Typography>
                                        <Typography sx={{ color: 'text.secondary', display: 'none', fontSize: '0.72rem' }} noWrap>
                                            {mode.subtitle}
                                        </Typography>
                                    </Box>
                                </Box>
                                {section && (
                                    <Stack direction="row" alignItems="center" spacing={0.15} sx={{ pr: 0.35, flexShrink: 0 }}>
                                        <Tooltip title="Tạo phiên mới">
                                            <IconButton
                                                size="small"
                                                aria-label={`Tạo phiên mới trong ${mode.label}`}
                                                onClick={() => {
                                                    onModeChange(mode.id);
                                                    section.onAdd();
                                                }}
                                                sx={{ width: 24, height: 24, p: 0, color: 'text.secondary', borderRadius: '6px' }}
                                            >
                                                <AddIcon sx={{ fontSize: 17 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton
                                            size="small"
                                            aria-label={active && section.open ? `Thu gọn ${mode.label}` : `Mở rộng ${mode.label}`}
                                            onClick={() => {
                                                if (!active) {
                                                    onModeChange(mode.id);
                                                } else {
                                                    section.onToggle();
                                                }
                                            }}
                                            sx={{ width: 24, height: 24, p: 0, color: 'text.secondary', borderRadius: '6px' }}
                                        >
                                            {active && section.open
                                                ? <ExpandLessIcon sx={{ fontSize: 16 }} />
                                                : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                                        </IconButton>
                                    </Stack>
                                )}
                            </Box>
                            {modePanels?.[mode.id] && (
                                <Collapse in={active && (section?.open ?? true)}>
                                    <Box
                                        sx={{
                                            ml: 1.35,
                                            pl: 1,
                                            mb: 0.35,
                                            borderLeft: '1px solid',
                                            borderColor: 'divider',
                                        }}
                                    >
                                        {modePanels[mode.id]}
                                    </Box>
                                </Collapse>
                            )}
                        </React.Fragment>
                    );
                })}
            </Stack>
        </Box>
    );
}

export default function Home() {
    const { isDarkMode } = useContext(ThemeContext);
    const [appMode, setAppMode] = useState<AppMode>('test');
    const [testTab, setTestTab]   = useState(0);
    const [liveTab, setLiveTab]   = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Collapsible panels
    const [sessionOpen,    setSessionOpen]    = useState(true);
    const [liveSessionOpen, setLiveSessionOpen] = useState(true);
    const [testCreateOpen, setTestCreateOpen] = useState(false);
    const [liveCreateOpen, setLiveCreateOpen] = useState(false);

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
        ? '#202020'
        : 'rgba(255, 255, 255, 0.8)';
    const panelBorder = isDarkMode
        ? '1px solid rgba(245, 245, 245, 0.08)'
        : '1px solid rgba(15, 23, 42, 0.08)';
    const sidebarModeSections = {
        test: {
            open: sessionOpen,
            onToggle: () => setSessionOpen((open) => !open),
            onAdd: () => setTestCreateOpen(true),
        },
        live: {
            open: liveSessionOpen,
            onToggle: () => setLiveSessionOpen((open) => !open),
            onAdd: () => setLiveCreateOpen(true),
        },
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
            <Header
                sidebarOpen={sidebarOpen}
                onToggleSidebar={() => setSidebarOpen((open) => !open)}
            />

            {/* ── Mode Switcher ── */}
            <Box
                sx={{
                    display: 'none',
                    py: 2.5,
                    px: { xs: 2, sm: 3 },
                    bgcolor: isDarkMode ? '#191919' : 'rgba(248, 250, 255, 0.9)',
                    borderBottom: panelBorder,
                    backdropFilter: 'blur(10px)',
                }}
            >
                <Stack
                    direction="row"
                    justifyContent={{ xs: 'flex-start', sm: 'center' }}
                    spacing={1.5}
                    sx={{
                        overflowX: 'auto',
                        pb: 0.5,
                        '&::-webkit-scrollbar': { height: 4 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 4 },
                    }}
                >
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
                                    flexShrink: 0,
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
            <Container maxWidth={false} disableGutters sx={{ flex: 1, minWidth: 0 }}>

                {/* Test Mode */}
                {appMode === 'test' && (
                    <Grid container spacing={0} className="mode-panel" alignItems="stretch">
                        {/* Left Column */}
                        {sidebarOpen && (
                            <Grid item xs={12} md={4} lg={3} sx={{ minWidth: 0 }}>
                                <Box sx={{ position: { md: 'sticky' }, top: { md: 54 }, minWidth: 0 }}>
                                    <AppSidebar
                                        appMode={appMode}
                                        onModeChange={setAppMode}
                                        panelBg={panelBg}
                                        panelBorder={panelBorder}
                                        onHide={() => setSidebarOpen(false)}
                                        modeSections={sidebarModeSections}
                                        modePanels={{
                                            test: (
                                                <SessionPanel
                                                    createOpen={testCreateOpen}
                                                    onCreateOpenChange={setTestCreateOpen}
                                                />
                                            ),
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}

                        {/* Right Column */}
                        <Grid item xs={12} md={sidebarOpen ? 8 : 12} lg={sidebarOpen ? 9 : 12} sx={{ minWidth: 0, p: { xs: 1, md: 1.25 } }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    mb: 1.25,
                                    p: 0,
                                    borderRadius: { xs: '8px', md: '18px' },
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ px: { xs: 1.25, sm: 1.75 }, pt: { xs: 1.25, sm: 1.75 } }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem' }}>
                                        Ghi Trade
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>
                                        Chọn factor, nhập thông tin, review và ghi chú trong cùng một khu vực.
                                    </Typography>
                                </Box>
                                <Grid container spacing={0}>
                                    <Grid item xs={12} lg={4}>
                                        <FactorList />
                                    </Grid>
                                    <Grid item xs={12} lg={8}>
                                        <TradeRecorder />
                                    </Grid>
                                </Grid>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 1.25, sm: 1.75 },
                                    borderRadius: { xs: '8px', md: '18px' },
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    backdropFilter: 'none',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                <Tabs
                                    value={testTab}
                                    onChange={(_, v) => setTestTab(v)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    allowScrollButtonsMobile
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
                    <Grid container spacing={0} className="mode-panel" alignItems="stretch">
                        {/* Left */}
                        {sidebarOpen && (
                            <Grid item xs={12} md={4} lg={3} sx={{ minWidth: 0 }}>
                                <Box sx={{ position: { md: 'sticky' }, top: { md: 54 }, minWidth: 0 }}>
                                    <AppSidebar
                                        appMode={appMode}
                                        onModeChange={setAppMode}
                                        panelBg={panelBg}
                                        panelBorder={panelBorder}
                                        onHide={() => setSidebarOpen(false)}
                                        modeSections={sidebarModeSections}
                                        modePanels={{
                                            live: (
                                                <LiveSessionMiniPanel
                                                    createOpen={liveCreateOpen}
                                                    onCreateOpenChange={setLiveCreateOpen}
                                                />
                                            ),
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}

                        {/* Right */}
                        <Grid item xs={12} md={sidebarOpen ? 8 : 12} lg={sidebarOpen ? 9 : 12} sx={{ minWidth: 0, p: { xs: 1, md: 1.25 } }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    mb: 1.25,
                                    p: 0,
                                    borderRadius: { xs: '8px', md: '18px' },
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                <Box sx={{ px: { xs: 1.25, sm: 1.75 }, pt: { xs: 1.25, sm: 1.75 } }}>
                                    <Typography sx={{ fontWeight: 900, fontSize: '0.95rem' }}>
                                        Ghi Trade
                                    </Typography>
                                    <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>
                                        Chọn model, check factor, nhập thông tin, review và ghi chú trong cùng một khu vực.
                                    </Typography>
                                </Box>
                                <Suspense fallback={<LoadingFallback />}>
                                    <TradePanel onAddModel={handleAddModel} onEditModel={handleEditModel} />
                                </Suspense>
                            </Paper>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: { xs: 1.25, sm: 1.75 },
                                    borderRadius: { xs: '8px', md: '18px' },
                                    border: panelBorder,
                                    bgcolor: panelBg,
                                    backdropFilter: 'none',
                                    minWidth: 0,
                                    overflow: 'hidden',
                                }}
                            >
                                <Tabs
                                    value={liveTab}
                                    onChange={(_, v) => setLiveTab(v)}
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    allowScrollButtonsMobile
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
                    <Grid container spacing={0} className="mode-panel" alignItems="stretch">
                        {sidebarOpen && (
                            <Grid item xs={12} md={4} lg={3} sx={{ minWidth: 0 }}>
                                <Box sx={{ position: { md: 'sticky' }, top: { md: 54 }, minWidth: 0 }}>
                                    <AppSidebar
                                        appMode={appMode}
                                        onModeChange={setAppMode}
                                        panelBg={panelBg}
                                        panelBorder={panelBorder}
                                        onHide={() => setSidebarOpen(false)}
                                        modeSections={sidebarModeSections}
                                    />
                                </Box>
                            </Grid>
                        )}

                        <Grid item xs={12} md={sidebarOpen ? 8 : 12} lg={sidebarOpen ? 9 : 12} sx={{ minWidth: 0, p: { xs: 1, md: 1.25 } }}>
                            <Suspense fallback={<LoadingFallback />}>
                                <NotesPage />
                            </Suspense>
                        </Grid>
                    </Grid>
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
