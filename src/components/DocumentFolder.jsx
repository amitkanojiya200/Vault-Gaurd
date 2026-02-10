// src/components/DocumentFolder.jsx
import React, { useEffect, useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import * as documentClient from '@/lib/documentClient';
import sessionClient from '@/lib/sessionClient';
import * as userClient from '@/lib/userClient';

export default function DocumentFolder({
    folderKey,
    title = 'Documents',
}) {
    const [files, setFiles] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);

    async function load() {
        setLoading(true);
        try {
            const list = await documentClient.listDocuments(folderKey);
            setFiles(list);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                const token = await sessionClient.getSessionToken();
                if (!token) return;

                const user = await userClient.validateSession(token);
                if (mounted && user?.role === 'admin') {
                    setIsAdmin(true);
                }
            } catch {
                // ignore
            }
        }

        init();
        load();

        return () => {
            mounted = false;
        };
    }, [folderKey]);

    async function handleUpload() {
        const file = await open({
            multiple: false,
            filters: [
                { name: 'Documents', extensions: ['pdf', 'ppt', 'pptx', 'doc', 'docx'] },
            ],
        });

        if (!file) return;

        await documentClient.uploadDocument(folderKey, file);
        await load();
    }

    async function handleOpen(path) {
        await documentClient.openDocument(path);
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/85">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                </h3>

                {isAdmin && (
                    <button
                        onClick={handleUpload}
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                    >
                        <Upload className="h-4 w-4" />
                        Upload
                    </button>
                )}
            </div>

            {loading && (
                <p className="text-xs text-slate-500">Loading…</p>
            )}

            {!loading && files.length === 0 && (
                <p className="text-xs text-slate-500">No documents found.</p>
            )}

            <div className="flex flex-col gap-1.5">
                {files.map((path) => {
                    const name = path.split(/[\\/]/).pop();
                    return (
                        <button
                            key={path}
                            onClick={() => handleOpen(path)}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs hover:border-sky-400 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800"
                        >
                            <FileText className="h-4 w-4 text-slate-400" />
                            <span className="truncate text-slate-800 dark:text-slate-100">
                                {name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
