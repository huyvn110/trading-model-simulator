/**
 * Nén ảnh trước khi upload - giảm 80-90% dung lượng
 */
async function compressImage(file: File, maxWidth = 1600, quality = 0.75): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Compression failed'));
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Upload ảnh lên Google Drive (nén trước khi gửi)
 * @param file File ảnh cần upload
 * @param sessionId ID phiên giao dịch (để tạo subfolder trên Drive)
 * @param sessionName Tên phiên (dùng đặt tên folder)
 */
export async function uploadImageToDrive(file: File, sessionId?: string, sessionName?: string): Promise<string> {
    const compressedBlob = await compressImage(file);
    const fileName = file.name.replace(/\.[^.]+$/, '.webp');

    const formData = new FormData();
    formData.append('file', compressedBlob, fileName);
    if (sessionId) formData.append('sessionId', sessionId);
    if (sessionName) formData.append('sessionName', sessionName);

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
    }

    const data = await response.json();
    if (!data.url) {
        throw new Error('No URL returned from server');
    }

    return data.url;
}

/**
 * Xóa 1 ảnh trên Google Drive
 * @param imageUrl URL của ảnh (format: https://drive.google.com/thumbnail?id=xxx&sz=w1600)
 */
export async function deleteImageFromDrive(imageUrl: string): Promise<void> {
    // Chỉ xóa ảnh Drive, bỏ qua blob URL
    if (!imageUrl.includes('drive.google.com')) return;

    try {
        await fetch(`/api/upload?url=${encodeURIComponent(imageUrl)}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Failed to delete image from Drive:', error);
    }
}

/**
 * Xóa toàn bộ folder phiên trên Google Drive (khi xóa phiên)
 * @param sessionId ID phiên giao dịch
 */
export async function deleteSessionImages(sessionId: string): Promise<void> {
    try {
        await fetch(`/api/upload?sessionId=${encodeURIComponent(sessionId)}`, {
            method: 'DELETE',
        });
    } catch (error) {
        console.error('Failed to delete session folder from Drive:', error);
    }
}
