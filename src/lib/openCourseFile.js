import { openPath } from '@tauri-apps/plugin-opener';
import { resolveResource, appDataDir, join } from '@tauri-apps/api/path';
import { exists, copyFile } from '@tauri-apps/plugin-fs';

export async function openOfficeFile(relativePath) {
  try {
    // MUST be relative to public/
    const resourcePath = await resolveResource(relativePath);

    if (!resourcePath) {
      throw new Error(`resolveResource failed for: ${relativePath}`);
    }

    const appDir = await appDataDir();
    const targetDir = await join(appDir, 'documents');
    const fileName = relativePath.split('/').pop();
    const targetPath = await join(targetDir, fileName);

    if (!(await exists(targetPath))) {
      await copyFile(resourcePath, targetPath);
    }

    await openPath(targetPath);
  } catch (err) {
    console.error('[openOfficeFile] failed:', err);
  }
}
