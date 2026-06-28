import { useState } from 'react';

type ShareType = 'trade' | 'session';

export function useShareSession() {
    const [isSharing, setIsSharing] = useState(false);

    const shareData = async (type: ShareType, data: any) => {
        setIsSharing(true);
        try {
            // Bao bọc dữ liệu kèm theo loại (trade hoặc session)
            const payload = {
                type,
                data
            };

            const response = await fetch('/api/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionData: payload }),
            });

            const result = await response.json();

            if (result.success && result.shareId) {
                // Tạo link chia sẻ
                const shareUrl = `${window.location.origin}/share/${result.shareId}`;
                
                // Copy vào clipboard
                await navigator.clipboard.writeText(shareUrl);
                
                alert(`Đã copy link chia sẻ vào clipboard!\n${shareUrl}`);
                return shareUrl;
            } else {
                alert('Lỗi: ' + (result.error || 'Không thể chia sẻ'));
            }
        } catch (error) {
            console.error('Lỗi khi share:', error);
            alert('Có lỗi xảy ra khi tạo link chia sẻ.');
        } finally {
            setIsSharing(false);
        }
    };

    return { shareData, isSharing };
}
