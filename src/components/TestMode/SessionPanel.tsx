'use client';

import React, { useState, useRef } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Stack,
    ToggleButton,
    ToggleButtonGroup,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    Alert,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as ActiveIcon,
    Stop as StopIcon,
    Edit as EditIcon,
    FileDownload as ExportIcon,
    TableChart as ExcelIcon,
    Backup as BackupIcon,
    CloudUpload as ImportIcon,
} from '@mui/icons-material';
import { useTestSessionStore, TestSession } from '@/store/testSessionStore';
import { useFactorStore } from '@/store/factorStore';
import { MeasurementMode } from '@/types';
import { exportTestSessionToExcel } from '@/utils/exportExcel';
import { backupTestSession, restoreTestSession } from '@/utils/backupUtils';

export function SessionPanel() {
    const {
        measurementMode,
        setMeasurementMode,
        currentSession,
        sessions,
        createSession,
        endSession,
        renameSession,
        selectSession,
        deleteSession,
    } = useTestSessionStore();

    const { factors } = useFactorStore();

    const [sessionName, setSessionName] = useState('');
    const [sessionCounter, setSessionCounter] = useState(1);

    // Rename state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    // Delete confirmation state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [sessionToDelete, setSessionToDelete] = useState<{ id: string; name: string } | null>(null);

    // Export dialog state
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [sessionToExport, setSessionToExport] = useState<TestSession | null>(null);
    const [exporting, setExporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getFactorName = (id: string) => {
        return factors.find(f => f.id === id)?.name || id;
    };

    const handleExportClick = (session: TestSession, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessionToExport(session);
        setExportDialogOpen(true);
        setImportError(null);
        setImportSuccess(false);
    };

    const handleExportExcel = async () => {
        if (!sessionToExport) return;
        setExporting(true);
        try {
            await exportTestSessionToExcel(sessionToExport, getFactorName);
        } catch (error) {
            console.error('Export error:', error);
        }
        setExporting(false);
    };

    const handleExportBackup = async () => {
        if (!sessionToExport) return;
        setExporting(true);
        try {
            await backupTestSession(sessionToExport, factors);
        } catch (error) {
            console.error('Backup error:', error);
        }
        setExporting(false);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setExporting(true);
        setImportError(null);

        try {
            const result = await restoreTestSession(file);
            if (result) {
                // Add session to store - need to access store directly
                const store = useTestSessionStore.getState();
                // Check if session with same ID already exists
                const existingSession = store.sessions.find(s => s.id === result.session.id);
                if (existingSession) {
                    // Generate new ID to avoid conflicts
                    result.session.id = `imported_${Date.now()}`;
                    result.session.name = `${result.session.name} (imported)`;
                }
                // Add to sessions
                useTestSessionStore.setState({
                    sessions: [...store.sessions, result.session],
                });
                setImportSuccess(true);
                setImportError(null);
            } else {
                setImportError('Không thể đọc file backup. Vui lòng kiểm tra định dạng file.');
            }
        } catch (error) {
            setImportError('Có lỗi xảy ra khi import. Vui lòng thử lại.');
        }

        setExporting(false);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteClick = (id: string, name: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setSessionToDelete({ id, name });
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (sessionToDelete) {
            deleteSession(sessionToDelete.id);
        }
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setSessionToDelete(null);
    };

    const handleRenameClick = (id: string, currentName: string) => {
        setEditingSessionId(id);
        setEditingName(currentName);
        setRenameDialogOpen(true);
    };

    const handleRenameSubmit = () => {
        if (editingSessionId && editingName.trim()) {
            renameSession(editingSessionId, editingName.trim());
            setRenameDialogOpen(false);
            setEditingSessionId(null);
            setEditingName('');
        }
    };

    const handleCreateSession = () => {
        const name = sessionName.trim() || `Phiên Test ${sessionCounter}`;
        createSession(name);
        setSessionName('');
        setSessionCounter(sessionCounter + 1);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Box
            sx={{
                p: 2.5,
            }}
        >
            {/* Current Session */}
            {currentSession && (
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Phiên hiện tại
                    </Typography>
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            bgcolor: 'primary.50',
                            border: '1px solid',
                            borderColor: 'primary.main',
                        }}
                    >
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box>
                                <Typography variant="body1" fontWeight={600} color="primary.main">
                                    {currentSession.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Tạo lúc: {formatDate(currentSession.startTime)}
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    <Chip
                                        label={`Mode: ${currentSession.measurementMode}`}
                                        size="small"
                                        color="primary"
                                    />
                                </Box>
                            </Box>
                            <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<StopIcon />}
                                onClick={endSession}
                                sx={{ minWidth: 100 }}
                            >
                                Kết thúc
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            )}

            {/* Create New Session */}
            <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Tạo phiên mới
                </Typography>

                <TextField
                    fullWidth
                    size="small"
                    placeholder="Tên phiên (tùy chọn)"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    disabled={!!currentSession}
                    sx={{ mb: 2 }}
                />

                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Chọn mode trước khi tạo:
                </Typography>
                <ToggleButtonGroup
                    value={measurementMode}
                    exclusive
                    onChange={(_, newMode) => newMode && setMeasurementMode(newMode)}
                    disabled={!!currentSession}
                    fullWidth
                    size="small"
                    sx={{ mb: 1.5 }}
                >
                    <ToggleButton value="RR" sx={{ fontWeight: 600 }}>
                        RR
                    </ToggleButton>
                    <ToggleButton value="$" sx={{ fontWeight: 600 }}>
                        $
                    </ToggleButton>
                    <ToggleButton value="%" sx={{ fontWeight: 600 }}>
                        %
                    </ToggleButton>
                </ToggleButtonGroup>

                <Button
                    variant="contained"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={handleCreateSession}
                    color="success"
                    disabled={!!currentSession}
                >
                    + Tạo phiên test
                </Button>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Sessions List */}
            <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Danh sách phiên: {sessions.length} phiên
                    </Typography>
                    <Tooltip title="Nhập dữ liệu từ ZIP">
                        <IconButton
                            size="small"
                            onClick={handleImportClick}
                            disabled={exporting}
                            color="primary"
                        >
                            <ImportIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".zip"
                    style={{ display: 'none' }}
                />

                {importError && (
                    <Alert severity="error" sx={{ mb: 1 }} onClose={() => setImportError(null)}>{importError}</Alert>
                )}
                {importSuccess && (
                    <Alert severity="success" sx={{ mb: 1 }} onClose={() => setImportSuccess(false)}>Đã import thành công!</Alert>
                )}

                {sessions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                        Chưa có phiên nào
                    </Typography>
                ) : (
                    <List sx={{ maxHeight: 200, overflow: 'auto' }} dense>
                        {sessions.map((session) => (
                            <ListItem
                                key={session.id}
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    bgcolor: session.id === currentSession?.id ? 'primary.50' : 'grey.50',
                                    border: '1px solid',
                                    borderColor: session.id === currentSession?.id ? 'primary.main' : 'transparent',
                                    cursor: 'pointer',
                                }}
                                onClick={() => selectSession(session.id)}
                            >
                                {session.id === currentSession?.id && (
                                    <ActiveIcon sx={{ color: 'primary.main', mr: 1, fontSize: 16 }} />
                                )}
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={500}>
                                                {session.name}
                                            </Typography>
                                            <Chip
                                                label={session.measurementMode}
                                                size="small"
                                                sx={{ fontSize: '0.65rem', height: 18 }}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Typography variant="caption" color="text.secondary">
                                            {formatDate(session.startTime)} • {session.trades.length} trades
                                        </Typography>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    <Tooltip title="Xuất/Nhập">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleExportClick(session, e)}
                                            sx={{ color: 'primary.main', mr: 0.5 }}
                                        >
                                            <ExportIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Đổi tên">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRenameClick(session.id, session.name);
                                            }}
                                            sx={{ mr: 0.5 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Xóa">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleDeleteClick(session.id, session.name, e)}
                                            sx={{ color: 'error.main' }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>

            {/* Rename Dialog */}
            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
                <DialogTitle>Đổi tên phiên</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Tên phiên mới"
                        fullWidth
                        variant="outlined"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Hủy</Button>
                    <Button onClick={handleRenameSubmit} variant="contained">Lưu</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-session-dialog-title"
                aria-describedby="delete-session-dialog-description"
            >
                <DialogTitle id="delete-session-dialog-title">
                    Xác nhận xóa Session
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-session-dialog-description">
                        Bạn có chắc chắn muốn xóa phiên "<strong>{sessionToDelete?.name}</strong>"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel} color="inherit">
                        Hủy
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Export Dialog */}
            <Dialog
                open={exportDialogOpen}
                onClose={() => setExportDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>
                    Xuất/Nhập dữ liệu
                    {sessionToExport && (
                        <Typography variant="body2" color="text.secondary">
                            {sessionToExport.name}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {/* Export Excel */}
                        <Button
                            variant="outlined"
                            startIcon={exporting ? <CircularProgress size={20} /> : <ExcelIcon />}
                            onClick={handleExportExcel}
                            disabled={exporting}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1.5 }}
                        >
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body2" fontWeight={600}>Xuất Excel</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Báo cáo đẹp để xem/in
                                </Typography>
                            </Box>
                        </Button>

                        {/* Export Backup */}
                        <Button
                            variant="outlined"
                            startIcon={exporting ? <CircularProgress size={20} /> : <BackupIcon />}
                            onClick={handleExportBackup}
                            disabled={exporting}
                            fullWidth
                            sx={{ justifyContent: 'flex-start', py: 1.5 }}
                        >
                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="body2" fontWeight={600}>Sao lưu (ZIP)</Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Lưu trữ & khôi phục sau này
                                </Typography>
                            </Box>
                        </Button>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setExportDialogOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>
        </Box >
    );
}

export default SessionPanel;
