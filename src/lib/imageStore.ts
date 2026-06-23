/**
 * IndexedDB helper for storing image blobs locally
 * Uses idb-keyval for simple key-value storage of image Blobs
 * 
 * Key format: "img-{blockId}" for trade images
 */
import { get, set, del, keys, createStore } from 'idb-keyval';

// Create a dedicated store for images (separate from default idb-keyval store)
const imageStore = createStore('trade-images-db', 'image-blobs');

/**
 * Save an image blob to IndexedDB
 * @param key Unique key for the image (e.g., "img-{uuid}")
 * @param blob The image Blob/File to store
 */
export async function saveImageBlob(key: string, blob: Blob): Promise<void> {
    await set(key, blob, imageStore);
}

/**
 * Get an image blob from IndexedDB
 * @param key The image key
 * @returns The Blob or undefined if not found
 */
export async function getImageBlob(key: string): Promise<Blob | undefined> {
    return await get<Blob>(key, imageStore);
}

/**
 * Delete an image blob from IndexedDB
 * @param key The image key
 */
export async function deleteImageBlob(key: string): Promise<void> {
    await del(key, imageStore);
}

/**
 * Get all image keys in the store
 */
export async function getAllImageKeys(): Promise<string[]> {
    const allKeys = await keys(imageStore);
    return allKeys as string[];
}

/**
 * Create a temporary Object URL from a stored blob
 * Remember to call URL.revokeObjectURL when done!
 * @param key The image key
 * @returns Object URL string or null if blob not found
 */
export async function createObjectUrlFromStore(key: string): Promise<string | null> {
    const blob = await getImageBlob(key);
    if (!blob) return null;
    return URL.createObjectURL(blob);
}

/**
 * Check if a value is an IndexedDB image reference
 * IDB references start with "idb://"
 */
export function isIdbImageRef(value: string): boolean {
    return value.startsWith('idb://');
}

/**
 * Extract the IDB key from an idb:// reference
 * e.g., "idb://img-abc123" -> "img-abc123"
 */
export function extractIdbKey(idbRef: string): string {
    return idbRef.replace('idb://', '');
}

/**
 * Create an idb:// reference from a key
 * e.g., "img-abc123" -> "idb://img-abc123"
 */
export function createIdbRef(key: string): string {
    return `idb://${key}`;
}
