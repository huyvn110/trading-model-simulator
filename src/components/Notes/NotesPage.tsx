'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    TextField,
    InputAdornment,
    Tooltip,
} from '@mui/material';
import {
    Description as PageIcon,
    Add as AddIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { useNoteStore, NotePage } from '@/store/noteStore';
import { NotionEditor } from '@/components/shared/NotionEditor';
import { ContentBlock } from '@/types';

// Page List View (sidebar-like)
function PageListView({ onSelectPage }: { onSelectPage: (page: NotePage) => void }) {
    const { pages, createPage, deletePage } = useNoteStore();
    const [search, setSearch] = useState('');

    const filteredPages = pages.filter(
        (page) => page.title.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreatePage = () => {
        const id = createPage();
        const newPage = pages.find((p) => p.id === id);
        if (newPage) {
            onSelectPage(newPage);
        }
    };

    const handleDeletePage = (e: React.MouseEvent, pageId: string) => {
        e.stopPropagation();
        deletePage(pageId);
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#191919',
                color: 'white',
            }}
        >
            {/* Header */}
            <Box sx={{ p: 3, pb: 2 }}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        color: 'white',
                        mb: 2,
                    }}
                >
                    Trade
                </Typography>

                {/* Search */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search pages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'grey.500' }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            bgcolor: '#2f2f2f',
                            color: 'white',
                            '& fieldset': { borderColor: '#3f3f3f' },
                            '&:hover fieldset': { borderColor: '#5f5f5f' },
                        },
                        '& .MuiInputBase-input::placeholder': {
                            color: '#9f9f9f',
                        },
                    }}
                />
            </Box>

            {/* Pages List */}
            <List sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
                {filteredPages.map((page) => (
                    <ListItem
                        key={page.id}
                        disablePadding
                        secondaryAction={
                            <Tooltip title="Delete">
                                <IconButton
                                    size="small"
                                    onClick={(e) => handleDeletePage(e, page.id)}
                                    sx={{
                                        color: 'grey.500',
                                        opacity: 0,
                                        transition: 'opacity 0.2s',
                                        '.MuiListItem-root:hover &': { opacity: 1 },
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        }
                        sx={{
                            '&:hover .MuiIconButton-root': { opacity: 1 },
                        }}
                    >
                        <ListItemButton
                            onClick={() => onSelectPage(page)}
                            sx={{
                                borderRadius: 1,
                                py: 0.75,
                                '&:hover': { bgcolor: '#2f2f2f' },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32 }}>
                                <PageIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary={page.title || 'Untitled'}
                                primaryTypographyProps={{
                                    noWrap: true,
                                    sx: { color: '#e0e0e0', fontSize: '0.9rem' },
                                }}
                            />
                        </ListItemButton>
                    </ListItem>
                ))}

                {/* New Page Button */}
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={handleCreatePage}
                        sx={{
                            borderRadius: 1,
                            py: 0.75,
                            '&:hover': { bgcolor: '#2f2f2f' },
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                            <AddIcon sx={{ color: '#9f9f9f', fontSize: 18 }} />
                        </ListItemIcon>
                        <ListItemText
                            primary="New page"
                            primaryTypographyProps={{
                                sx: { color: '#9f9f9f', fontSize: '0.9rem' },
                            }}
                        />
                    </ListItemButton>
                </ListItem>
            </List>
        </Box>
    );
}

// Page Editor View
function PageEditorView({
    page,
    onBack,
}: {
    page: NotePage;
    onBack: () => void;
}) {
    const { updatePage } = useNoteStore();
    const [title, setTitle] = useState(page.title);
    const [content, setContent] = useState<ContentBlock[]>(page.content);
    const titleRef = useRef<HTMLInputElement>(null);

    // Sync with page changes
    useEffect(() => {
        setTitle(page.title);
        setContent(page.content);
    }, [page.id]);

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        updatePage(page.id, { title: newTitle });
    };

    const handleContentChange = (newContent: ContentBlock[]) => {
        setContent(newContent);
        updatePage(page.id, { content: newContent });
    };

    // Handle Enter key in title to focus content
    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // Focus first text block or create one
        }
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#191919',
                color: 'white',
            }}
        >
            {/* Back Button */}
            <Box sx={{ p: 2, borderBottom: '1px solid #2f2f2f' }}>
                <IconButton
                    onClick={onBack}
                    sx={{ color: 'grey.400', '&:hover': { bgcolor: '#2f2f2f' } }}
                >
                    <BackIcon />
                </IconButton>
            </Box>

            {/* Title - Notion style */}
            <Box sx={{ px: 4, pt: 6, pb: 2 }}>
                <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    placeholder="Untitled"
                    style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: '2.5rem',
                        fontWeight: 700,
                        color: title ? '#ffffff' : '#5f5f5f',
                        fontFamily: 'inherit',
                        padding: 0,
                    }}
                />
            </Box>

            {/* Content Editor */}
            <Box sx={{ flex: 1, px: 0, pb: 4, overflowY: 'auto' }}>
                <NotionEditor
                    blocks={content}
                    onChange={handleContentChange}
                    placeholder="Type '/' for commands, or start typing..."
                />
            </Box>
        </Box>
    );
}

// Main Notes Page Component
export function NotesPage() {
    const [selectedPage, setSelectedPage] = useState<NotePage | null>(null);

    const handleSelectPage = (page: NotePage) => {
        setSelectedPage(page);
    };

    const handleBack = () => {
        setSelectedPage(null);
    };

    return (
        <Box
            sx={{
                height: 'calc(100vh - 120px)',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid #2f2f2f',
            }}
        >
            {selectedPage ? (
                <PageEditorView page={selectedPage} onBack={handleBack} />
            ) : (
                <PageListView onSelectPage={handleSelectPage} />
            )}
        </Box>
    );
}

export default NotesPage;
