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
}

function ModelItem({ model, isSelected, onSelect, onEdit, onDelete }: ModelItemProps) {
    const [expanded, setExpanded] = useState(false);

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
                    label={`${model.factors.length} factors`}
                    size="small"
                    variant="outlined"
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
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {model.factors.map((factor, index) => (
                            <Chip
                                key={index}
                                label={factor}
                                size="small"
                                sx={{
                                    fontSize: '0.75rem',
                                    bgcolor: 'grey.100',
                                }}
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

function ModelDialog({ open, onClose, editModel }: ModelDialogProps) {
    const { addModel, updateModel } = useModelStore();
    const [name, setName] = useState('');
    const [factorsText, setFactorsText] = useState('');

    React.useEffect(() => {
        if (editModel) {
            setName(editModel.name);
            setFactorsText(editModel.factors.join('\n'));
        } else {
            setName('');
            setFactorsText('');
        }
    }, [editModel, open]);

    const handleSave = () => {
        if (!name.trim()) return;

        const factors = factorsText
            .split('\n')
            .map((f) => f.trim())
            .filter((f) => f.length > 0);

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
                    <TextField
                        label="Factors (one per line)"
                        value={factorsText}
                        onChange={(e) => setFactorsText(e.target.value)}
                        multiline
                        rows={4}
                        fullWidth
                        placeholder="Factor 1&#10;Factor 2&#10;Factor 3"
                    />
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

export function ModelList() {
    const { models, selectedModelId, selectModel, deleteModel } = useModelStore();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingModel, setEditingModel] = useState<TradingModel | null>(null);

    const handleEdit = (model: TradingModel) => {
        setEditingModel(model);
        setDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingModel(null);
        setDialogOpen(true);
    };

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
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
                            onEdit={() => handleEdit(model)}
                            onDelete={() => deleteModel(model.id)}
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
            </Paper>

            <ModelDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                editModel={editingModel}
            />
        </>
    );
}

export default ModelList;
