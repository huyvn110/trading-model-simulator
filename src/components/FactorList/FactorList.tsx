'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
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

interface SortableFactorProps {
    factor: Factor;
    onToggle: () => void;
    onUpdate: (name: string) => void;
    onDelete: () => void;
}

function SortableFactor({ factor, onToggle, onUpdate, onDelete }: SortableFactorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(factor.name);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: factor.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDoubleClick = () => {
        setIsEditing(true);
        setEditValue(factor.name);
    };

    const handleBlur = () => {
        setIsEditing(false);
        if (editValue.trim() && editValue !== factor.name) {
            onUpdate(editValue.trim());
        } else {
            setEditValue(factor.name);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(factor.name);
        }
    };

    return (
        <Box
            ref={setNodeRef}
            style={style}
            className={`factor-item ${factor.selected ? 'selected' : ''}`}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                py: 1,
                px: 1.5,
                borderRadius: 1.5,
                '&:hover': {
                    bgcolor: 'action.hover',
                },
            }}
        >
            <IconButton
                className="drag-handle"
                size="small"
                sx={{ cursor: 'grab', p: 0.5 }}
                {...attributes}
                {...listeners}
            >
                <DragIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            </IconButton>

            <Checkbox
                checked={factor.selected}
                onChange={onToggle}
                size="small"
                sx={{ p: 0.5 }}
            />

            {isEditing ? (
                <TextField
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    size="small"
                    variant="standard"
                    sx={{
                        flex: 1,
                        '& .MuiInput-underline:before': { borderBottom: 'none' },
                        '& .MuiInput-underline:after': { borderColor: 'primary.main' },
                    }}
                    InputProps={{
                        sx: { fontSize: '0.95rem' },
                    }}
                />
            ) : (
                <Typography
                    onDoubleClick={handleDoubleClick}
                    sx={{
                        flex: 1,
                        cursor: 'text',
                        fontSize: '0.95rem',
                        py: 0.25,
                        color: factor.selected ? 'text.primary' : 'text.secondary',
                        textDecoration: factor.selected ? 'none' : 'line-through',
                    }}
                >
                    {factor.name}
                </Typography>
            )}

            <IconButton
                className="delete-btn"
                size="small"
                onClick={onDelete}
                sx={{ p: 0.5, color: 'error.main' }}
            >
                <DeleteIcon fontSize="small" />
            </IconButton>
        </Box>
    );
}

export function FactorList() {
    const [newFactorName, setNewFactorName] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [factorToDelete, setFactorToDelete] = useState<Factor | null>(null);
    const {
        factors,
        addFactor,
        updateFactor,
        deleteFactor,
        toggleFactor,
        toggleAll,
        reorderFactors,
    } = useFactorStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            reorderFactors(active.id as string, over.id as string);
        }
    };

    const handleAddFactor = () => {
        if (newFactorName.trim()) {
            addFactor(newFactorName.trim());
            setNewFactorName('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddFactor();
        }
    };

    const handleDeleteClick = (factor: Factor) => {
        setFactorToDelete(factor);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (factorToDelete) {
            deleteFactor(factorToDelete.id);
        }
        setDeleteDialogOpen(false);
        setFactorToDelete(null);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setFactorToDelete(null);
    };

    const selectedCount = factors.filter((f) => f.selected).length;
    const allSelected = selectedCount === factors.length && factors.length > 0;
    const someSelected = selectedCount > 0 && selectedCount < factors.length;

    return (
        <Box
            sx={{
                p: 2.5,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Factors
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {selectedCount} / {factors.length} selected
                </Typography>
            </Box>

            <Tooltip title={allSelected ? "Deselect All" : "Select All"}>
                <IconButton
                    size="small"
                    onClick={() => toggleAll(!allSelected)}
                    sx={{ color: allSelected ? 'primary.main' : 'text.secondary' }}
                >
                    {allSelected ? <CheckBoxIcon fontSize="small" /> : <CheckBoxOutlineBlankIcon fontSize="small" />}
                </IconButton>
            </Tooltip>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={factors.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <Box sx={{ mb: 2 }}>
                        {factors.map((factor) => (
                            <SortableFactor
                                key={factor.id}
                                factor={factor}
                                onToggle={() => toggleFactor(factor.id)}
                                onUpdate={(name) => updateFactor(factor.id, name)}
                                onDelete={() => handleDeleteClick(factor)}
                            />
                        ))}
                    </Box>
                </SortableContext>
            </DndContext>

            {factors.length === 0 && (
                <Box
                    sx={{
                        py: 4,
                        textAlign: 'center',
                        color: 'text.secondary',
                    }}
                >
                    <Typography variant="body2">
                        No factors yet. Add your first factor below.
                    </Typography>
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField
                    placeholder="New factor name..."
                    value={newFactorName}
                    onChange={(e) => setNewFactorName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    size="small"
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'grey.100',
                        },
                    }}
                />
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddFactor}
                    disabled={!newFactorName.trim()}
                    sx={{ whiteSpace: 'nowrap' }}
                >
                    Add
                </Button>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="delete-dialog-title"
                aria-describedby="delete-dialog-description"
            >
                <DialogTitle id="delete-dialog-title">
                    Xác nhận xóa Factor
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="delete-dialog-description">
                        Bạn có chắc chắn muốn xóa factor "<strong>{factorToDelete?.name}</strong>"?
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
        </Box>
    );
}

export default FactorList;
