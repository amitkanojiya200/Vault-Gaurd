// src/lib/documentClient.js
import { invoke } from '@tauri-apps/api/core';
import sessionClient from './sessionClient';
import * as fsClient from './fsClient';

/**
 * List documents in a folder
 * @param {string} folderKey
 * @returns {Promise<string[]>} absolute file paths
 */
export async function listDocuments(folderKey) {
    if (!folderKey) throw new Error('folderKey required');

    const token = await sessionClient.getSessionToken();

    return invoke('list_documents_by_session', {
        sessionToken: token,
        folderKey,
    });
}

/**
 * Upload document to a folder (ADMIN only)
 * @param {string} folderKey
 * @param {string} sourcePath absolute path from dialog
 */
export async function uploadDocument(folderKey, sourcePath) {
    if (!folderKey) throw new Error('folderKey required');
    if (!sourcePath) throw new Error('sourcePath required');

    const token = await sessionClient.getSessionToken();

    return invoke('upload_document_by_session', {
        sessionToken: token,
        folderKey,
        sourcePath,
    });
}

/**
 * Open document using EXISTING audited opener
 * @param {string} absolutePath
 */
export async function openDocument(absolutePath) {
    if (!absolutePath) throw new Error('path required');

    const token = await sessionClient.getSessionToken();
    return fsClient.openFileBySession(token, absolutePath);
}
