'use client';

import React, { useState, useEffect } from 'react';
import { isIdbImageRef, extractIdbKey, createObjectUrlFromStore } from '@/lib/imageStore';

interface IdbImageProps {
    src: string;
    alt?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
    className?: string;
}

/**
 * IdbImage - A drop-in replacement for <img> that can render:
 * 1. Regular URLs (https://...) - renders normally
 * 2. IndexedDB references (idb://img-xxx) - loads blob from IndexedDB and creates Object URL
 * 
 * This is needed because idb:// URLs can't be used directly in <img src>.
 */
export function IdbImage({ src, alt, style, onClick, className }: IdbImageProps) {
    const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        if (isIdbImageRef(src)) {
            setLoading(true);
            const key = extractIdbKey(src);
            createObjectUrlFromStore(key).then((url) => {
                if (cancelled) {
                    if (url) URL.revokeObjectURL(url);
                    return;
                }
                objectUrl = url;
                setResolvedSrc(url);
                setLoading(false);
            }).catch(() => {
                if (!cancelled) {
                    setResolvedSrc(null);
                    setLoading(false);
                }
            });
        } else {
            setResolvedSrc(src);
        }

        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [src]);

    if (loading) {
        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    minHeight: 60,
                    minWidth: 80,
                }}
            >
                <span style={{ color: '#888', fontSize: '0.75rem' }}>⏳ Đang tải...</span>
            </div>
        );
    }

    if (!resolvedSrc) {
        return (
            <div
                style={{
                    ...style,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: 4,
                    minHeight: 60,
                    minWidth: 80,
                }}
            >
                <span style={{ color: '#888', fontSize: '0.75rem' }}>🔄 Đang đồng bộ...</span>
            </div>
        );
    }

    return (
        <img
            src={resolvedSrc}
            alt={alt || 'Image'}
            style={style}
            onClick={onClick}
            className={className}
        />
    );
}

export default IdbImage;
