'use client';

import React, { useState, Suspense, lazy, useMemo, useCallback } from 'react';
import {
    Box,
    Container,
    Grid,
    Tabs,
    Tab,
    Paper,
    useMediaQuery,
    useTheme,
    ToggleButton,
    ToggleButtonGroup,
    CircularProgress,
    Collapse,
    IconButton,
    Typography,
    Stack,
} from '@mui/material';
import {
    Analytics as TestIcon,
    LocalFireDepartment as LiveIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { Header } from '@/components/Header';
import { FactorList } from '@/components/FactorList/FactorList';
import {
    SessionPanel,
    TradeRecorder,
} from '@/components/TestMode';

// Lazy load heavy components
const TestResults = lazy(() => import('@/components/TestMode/TestResults'));
const TestTrades = lazy(() => import('@/components/TestMode/TestTrades'));
const TestCharts = lazy(() => import('@/components/TestMode/TestCharts'));
const TradePanel = lazy(() => import('@/components/LiveTrading/TradePanel'));
const TradeList = lazy(() => import('@/components/LiveTrading/TradeList'));
const ModelStats = lazy(() => import('@/components/LiveTrading/ModelStats'));
const LiveCharts = lazy(() => import('@/components/LiveTrading/LiveCharts'));
const LiveSessionHistory = lazy(() => import('@/components/LiveTrading/SessionHistory'));

// Import ModelList and ModelDialog directly since we need to control dialog from page level
import { ModelList, ModelDialog } from '@/components/LiveTrading/ModelList';
import { TradingModel } from '@/types';

// Loading component
const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress size={32} />
    </Box>
);


interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`results-tabpanel-${index}`}
            aria-labelledby={`results-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

type AppMode = 'test' | 'live';

export default function Home() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [appMode, setAppMode] = useState<AppMode>('test');
    const [testTab, setTestTab] = useState(0);
    const [liveTab, setLiveTab] = useState(0);

    // Collapse states for left panels
    const [sessionOpen, setSessionOpen] = useState(true);
    const [factorOpen, setFactorOpen] = useState(true);
    const [recorderOpen, setRecorderOpen] = useState(true);
    const [liveTradeOpen, setLiveTradeOpen] = useState(true);

    // Model dialog state (lifted to close on mode switch)
    const [modelDialogOpen, setModelDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<TradingModel | null>(null);

    // Close model dialog when mode changes
    React.useEffect(() => {
        console.log('Mode changed to:', appMode, '- closing dialog');
        setModelDialogOpen(false);
        setEditingModel(null);
    }, [appMode]);

    // Model dialog handlers
    const handleAddModel = useCallback(() => {
        setEditingModel(null);
        setModelDialogOpen(true);
    }, []);

    const handleEditModel = useCallback((model: TradingModel) => {
        setEditingModel(model);
        setModelDialogOpen(true);
    }, []);

    const handleCloseModelDialog = useCallback(() => {
        setModelDialogOpen(false);
        setEditingModel(null);
    }, []);

    return (
        <Box
            sx={{
                minHeight: '100vh',
                bgcolor: 'background.default',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Header />

            {/* Mode Switcher */}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <ToggleButtonGroup
                    value={appMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setAppMode(newMode)}
                    size="medium"
                >
                    <ToggleButton
                        value="test"
                        sx={{
                            px: 3,
                            gap: 1,
                            fontWeight: 600,
                            '&.Mui-selected': {
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'primary.dark',
                                },
                            },
                        }}
                    >
                        <TestIcon />
                        Test Mode
                    </ToggleButton>
                    <ToggleButton
                        value="live"
                        sx={{
                            px: 3,
                            gap: 1,
                            fontWeight: 600,
                            '&.Mui-selected': {
                                bgcolor: 'error.main',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: 'error.dark',
                                },
                            },
                        }}
                    >
                        <LiveIcon />
                        Thực Chiến
                    </ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
                {/* Test Mode - Manual Trade Recording */}
                {appMode === 'test' && (
                    <Grid container spacing={3}>
                        {/* Left Column */}
                        <Grid item xs={12} md={4} lg={3}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                {/* Session Panel - Collapsible */}
                                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            bgcolor: 'grey.200',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'grey.300' },
                                        }}
                                        onClick={() => setSessionOpen(!sessionOpen)}
                                    >
                                        <Typography variant="subtitle2" fontWeight={600}>📋 Session</Typography>
                                        <IconButton size="small">
                                            {sessionOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Stack>
                                    <Collapse in={sessionOpen}>
                                        <SessionPanel />
                                    </Collapse>
                                </Paper>

                                {/* Factors & Trade Recorder - Combined */}
                                <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                    <Stack
                                        direction="row"
                                        alignItems="center"
                                        justifyContent="space-between"
                                        sx={{
                                            px: 2,
                                            py: 1,
                                            bgcolor: 'grey.200',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'grey.300' },
                                        }}
                                        onClick={() => setRecorderOpen(!recorderOpen)}
                                    >
                                        <Typography variant="subtitle2" fontWeight={600}>✍️ Ghi Trade</Typography>
                                        <IconButton size="small">
                                            {recorderOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                        </IconButton>
                                    </Stack>
                                    <Collapse in={recorderOpen}>
                                        <FactorList />
                                        <TradeRecorder />
                                    </Collapse>
                                </Paper>
                            </Box>
                        </Grid>

                        {/* Right Column - Results */}
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <Tabs
                                    value={testTab}
                                    onChange={(_, newValue) => setTestTab(newValue)}
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            fontSize: '0.95rem',
                                            minWidth: 100,
                                        },
                                    }}
                                >
                                    <Tab label="Thống kê" />
                                    <Tab label="Trades" />
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

                {/* Live Mode - Model-based Trading */}
                {appMode === 'live' && (
                    <Grid container spacing={3}>
                        {/* Left Column - Models & Trade Panel Combined */}
                        <Grid item xs={12} md={4} lg={3}>
                            <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                                <Stack
                                    direction="row"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    sx={{
                                        px: 2,
                                        py: 1,
                                        bgcolor: 'grey.200',
                                        cursor: 'pointer',
                                        '&:hover': { bgcolor: 'grey.300' },
                                    }}
                                    onClick={() => setLiveTradeOpen(!liveTradeOpen)}
                                >
                                    <Typography variant="subtitle2" fontWeight={600}>🔥 Giao dịch</Typography>
                                    <IconButton size="small">
                                        {liveTradeOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                    </IconButton>
                                </Stack>
                                <Collapse in={liveTradeOpen}>
                                    <ModelList onAddModel={handleAddModel} onEditModel={handleEditModel} />
                                    <Suspense fallback={<LoadingFallback />}>
                                        <TradePanel />
                                    </Suspense>
                                </Collapse>
                            </Paper>
                        </Grid>

                        {/* Right Column - Trades & Stats */}
                        <Grid item xs={12} md={8} lg={9}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.paper',
                                }}
                            >
                                <Tabs
                                    value={liveTab}
                                    onChange={(_, newValue) => setLiveTab(newValue)}
                                    sx={{
                                        borderBottom: 1,
                                        borderColor: 'divider',
                                        '& .MuiTab-root': {
                                            textTransform: 'none',
                                            fontWeight: 500,
                                            fontSize: '0.95rem',
                                            minWidth: 100,
                                        },
                                    }}
                                >
                                    <Tab label="Trades" />
                                    <Tab label="Stats" />
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
            </Container>



            {/* Model Dialog - rendered at page level for proper state control */}
            <ModelDialog
                open={modelDialogOpen}
                onClose={handleCloseModelDialog}
                editModel={editingModel}
            />
        </Box>
    );
}
