'use client';

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Checkbox,
    IconButton,
    TextField,
    Button,
    Tooltip,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFactorStore } from '@/store/factorStore';
import { Factor } from '@/types';
import { FACTOR_COLORS } from '@/theme/theme';

interface SortableFactorProps {
    factor: Factor;
    colorIdx: number;
    onToggle: () => void;
    onUpdate: (name: string) => void;
    onDelete: () => void;
}

function SortableFactor({ factor, colorIdx, onToggle, onUpdate, onDelete }: SortableFactorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(factor.name);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: factor.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const fc = FACTOR_COLORS[colorIdx % FACTOR_COLORS.length];

    const handleDoubleClick = () => { setIsEditing(true); setEditValue(factor.name); };
    const handleBlur = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== factor.name) onUpdate(editValue.trim());
        else setEditValue(factor.name);
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleBlur();
        else if (e.key === 'Escape') { setIsEditing(false); setEditValue(factor.name); }
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                py: 0.75,
                px: 1.25,
                mb: 0.5,
                borderRadius: 2,
                cursor: 'default',
                border: '1px solid',
                transition: 'all 0.2s ease',
                // Color coding based on selection + factor color
                ...(factor.selected ? {
                    bgcolor: isDark ? alpha(fc.bg, 0.12) : alpha(fc.bg, 0.07),
                    borderColor: alpha(fc.bg, 0.35),
                } : {
                    bgcolor: 'transparent',
                    borderColor: 'transparent',
                    '&:hover': {
                        bgcolor: isDark ? 'rgba(241,245,249,0.05)' : 'rgba(15,23,42,0.04)',
                        borderColor: 'divider',
                    },
                }),
            }}
        >
            {/* Drag handle */}
            <IconButton
                className="drag-handle"
                size="small"
                sx={{
                    cursor: 'grab',
                    p: 0.25,
                    opacity: 0,
                    '.factor-row:hover &': { opacity: 1 },
                    '&:hover': { bgcolor: 'action.hover' },
                }}
                {...attributes}
                {...listeners}
            >
                <DragIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
            </IconButton>

            {/* Color dot */}
            <Box sx={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                bgcolor: fc.bg,
                boxShadow: factor.selected ? `0 0 6px ${alpha(fc.bg, 0.7)}` : 'none',
                transition: 'box-shadow 0.2s ease',
            }} />

            {/* Checkbox */}
            <Checkbox
                checked={factor.selected}
                onChange={onToggle}
                size="small"
                sx={{
                    p: 0.25,
                    color: alpha(fc.bg, 0.5),
                    '&.Mui-checked': { color: fc.bg },
                }}
            />

            {/* Name (editable) */}
            {isEditing ? (
                <TextField
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    size="small"
                    variant="standard"
                    sx={{
                        flex: 1,
                        '& .MuiInput-underline:before': { borderBottom: 'none' },
                        '& .MuiInput-underline:after': { borderColor: fc.bg },
                    }}
                    InputProps={{ sx: { fontSize: '0.875rem', fontWeight: 500 } }}
                />
            ) : (
                <Typography
                    onDoubleClick={handleDoubleClick}
                    sx={{
                        flex: 1,
                        cursor: 'text',
                        fontSize: '0.875rem',
                        fontWeight: factor.selected ? 600 : 400,
                        py: 0.25,
                        color: factor.selected ? fc.text : 'text.secondary',
                        transition: 'all 0.15s ease',
                    }}
                >
                    {factor.name}
                </Typography>
            )}

            {/* Delete */}
            <IconButton
                className="delete-btn"
                size="small"
                onClick={onDelete}
                sx={{
                    p: 0.25, opacity: 0,
                    color: 'error.main',
                    '.factor-row:hover &': { opacity: 1 },
                    '&:hover': { bgcolor: alpha('#f43f5e', 0.1) },
                }}
            >
                <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
        </Box>
    );
}

export function FactorList() {
    const [newFactorName, setNewFactorName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [factorToDelete, setFactorToDelete] = useState<Factor | null>(null);
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    const { factors, addFactor, updateFactor, deleteFactor, toggleFactor, toggleAll, reorderFactors } = useFactorStore();

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const handleDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) reorderFactors(active.id as string, over.id as string);
    };

    const handleAddFactor = () => {
        if (newFactorName.trim()) { addFactor(newFactorName.trim()); setNewFactorName(''); }
    };

    const selectedCount = factors.filter(f => f.selected).length;
    const allSelected   = selectedCount === factors.length && factors.length > 0;

    return (
        <Box sx={{ p: 2.5, pb: 1.5 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        Factors
                    </Typography>
                    {/* Selected count badge */}
                    {selectedCount > 0 && (
                        <Box sx={{
                            px: 1, py: 0.1, borderRadius: 2,
                            bgcolor: alpha('#2383e2', 0.15),
                            border: `1px solid ${alpha('#2383e2', 0.3)}`,
                        }}>
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#529aec' }}>
                                {selectedCount} selected
                            </Typography>
                        </Box>
                    )}
                </Stack>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {selectedCount}/{factors.length}
                    </Typography>
                    <Tooltip title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}>
                        <IconButton size="small" onClick={() => toggleAll(!allSelected)} sx={{ p: 0.5 }}>
                            {allSelected
                                ? <CheckBoxIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                                : <CheckBoxOutlineBlankIcon sx={{ fontSize: 18, color: 'text.secondary' }} />}
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>

            {/* Factor list */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={factors.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <Box className="factor-row-container" sx={{ mb: 1 }}>
                        {factors.map((factor, idx) => (
                            <Box key={factor.id} className="factor-row" sx={{ '&:hover .drag-handle, &:hover .delete-btn': { opacity: 1 } }}>
                                <SortableFactor
                                    factor={factor}
                                    colorIdx={idx}
                                    onToggle={() => toggleFactor(factor.id)}
                                    onUpdate={name => updateFactor(factor.id, name)}
                                    onDelete={() => { setFactorToDelete(factor); setDeleteDialogOpen(true); }}
                                />
                            </Box>
                        ))}
                    </Box>
                </SortableContext>
            </DndContext>

            {factors.length === 0 && (
                <Box sx={{ py: 3, textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'text.disabled', fontSize: '0.82rem' }}>
                        Chưa có factor. Thêm factor đầu tiên bên dưới.
                    </Typography>
                </Box>
            )}

            {/* Add factor input */}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <TextField
                    placeholder="Tên factor mới..."
                    value={newFactorName}
                    onChange={e => setNewFactorName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFactor()}
                    size="small"
                    fullWidth
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddFactor}
                    disabled={!newFactorName.trim()}
                    sx={{ whiteSpace: 'nowrap', minWidth: 80 }}
                >
                    Thêm
                </Button>
            </Stack>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => { setDeleteDialogOpen(false); setFactorToDelete(null); }}>
                <DialogTitle>Xác nhận xóa Factor</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc muốn xóa factor <strong>"{factorToDelete?.name}"</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setDeleteDialogOpen(false); setFactorToDelete(null); }} color="inherit">Hủy</Button>
                    <Button
                        onClick={() => {
                            if (factorToDelete) deleteFactor(factorToDelete.id);
                            setDeleteDialogOpen(false); setFactorToDelete(null);
                        }}
                        color="error" variant="contained" autoFocus
                    >
                        Xóa
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FactorList;
