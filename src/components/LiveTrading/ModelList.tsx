'use client';

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    IconButton,
    Tooltip,
    Stack,
    Collapse,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    ExpandMore as ExpandIcon,
    ExpandLess as CollapseIcon,
    CheckCircle as SelectedIcon,
} from '@mui/icons-material';
import { useModelStore } from '@/store/modelStore';
import { TradingModel } from '@/types';

interface ModelItemProps {
    model: TradingModel;
    isSelected: boolean;
    onSelect: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleFactor: (factor: string) => void;
}

function ModelItem({ model, isSelected, onSelect, onEdit, onDelete, onToggleFactor }: ModelItemProps) {
    const [expanded, setExpanded] = useState(false);
    const checkedCount = model.checkedFactors?.length || 0;
    const totalFactors = model.factors.length;

    return (
        <Box
            sx={{
                borderRadius: 1.5,
                border: '1px solid',
                borderColor: isSelected ? 'primary.main' : 'divider',
                bgcolor: isSelected ? 'primary.50' : 'background.paper',
                overflow: 'hidden',
                transition: 'all 0.2s',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={onSelect}
            >
                {isSelected && (
                    <SelectedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                )}
                <Typography
                    sx={{
                        flex: 1,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? 'primary.main' : 'text.primary',
                    }}
                >
                    {model.name}
                </Typography>
                <Chip
                    label={`${checkedCount}/${totalFactors}`}
                    size="small"
                    variant={checkedCount === totalFactors && totalFactors > 0 ? "filled" : "outlined"}
                    color={checkedCount === totalFactors && totalFactors > 0 ? "success" : "default"}
                    sx={{ fontSize: '0.75rem' }}
                />
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                    }}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Box>
            <Collapse in={expanded}>
                <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                    <Stack spacing={0.5}>
                        {model.factors.map((factor, index) => (
                            <FormControlLabel
                                key={index}
                                onClick={(e) => e.stopPropagation()}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={model.checkedFactors?.includes(factor) || false}
                                        onChange={() => onToggleFactor(factor)}
                                        sx={{ py: 0.25 }}
                                    />
                                }
                                label={
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            textDecoration: model.checkedFactors?.includes(factor) ? 'line-through' : 'none',
                                            color: model.checkedFactors?.includes(factor) ? 'text.secondary' : 'text.primary',
                                        }}
                                    >
                                        {factor}
                                    </Typography>
                                }
                                sx={{ m: 0 }}
                            />
                        ))}
                        {model.factors.length === 0 && (
                            <Typography variant="body2" color="text.secondary">
                                No factors defined
                            </Typography>
                        )}
                    </Stack>
                </Box>
            </Collapse>
        </Box>
    );
}

interface ModelDialogProps {
    open: boolean;
    onClose: () => void;
    editModel?: TradingModel | null;
}

export function ModelDialog({ open, onClose, editModel }: ModelDialogProps) {
    const { addModel, updateModel } = useModelStore();
    const [name, setName] = useState('');
    const [factors, setFactors] = useState<string[]>([]);
    const [newFactor, setNewFactor] = useState('');

    React.useEffect(() => {
        if (editModel) {
            setName(editModel.name);
            setFactors([...editModel.factors]);
        } else {
            setName('');
            setFactors([]);
        }
        setNewFactor('');
    }, [editModel, open]);

    const handleAddFactor = () => {
        if (newFactor.trim()) {
            setFactors([...factors, newFactor.trim()]);
            setNewFactor('');
        }
    };

    const handleRemoveFactor = (index: number) => {
        setFactors(factors.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        if (!name.trim()) return;

        if (editModel) {
            updateModel(editModel.id, name.trim(), factors);
        } else {
            addModel(name.trim(), factors);
        }
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {editModel ? 'Edit Model' : 'Add New Model'}
            </DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Model Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                        autoFocus
                    />

                    {/* Factors List */}
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Factors ({factors.length})
                        </Typography>

                        {/* Existing Factors */}
                        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
                            {factors.map((factor, index) => (
                                <Stack
                                    key={index}
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{
                                        p: 1,
                                        bgcolor: 'grey.100',
                                        borderRadius: 1,
                                    }}
                                >
                                    <Typography sx={{ flex: 1 }}>{factor}</Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleRemoveFactor(index)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            ))}
                            {factors.length === 0 && (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    Chưa có factor nào
                                </Typography>
                            )}
                        </Stack>

                        {/* Add New Factor */}
                        <Stack direction="row" spacing={1}>
                            <TextField
                                value={newFactor}
                                onChange={(e) => setNewFactor(e.target.value)}
                                size="small"
                                fullWidth
                                placeholder="Nhập factor mới..."
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFactor();
                                    }
                                }}
                            />
                            <Button
                                variant="outlined"
                                onClick={handleAddFactor}
                                disabled={!newFactor.trim()}
                            >
                                <AddIcon />
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!name.trim()}
                >
                    {editModel ? 'Save' : 'Add'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

interface ModelListProps {
    onAddModel: () => void;
    onEditModel: (model: TradingModel) => void;
}

export function ModelList({ onAddModel, onEditModel }: ModelListProps) {
    const { models, selectedModelId, selectModel, deleteModel, toggleFactor } = useModelStore();

    const handleEdit = (model: TradingModel) => {
        onEditModel(model);
    };

    const handleAddNew = () => {
        onAddModel();
    };

    return (
        <>
            <Box
                sx={{
                    p: 2.5,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        Models
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {models.length} models
                    </Typography>
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                    {models.map((model) => (
                        <ModelItem
                            key={model.id}
                            model={model}
                            isSelected={model.id === selectedModelId}
                            onSelect={() => selectModel(model.id === selectedModelId ? null : model.id)}
                            onEdit={() => onEditModel(model)}
                            onDelete={() => deleteModel(model.id)}
                            onToggleFactor={(factor) => toggleFactor(model.id, factor)}
                        />
                    ))}
                </Stack>

                {models.length === 0 && (
                    <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="body2">
                            No models yet. Add your first model.
                        </Typography>
                    </Box>
                )}

                <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={handleAddNew}
                    sx={{ mt: 1 }}
                >
                    Add Model
                </Button>
            </Box>
        </>
    );
}

export default ModelList;
