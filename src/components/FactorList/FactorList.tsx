'use client';

import React, { useState } from 'react';
import {
    alpha,
    Box,
    Button,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Stack,
    TextField,
    Tooltip,
    Typography,
    useTheme,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckBox as CheckBoxIcon,
    CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
    Delete as DeleteIcon,
    DragIndicator as DragIcon,
    Tune as ManageIcon,
} from '@mui/icons-material';
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useFactorStore } from '@/store/factorStore';
import { FACTOR_COLORS } from '@/theme/theme';
import { Factor } from '@/types';

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
    const fc = FACTOR_COLORS[colorIdx % FACTOR_COLORS.length];

    const handleSave = () => {
        setIsEditing(false);
        const nextName = editValue.trim();
        if (nextName && nextName !== factor.name) onUpdate(nextName);
        else setEditValue(factor.name);
    };

    return (
        <Box
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                opacity: isDragging ? 0.55 : 1,
            }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                py: 0.85,
                px: 1.25,
                mb: 0.75,
                borderRadius: 2,
                border: '1px solid',
                bgcolor: factor.selected
                    ? alpha(fc.bg, isDark ? 0.14 : 0.08)
                    : alpha(theme.palette.text.primary, isDark ? 0.025 : 0.02),
                borderColor: factor.selected ? alpha(fc.bg, 0.38) : 'divider',
            }}
        >
            <IconButton size="small" sx={{ cursor: 'grab', p: 0.25 }} {...attributes} {...listeners}>
                <DragIcon sx={{ fontSize: 17, color: 'text.disabled' }} />
            </IconButton>

            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: fc.bg,
                    boxShadow: factor.selected ? `0 0 8px ${alpha(fc.bg, 0.7)}` : 'none',
                    flexShrink: 0,
                }}
            />

            <Checkbox
                checked={factor.selected}
                onChange={onToggle}
                size="small"
                sx={{ p: 0.25, color: alpha(fc.bg, 0.5), '&.Mui-checked': { color: fc.bg } }}
            />

            {isEditing ? (
                <TextField
                    value={editValue}
                    onChange={(event) => setEditValue(event.target.value)}
                    onBlur={handleSave}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSave();
                        if (event.key === 'Escape') {
                            setEditValue(factor.name);
                            setIsEditing(false);
                        }
                    }}
                    autoFocus
                    size="small"
                    variant="standard"
                    sx={{ flex: 1 }}
                />
            ) : (
                <Typography
                    onDoubleClick={() => {
                        setEditValue(factor.name);
                        setIsEditing(true);
                    }}
                    sx={{
                        flex: 1,
                        fontSize: '0.88rem',
                        fontWeight: factor.selected ? 800 : 500,
                        color: factor.selected ? fc.text : 'text.secondary',
                        cursor: 'text',
                    }}
                >
                    {factor.name}
                </Typography>
            )}

            <Tooltip title="Xóa factor">
                <IconButton size="small" color="error" onClick={onDelete} sx={{ p: 0.35 }}>
                    <DeleteIcon sx={{ fontSize: 17 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
}

export function FactorList() {
    const theme = useTheme();
    const { factors, addFactor, updateFactor, deleteFactor, toggleFactor, toggleAll, reorderFactors } = useFactorStore();
    const [manageOpen, setManageOpen] = useState(false);
    const [newFactorName, setNewFactorName] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [factorToDelete, setFactorToDelete] = useState<Factor | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const selectedFactors = factors.filter((factor) => factor.selected);
    const allSelected = factors.length > 0 && selectedFactors.length === factors.length;

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) reorderFactors(active.id as string, over.id as string);
    };

    const handleAddFactor = () => {
        const name = newFactorName.trim();
        if (!name) return;
        addFactor(name);
        setNewFactorName('');
    };

    const confirmDelete = () => {
        if (factorToDelete) deleteFactor(factorToDelete.id);
        setDeleteOpen(false);
        setFactorToDelete(null);
    };

    return (
        <Box sx={{ px: 1.75, pt: 1.75, pb: 0.75 }}>
            <Box
                sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === 'dark' ? 0.025 : 0.018),
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.25}>
                    <Box sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography sx={{ fontWeight: 900, fontSize: '0.95rem' }}>Factors</Typography>
                            <Chip
                                size="small"
                                label={`${selectedFactors.length}/${factors.length}`}
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }}
                            />
                        </Stack>
                        <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.75rem' }}>
                            Chọn setup trước khi ghi trade
                        </Typography>
                    </Box>

                    <Stack direction="row" spacing={0.75}>
                        <Tooltip title={allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}>
                            <IconButton
                                size="small"
                                onClick={() => toggleAll(!allSelected)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                            >
                                {allSelected ? <CheckBoxIcon fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Quản lý factors">
                            <IconButton
                                size="small"
                                onClick={() => setManageOpen(true)}
                                sx={{ border: '1px solid', borderColor: 'divider' }}
                            >
                                <ManageIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>

                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                    {selectedFactors.length === 0 ? (
                        <Chip size="small" label="Chưa chọn factor" sx={{ height: 24, fontWeight: 700 }} />
                    ) : selectedFactors.slice(0, 5).map((factor) => {
                        const idx = factors.findIndex((item) => item.id === factor.id);
                        const color = FACTOR_COLORS[idx % FACTOR_COLORS.length];
                        return (
                            <Chip
                                key={factor.id}
                                size="small"
                                label={factor.name}
                                onDelete={() => toggleFactor(factor.id)}
                                sx={{
                                    height: 24,
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    bgcolor: color.light,
                                    color: color.text,
                                    border: `1px solid ${alpha(color.bg, 0.35)}`,
                                }}
                            />
                        );
                    })}
                    {selectedFactors.length > 5 && (
                        <Chip size="small" label={`+${selectedFactors.length - 5}`} sx={{ height: 24, fontWeight: 800 }} />
                    )}
                </Stack>
            </Box>

            <Dialog open={manageOpen} onClose={() => setManageOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Quản lý factors</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 0.5 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <TextField
                                label="Tên factor mới"
                                value={newFactorName}
                                onChange={(event) => setNewFactorName(event.target.value)}
                                onKeyDown={(event) => event.key === 'Enter' && handleAddFactor()}
                                size="small"
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleAddFactor}
                                disabled={!newFactorName.trim()}
                                sx={{ minWidth: 110 }}
                            >
                                Thêm
                            </Button>
                        </Stack>

                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                                Double-click tên factor để sửa. Kéo icon bên trái để đổi thứ tự.
                            </Typography>
                            <Button size="small" onClick={() => toggleAll(!allSelected)}>
                                {allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                            </Button>
                        </Stack>

                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={factors.map((factor) => factor.id)} strategy={verticalListSortingStrategy}>
                                <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                                    {factors.map((factor, idx) => (
                                        <SortableFactor
                                            key={factor.id}
                                            factor={factor}
                                            colorIdx={idx}
                                            onToggle={() => toggleFactor(factor.id)}
                                            onUpdate={(name) => updateFactor(factor.id, name)}
                                            onDelete={() => {
                                                setFactorToDelete(factor);
                                                setDeleteOpen(true);
                                            }}
                                        />
                                    ))}
                                    {factors.length === 0 && (
                                        <Typography sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                                            Chưa có factor nào.
                                        </Typography>
                                    )}
                                </Box>
                            </SortableContext>
                        </DndContext>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setManageOpen(false)}>Đóng</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Xóa factor</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bạn có chắc muốn xóa factor "{factorToDelete?.name}"?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Hủy</Button>
                    <Button color="error" variant="contained" onClick={confirmDelete}>Xóa</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default FactorList;
