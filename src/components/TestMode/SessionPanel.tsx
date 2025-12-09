'use client';

import React, { useState } from 'react';
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
    DialogActions,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as ActiveIcon,
    Stop as StopIcon,
    Edit as EditIcon,
} from '@mui/icons-material';
import { useTestSessionStore } from '@/store/testSessionStore';
import { MeasurementMode } from '@/types';

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

    const [sessionName, setSessionName] = useState('');
    const [sessionCounter, setSessionCounter] = useState(1);

    // Rename state
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

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
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Danh sách phiên: {sessions.length} phiên
                </Typography>

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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteSession(session.id);
                                            }}
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
        </Box>
    );
}

export default SessionPanel;
