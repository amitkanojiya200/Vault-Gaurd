import { openPath } from '@tauri-apps/plugin-opener';
import { normalize } from '@tauri-apps/api/path'; // Import normalize

export const openBundledPpt = async (absoluteFilePath) => {
    try {
        // Use Tauri's utility to ensure the path is correctly formatted for the OS
        const normalizedPath = await normalize(absoluteFilePath);
        console.log(`[Tauri FS] Normalized Path: ${normalizedPath}`);

        await openPath(normalizedPath);

    } catch (error) {
        console.error("[Tauri FS] Failed to open external file:", error);
    }
};