import { openPath } from '@tauri-apps/plugin-opener';
import { resolveResource } from '@tauri-apps/api/path';

export const openBundledPpt = async (fileName) => {
    try {
        // The path provided here MUST match the relative path from your project root
        // as configured in tauri.conf.json > bundle > resources
        const relativePath = `D-OPRC-Level-1/${fileName}`;

        const absoluteFilePath = await resolveResource(relativePath);

        console.log(`[Tauri FS] Resolved Path: ${absoluteFilePath}`);

        await openPath(fileName);

    } catch (error) {
        console.error("[Tauri FS] Failed to open bundled PPT file:", error);
    }
};