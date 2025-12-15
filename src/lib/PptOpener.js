import { openPath } from '@tauri-apps/plugin-opener';
import { path } from '@tauri-apps/api/path';

/**
 * Opens a file located in the application's public/resource directory.
 * @param {string} relativePath - The path relative to the public/resource directory.
 * E.g., "presentations/intro.pptx"
 */
const openBundledPpt = async (relativePath) => {
  try {
    // 1. Get the path to the application's resources directory.
    // This is the location where the bundled files are placed after building.
    const resourceDir = await path.resourceDir();
    
    // 2. Join the resource directory with the relative path to your file.
    // This creates the final, absolute path on the user's file system.
    const absoluteFilePath = await path.join(resourceDir, relativePath);

    console.log(`Resolved Path: ${absoluteFilePath}`);

    // 3. Use the Opener plugin to launch the system's default viewer.
    await openPath(absoluteFilePath);
    
    alert(`Opening file: ${relativePath}`);

  } catch (error) {
    console.error("Failed to open bundled PPT file:", error);
    alert(`Error opening file. Ensure the file exists in the correct bundle location: ${error.message}`);
  }
};

// --- Example Usage ---
// If your file is at: [Your Project Root]/public/Tauri_Overview.pptx
openBundledPpt("Tauri_Overview.pptx");