'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Image as ImageIcon,
    Add as AddIcon,
    TextFields as TextIcon,
    DragIndicator as DragIcon,
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
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentBlock } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface NotionEditorProps {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    placeholder?: string;
    readOnly?: boolean;
    compact?: boolean;
}

interface SortableBlockProps {
    block: ContentBlock;
    onUpdate: (value: string) => void;
    onDelete: () => void;
    onImageClick: (src: string) => void;
    onAddBlock: (type: 'text' | 'image', afterId: string) => void;
    onEnterNewBlock: (afterId: string, textBefore: string, textAfter: string) => void;
    readOnly?: boolean;
    compact?: boolean;
    isLast?: boolean;
}

function SortableBlock({
    block,
    onUpdate,
    onDelete,
    onImageClick,
    onAddBlock,
    onEnterNewBlock,
    readOnly,
    compact,
    isLast
}: SortableBlockProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleAddText = () => {
        onAddBlock('text', block.id);
        handleMenuClose();
    };

    const handleAddImage = () => {
        fileInputRef.current?.click();
        handleMenuClose();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            onAddBlock('image', block.id);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current && block.type === 'text') {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [block.value, block.type]);

    return (
        <Box
            ref={setNodeRef}
            style={style}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 0,
                py: 0.5,
                position: 'relative',
                minHeight: 32,
            }}
        >
            {/* Left controls - Add & Drag - using flex layout */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    width: 56,
                    flexShrink: 0,
                    visibility: (!readOnly && isHovered) ? 'visible' : 'hidden',
                    pt: block.type === 'text' ? 0.5 : 0,
                }}
            >
                {!readOnly && (
                    <>
                        {/* Add button */}
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{
                                color: '#5f5f5f',
                                p: 0.5,
                                '&:hover': {
                                    color: '#9f9f9f',
                                    bgcolor: 'transparent',
                                },
                            }}
                        >
                            <AddIcon sx={{ fontSize: 18 }} />
                        </IconButton>

                        {/* Drag handle */}
                        <Box
                            {...attributes}
                            {...listeners}
                            sx={{
                                cursor: 'grab',
                                color: '#5f5f5f',
                                display: 'flex',
                                alignItems: 'center',
                                p: 0.5,
                                '&:hover': { color: '#9f9f9f' },
                                '&:active': { cursor: 'grabbing' },
                            }}
                        >
                            <DragIcon sx={{ fontSize: 18 }} />
                        </Box>
                    </>
                )}
            </Box>

            {/* Block content */}
            <Box sx={{ flex: 1 }}>
                {block.type === 'text' ? (
                    <textarea
                        ref={textareaRef}
                        value={block.value}
                        onChange={(e) => onUpdate(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && !readOnly) {
                                e.preventDefault();
                                const textarea = e.currentTarget;
                                const cursorPos = textarea.selectionStart;
                                const textBefore = block.value.substring(0, cursorPos);
                                const textAfter = block.value.substring(cursorPos);
                                onEnterNewBlock(block.id, textBefore, textAfter);
                            }
                        }}
                        placeholder="Type something..."
                        disabled={readOnly}
                        rows={1}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            resize: 'none',
                            color: '#e0e0e0',
                            fontSize: compact ? '0.9rem' : '1rem',
                            lineHeight: 1.6,
                            fontFamily: 'inherit',
                            padding: '4px 0',
                            overflow: 'hidden',
                        }}
                    />
                ) : (
                    <Box
                        data-block-type="image"
                        sx={{
                            position: 'relative',
                            borderRadius: 1,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            maxWidth: compact ? 200 : 400,
                            '&:hover': {
                                opacity: 0.9,
                            },
                        }}
                        onClick={() => onImageClick(block.value)}
                    >
                        <img
                            src={block.value}
                            alt="Content"
                            style={{
                                width: '100%',
                                height: 'auto',
                                maxHeight: compact ? 150 : 300,
                                objectFit: 'contain',
                                display: 'block',
                                borderRadius: 4,
                            }}
                        />
                    </Box>
                )}
            </Box>

            {/* Delete button - using flex layout */}
            <Box
                sx={{
                    width: 32,
                    flexShrink: 0,
                    visibility: (!readOnly && isHovered) ? 'visible' : 'hidden',
                    pt: block.type === 'text' ? 0.5 : 0,
                }}
            >
                {!readOnly && (
                    <IconButton
                        size="small"
                        onClick={onDelete}
                        sx={{
                            color: '#5f5f5f',
                            p: 0.5,
                            '&:hover': {
                                color: '#ef5350',
                                bgcolor: 'transparent',
                            },
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}
            </Box>

            {/* Add block menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        bgcolor: '#252525',
                        border: '1px solid #3f3f3f',
                        minWidth: 180,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    },
                }}
            >
                <MenuItem
                    onClick={handleAddText}
                    sx={{
                        color: '#e0e0e0',
                        '&:hover': { bgcolor: '#2f2f2f' },
                    }}
                >
                    <ListItemIcon>
                        <TextIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Text"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={handleAddImage}
                    sx={{
                        color: '#e0e0e0',
                        '&:hover': { bgcolor: '#2f2f2f' },
                    }}
                >
                    <ListItemIcon>
                        <ImageIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Image"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                </MenuItem>
            </Menu>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleImageUpload}
            />
        </Box>
    );
}

// Empty state block with + button
function EmptyStateBlock({
    onAddBlock,
    placeholder
}: {
    onAddBlock: (type: 'text' | 'image') => void;
    placeholder?: string;
}) {
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
        setMenuAnchor(e.currentTarget);
    };

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleAddText = () => {
        onAddBlock('text');
        handleMenuClose();
    };

    const handleAddImage = () => {
        fileInputRef.current?.click();
        handleMenuClose();
    };

    return (
        <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                py: 1,
                position: 'relative',
                minHeight: 32,
            }}
        >
            {/* Left controls */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    width: 56,
                    flexShrink: 0,
                    visibility: isHovered ? 'visible' : 'hidden',
                }}
            >
                <IconButton
                    size="small"
                    onClick={handleMenuOpen}
                    sx={{
                        color: '#5f5f5f',
                        p: 0.5,
                        '&:hover': {
                            color: '#9f9f9f',
                            bgcolor: 'transparent',
                        },
                    }}
                >
                    <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <Box sx={{ width: 24 }} />
            </Box>

            {/* Placeholder text */}
            <Typography
                onClick={() => onAddBlock('text')}
                sx={{
                    color: '#5f5f5f',
                    fontSize: '1rem',
                    cursor: 'text',
                    flex: 1,
                    py: 0.5,
                }}
            >
                {placeholder || "Type '/' for commands, or start typing..."}
            </Typography>

            {/* Add block menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                PaperProps={{
                    sx: {
                        bgcolor: '#252525',
                        border: '1px solid #3f3f3f',
                        minWidth: 180,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                    },
                }}
            >
                <MenuItem
                    onClick={handleAddText}
                    sx={{
                        color: '#e0e0e0',
                        '&:hover': { bgcolor: '#2f2f2f' },
                    }}
                >
                    <ListItemIcon>
                        <TextIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Text"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={handleAddImage}
                    sx={{
                        color: '#e0e0e0',
                        '&:hover': { bgcolor: '#2f2f2f' },
                    }}
                >
                    <ListItemIcon>
                        <ImageIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                        primary="Image"
                        primaryTypographyProps={{ fontSize: '0.9rem' }}
                    />
                </MenuItem>
            </Menu>

            {/* Hidden file input */}
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        onAddBlock('image');
                    }
                    e.target.value = '';
                }}
            />
        </Box>
    );
}

export function NotionEditor({ blocks, onChange, placeholder, readOnly, compact }: NotionEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const [pendingImageAfterId, setPendingImageAfterId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            onChange(arrayMove(blocks, oldIndex, newIndex));
        }
    };

    const addBlock = (type: 'text' | 'image', afterId?: string) => {
        if (type === 'image') {
            setPendingImageAfterId(afterId || null);
            fileInputRef.current?.click();
            return;
        }

        const newBlock: ContentBlock = {
            id: uuidv4(),
            type: 'text',
            value: '',
        };

        if (afterId) {
            const index = blocks.findIndex((b) => b.id === afterId);
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, newBlock);
            onChange(newBlocks);
        } else {
            onChange([...blocks, newBlock]);
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const newBlock: ContentBlock = {
                id: uuidv4(),
                type: 'image',
                value: base64,
            };

            if (pendingImageAfterId) {
                const index = blocks.findIndex((b) => b.id === pendingImageAfterId);
                const newBlocks = [...blocks];
                newBlocks.splice(index + 1, 0, newBlock);
                onChange(newBlocks);
            } else {
                onChange([...blocks, newBlock]);
            }
            setPendingImageAfterId(null);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const updateBlock = (id: string, value: string) => {
        onChange(blocks.map((b) => (b.id === id ? { ...b, value } : b)));
    };

    const deleteBlock = (id: string) => {
        onChange(blocks.filter((b) => b.id !== id));
    };

    // Handle Enter key - create new block and split text
    const handleEnterNewBlock = (afterId: string, textBefore: string, textAfter: string) => {
        const index = blocks.findIndex((b) => b.id === afterId);
        if (index === -1) return;

        const newBlock: ContentBlock = {
            id: uuidv4(),
            type: 'text',
            value: textAfter,
        };

        const newBlocks = [...blocks];
        newBlocks[index] = { ...newBlocks[index], value: textBefore };
        newBlocks.splice(index + 1, 0, newBlock);
        onChange(newBlocks);
    };

    // Paste handler
    const handlePaste = useCallback((e: ClipboardEvent) => {
        if (readOnly) return;

        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.startsWith('image/')) {
                e.preventDefault();
                const file = item.getAsFile();
                if (!file) continue;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64 = event.target?.result as string;
                    const newBlock: ContentBlock = {
                        id: uuidv4(),
                        type: 'image',
                        value: base64,
                    };
                    onChange([...blocks, newBlock]);
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    }, [readOnly, blocks, onChange]);

    useEffect(() => {
        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    return (
        <>
            <Box sx={{ pl: 0, pr: 4 }}>
                {blocks.length === 0 && !readOnly ? (
                    <EmptyStateBlock
                        onAddBlock={(type) => addBlock(type)}
                        placeholder={placeholder}
                    />
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={blocks.map((b) => b.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {blocks.map((block, index) => (
                                <SortableBlock
                                    key={block.id}
                                    block={block}
                                    onUpdate={(value) => updateBlock(block.id, value)}
                                    onDelete={() => deleteBlock(block.id)}
                                    onImageClick={setZoomImage}
                                    onAddBlock={(type, afterId) => addBlock(type, afterId)}
                                    onEnterNewBlock={handleEnterNewBlock}
                                    readOnly={readOnly}
                                    compact={compact}
                                    isLast={index === blocks.length - 1}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}

                {/* Hidden file input for image upload */}
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                />
            </Box>

            {/* Zoom Dialog */}
            <Dialog
                open={!!zoomImage}
                onClose={() => setZoomImage(null)}
                maxWidth="lg"
                PaperProps={{
                    sx: {
                        bgcolor: 'transparent',
                        boxShadow: 'none',
                    },
                }}
            >
                {zoomImage && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                        }}
                        onClick={() => setZoomImage(null)}
                    >
                        <img
                            src={zoomImage}
                            alt="Zoom"
                            style={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 8,
                            }}
                        />
                    </Box>
                )}
            </Dialog>
        </>
    );
}

// Utility function to convert legacy notes/images to content blocks
export function migrateToContentBlocks(
    notes?: string,
    images?: string[],
    existingContent?: ContentBlock[]
): ContentBlock[] {
    if (existingContent && existingContent.length > 0) {
        return existingContent;
    }

    const blocks: ContentBlock[] = [];

    if (notes && notes.trim()) {
        blocks.push({
            id: uuidv4(),
            type: 'text',
            value: notes,
        });
    }

    if (images && images.length > 0) {
        images.forEach((img) => {
            blocks.push({
                id: uuidv4(),
                type: 'image',
                value: img,
            });
        });
    }

    return blocks;
}

// Convert content blocks back to legacy format for backward compat
export function extractFromContentBlocks(blocks: ContentBlock[]): {
    notes: string;
    images: string[];
} {
    const notes = blocks
        .filter((b) => b.type === 'text')
        .map((b) => b.value)
        .join('\n\n');

    const images = blocks
        .filter((b) => b.type === 'image')
        .map((b) => b.value);

    return { notes, images };
}

export default NotionEditor;
