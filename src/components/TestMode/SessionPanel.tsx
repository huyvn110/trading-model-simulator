'use client';

import React, { useRef, useState } from 'react';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    ListItemText,
    Stack,
    TextField,
    Tooltip,
    Typography,
    alpha,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    Backup as BackupIcon,
    CloudUpload as ImportIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    FileDownload as ExportIcon,
    FolderOpen as ManageIcon,
    Stop as StopIcon,
    TableChart as ExcelIcon,
} from '@mui/icons-material';
import { useTestSessionStore, TestSession } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { backupTestSession, restoreTestSession } from '@/utils/backupUtils';
import { exportTestSessionToExcel } from '@/utils/exportExcel';

function formatMoney(value: number) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function SessionPanel({
    createOpen,
    onCreateOpenChange,
}: {
    createOpen: boolean;
    onCreateOpenChange: (open: boolean) => void;
}) {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';
    const {
        currentSession,
        sessions,
        setMeasurementMode,
        createSession,
        endSession,
        renameSession,
        selectSession,
        deleteSession,
    } = useTestSessionStore();
    const { factors } = useFactorStore();

    const [manageOpen, setManageOpen] = useState(false);
    const [sessionName, setSessionName] = useState('');
    const [initialBalance, setInitialBalance] = useState('1000');
    const [renameOpen, setRenameOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<{ id: string; name: string } | null>(null);
    const [exportOpen, setExportOpen] = useState(false);
    const [sessionToExport, setSessionToExport] = useState<TestSession | null>(null);
    const [busy, setBusy] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const getFactorName = (id: string) => factors.find((factor) => factor.id === id)?.name || id;

    React.useEffect(() => {
        if (createOpen) {
            setImportError(null);
            setImportSuccess(false);
        }
    }, [createOpen]);

    const handleCreateSession = () => {
        const name = sessionName.trim() || `Phiên Test ${sessions.length + 1}`;
        if (sessions.some((session) => session.name === name)) {
            setImportError(`Tên "${name}" đã tồn tại. Hãy chọn tên khác.`);
            return;
        }

        setMeasurementMode('$');
        createSession(name, parseFloat(initialBalance) || 0);
        setSessionName('');
        setInitialBalance('1000');
        setImportError(null);
        onCreateOpenChange(false);
        setManageOpen(false);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setBusy(true);
        setImportError(null);
        try {
            const result = await restoreTestSession(file);
            if (!result) {
                setImportError('Không thể đọc file backup. Vui lòng kiểm tra lại định dạng.');
                return;
            }

            const store = useTestSessionStore.getState();
            if (store.sessions.some((session) => session.id === result.session.id)) {
                result.session.id = `imported_${Date.now()}`;
                result.session.name = `${result.session.name} (imported)`;
            }

            useTestSessionStore.setState({ sessions: [...store.sessions, result.session] });
            setImportSuccess(true);
        } catch {
            setImportError('Có lỗi khi import. Vui lòng thử lại.');
        } finally {
            setBusy(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleExportExcel = async () => {
        if (!sessionToExport) return;
        setBusy(true);
        try {
            await exportTestSessionToExcel(sessionToExport, getFactorName);
        } finally {
            setBusy(false);
        }
    };

    const handleExportBackup = async () => {
        if (!sessionToExport) return;
        setBusy(true);
        try {
            await backupTestSession(sessionToExport, factors);
        } finally {
            setBusy(false);
        }
    };

    const openRename = (session: TestSession) => {
        setEditingSessionId(session.id);
        setEditingName(session.name);
        setRenameOpen(true);
    };

    const submitRename = () => {
        if (editingSessionId && editingName.trim()) {
            renameSession(editingSessionId, editingName.trim());
            setRenameOpen(false);
            setEditingSessionId(null);
            setEditingName('');
        }
    };

    const openDelete = (session: TestSession) => {
        setSessionToDelete({ id: session.id, name: session.name });
        setDeleteOpen(true);
    };

    const confirmDelete = () => {
        if (sessionToDelete) deleteSession(sessionToDelete.id);
        setDeleteOpen(false);
        setSessionToDelete(null);
    };

    const cardBorder = isDark ? 'rgba(148,163,184,0.18)' : 'rgba(15,23,42,0.12)';

    return (
        <Box sx={{ p: 1.75 }}>
            <Box
                sx={{
                    p: 1.75,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: currentSession ? alpha(theme.palette.primary.main, 0.65) : cardBorder,
                    bgcolor: currentSession ? alpha(theme.palette.primary.main, isDark ? 0.08 : 0.05) : alpha(theme.palette.text.primary, 0.025),
                }}
            >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                            Current Session
                        </Typography>
                        <Typography sx={{ mt: 0.35, fontWeight: 800, color: currentSession ? 'primary.main' : 'text.primary' }} noWrap>
                            {currentSession?.name || 'Chưa có phiên'}
                        </Typography>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                            <Chip
                                size="small"
                                label={currentSession ? formatMoney(currentSession.initialBalance) : 'No balance'}
                                sx={{ height: 22, fontWeight: 700 }}
                            />
                            <Chip
                                size="small"
                                label={`${currentSession?.trades.length || 0} trades`}
                                sx={{ height: 22, fontWeight: 700 }}
                            />
                        </Stack>
                    </Box>

                    <Stack direction="row" spacing={0.75}>
                        <Tooltip title="Quản lý phiên">
                            <IconButton
                                size="small"
                                onClick={() => setManageOpen(true)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                            >
                                <ManageIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        {currentSession && (
                            <Tooltip title="Kết thúc phiên">
                                <IconButton
                                    size="small"
                                    color="error"
                                    onClick={endSession}
                                    sx={{ border: '1px solid', borderColor: alpha(theme.palette.error.main, 0.35) }}
                                >
                                    <StopIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                {currentSession && (
                    <Typography sx={{ mt: 1.1, fontSize: '0.75rem', color: 'text.secondary' }}>
                        Started {formatDate(currentSession.startTime)}
                    </Typography>
                )}
            </Box>

            <Dialog open={createOpen} onClose={() => onCreateOpenChange(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Tạo mục mới</DialogTitle>
                <DialogContent>
                    <Stack spacing={1.5} sx={{ pt: 0.75 }}>
                        <TextField
                            autoFocus
                            size="small"
                            label="Tên mục mới"
                            placeholder={`Phiên Test ${sessions.length + 1}`}
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
                        {importError && <Alert severity="error" onClose={() => setImportError(null)}>{importError}</Alert>}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => onCreateOpenChange(false)}>Hủy</Button>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateSession}>
                        Tạo
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Quản lý phiên test</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.25} sx={{ pt: 0.5 }}>
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                bgcolor: alpha(theme.palette.text.primary, 0.025),
                            }}
                        >
                            <Typography sx={{ mb: 1.5, fontWeight: 800 }}>Tạo mục mới</Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
                                <TextField
                                    size="small"
                                    label="Tên mục mới"
                                    placeholder={`Phiên Test ${sessions.length + 1}`}
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
                                    sx={{ minWidth: 150 }}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                                    }}
                                />
                            </Stack>
                            <Button
                                sx={{ mt: 1.5 }}
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreateSession}
                                fullWidth
                            >
                                Tạo mục
                            </Button>
                        </Box>

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography sx={{ fontWeight: 800 }}>Danh sách phiên</Typography>
                            <Stack direction="row" spacing={0.75}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    style={{ display: 'none' }}
                                />
                                <Tooltip title="Import ZIP">
                                    <IconButton size="small" onClick={() => fileInputRef.current?.click()} disabled={busy}>
                                        <ImportIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        {importError && <Alert severity="error" onClose={() => setImportError(null)}>{importError}</Alert>}
                        {importSuccess && <Alert severity="success" onClose={() => setImportSuccess(false)}>Đã import thành công.</Alert>}

                        <List sx={{ maxHeight: 340, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            {sessions.length === 0 ? (
                                <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>Chưa có phiên nào</Typography>
                            ) : sessions.map((session) => {
                                const isActive = session.id === currentSession?.id;
                                const isEnded = !!session.endTime;
                                return (
                                    <ListItem
                                        key={session.id}
                                        sx={{
                                            borderBottom: '1px solid',
                                            borderColor: 'divider',
                                            bgcolor: isActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                                            cursor: !isEnded ? 'pointer' : 'default',
                                        }}
                                        onClick={() => {
                                            if (!isEnded) {
                                                selectSession(session.id);
                                                setManageOpen(false);
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <Typography sx={{ fontWeight: 800 }}>{session.name}</Typography>
                                                    {isActive && <Chip size="small" label="Active" color="primary" sx={{ height: 18 }} />}
                                                    {isEnded && <Chip size="small" label="Ended" sx={{ height: 18 }} />}
                                                </Stack>
                                            }
                                            secondary={`${formatDate(session.startTime)} • ${session.trades.length} trades • ${formatMoney(session.initialBalance)}`}
                                        />
                                        <ListItemSecondaryAction>
                                            <Tooltip title="Xuất">
                                                <IconButton
                                                    size="small"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setSessionToExport(session);
                                                        setExportOpen(true);
                                                    }}
                                                >
                                                    <ExportIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Đổi tên">
                                                <IconButton size="small" onClick={(event) => { event.stopPropagation(); openRename(session); }}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Xóa">
                                                <IconButton size="small" color="error" onClick={(event) => { event.stopPropagation(); openDelete(session); }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </ListItemSecondaryAction>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setManageOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={renameOpen} onClose={() => setRenameOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Đổi tên phiên</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        margin="dense"
                        label="Tên phiên mới"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameOpen(false)}>Hủy</Button>
                    <Button variant="contained" onClick={submitRename}>Lưu</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Xóa phiên</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc muốn xóa phiên "{sessionToDelete?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Hủy</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Xóa</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={exportOpen} onClose={() => setExportOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>
                    Xuất dữ liệu
                    {sessionToExport && (
                        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{sessionToExport.name}</Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={1.25} sx={{ pt: 0.5 }}>
                        <Button
                            variant="outlined"
                            startIcon={busy ? <CircularProgress size={18} /> : <ExcelIcon />}
                            onClick={handleExportExcel}
                            disabled={busy}
                            fullWidth
                        >
                            Xuất Excel
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={busy ? <CircularProgress size={18} /> : <BackupIcon />}
                            onClick={handleExportBackup}
                            disabled={busy}
                            fullWidth
                        >
                            Sao lưu ZIP
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default SessionPanel;
