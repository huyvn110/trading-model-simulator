'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Dialog,
    Tooltip,
} from '@mui/material';
import {
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { ContentBlock } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface SimpleNoteEditorProps {
    blocks: ContentBlock[];
    onChange: (blocks: ContentBlock[]) => void;
    placeholder?: string;
    readOnly?: boolean;
}

/**
 * Simple inline editor - giống văn bản bình thường
 * - Gõ text tự nhiên
 * - Paste ảnh xen kẽ (Ctrl+V)
 * - Không cần nút Text/Ảnh riêng
 */
export function SimpleNoteEditor({ blocks, onChange, placeholder, readOnly }: SimpleNoteEditorProps) {
    const [zoomImage, setZoomImage] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Merge consecutive text blocks into single text for display
    const getTextContent = () => {
        return blocks
            .filter(b => b.type === 'text')
            .map(b => b.value)
            .join('\n');
    };

    // Get image blocks
    const imageBlocks = blocks.filter(b => b.type === 'image');

    // Handle text change
    const handleTextChange = (newText: string) => {
        // Keep images, update text
        const textBlock: ContentBlock = {
            id: blocks.find(b => b.type === 'text')?.id || uuidv4(),
            type: 'text',
            value: newText,
        };

        const newBlocks = newText.trim()
            ? [textBlock, ...imageBlocks]
            : [...imageBlocks];

        onChange(newBlocks);
    };

    // Handle paste image
    const handlePaste = useCallback((e: React.ClipboardEvent) => {
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
                    const imageBlock: ContentBlock = {
                        id: uuidv4(),
                        type: 'image',
                        value: base64,
                    };
                    onChange([...blocks, imageBlock]);
                };
                reader.readAsDataURL(file);
                break;
            }
        }
    }, [readOnly, blocks, onChange]);

    // Delete image
    const handleDeleteImage = (imageId: string) => {
        onChange(blocks.filter(b => b.id !== imageId));
    };

    return (
        <>
            <Box>
                {/* Text Area */}
                <TextField
                    inputRef={textareaRef}
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={6}
                    value={getTextContent()}
                    onChange={(e) => handleTextChange(e.target.value)}
                    onPaste={handlePaste}
                    placeholder={placeholder || 'Ghi chú... (Ctrl+V để paste ảnh)'}
                    disabled={readOnly}
                    size="small"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'background.paper',
                        },
                    }}
                />

                {/* Images - displayed below text */}
                {imageBlocks.length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {imageBlocks.map((img) => (
                            <Box
                                key={img.id}
                                sx={{
                                    position: 'relative',
                                    borderRadius: 1,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover .delete-btn': { opacity: 1 },
                                }}
                            >
                                <img
                                    src={img.value}
                                    alt="Note"
                                    style={{
                                        maxWidth: 150,
                                        maxHeight: 100,
                                        objectFit: 'cover',
                                        cursor: 'pointer',
                                        display: 'block',
                                    }}
                                    onClick={() => setZoomImage(img.value)}
                                />
                                {!readOnly && (
                                    <Tooltip title="Xóa">
                                        <IconButton
                                            className="delete-btn"
                                            size="small"
                                            onClick={() => handleDeleteImage(img.id)}
                                            sx={{
                                                position: 'absolute',
                                                top: 2,
                                                right: 2,
                                                bgcolor: 'rgba(0,0,0,0.5)',
                                                color: 'white',
                                                opacity: 0,
                                                transition: 'opacity 0.2s',
                                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Box>

            {/* Zoom Dialog */}
            <Dialog
                open={!!zoomImage}
                onClose={() => setZoomImage(null)}
                maxWidth="lg"
            >
                {zoomImage && (
                    <Box
                        sx={{
                            p: 1,
                            bgcolor: 'black',
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
                            }}
                        />
                    </Box>
                )}
            </Dialog>
        </>
    );
}

export default SimpleNoteEditor;
