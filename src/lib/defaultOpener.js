import { openPath } from '@tauri-apps/plugin-opener';
import { normalize } from '@tauri-apps/api/path';

export const openBundledPpt = async (absoluteFilePath) => {
    // const normalizedPath = await normalize(absoluteFilePath);
    // console.log(`[Tauri FS] Normalized Path: ${normalizedPath}`);
    
    try {
        console.log(`[Tauri FS] Normalized Path: ${absoluteFilePath}`);
        await openPath(`${absoluteFilePath}`);
        // await openPath('D:\\prabal\\D-OPRC-Level1\\L.1.1 Introduction and Orientation CGPRT(W).pptx');
    } catch (error) {
        const msg = String(error);

        // Windows Office shell quirk – treat as success
        if (msg.includes('1223')) {
            // Optional: comment this out in production
            console.debug('[Tauri FS] Shell returned 1223 (Office single-instance behavior)');
            return;
        }

        console.error('[Tauri FS] Failed to open external file:', error);
        throw error;
    }
};
