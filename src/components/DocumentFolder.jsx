// src/components/DocumentFolder.jsx
// src/components/DocumentFolder.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Upload, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import * as documentClient from '@/lib/documentClient';
import sessionClient from '@/lib/sessionClient';
import * as userClient from '@/lib/userClient';

const PAGE_SIZE = 10;

export default function DocumentFolder({
    folderKey,
    title = 'Documents',
}) {
    const [files, setFiles] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    async function load() {
        setLoading(true);
        try {
            const list = await documentClient.listDocuments(folderKey);
            setFiles(list);
            setPage(1); // reset page on reload
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

    // 🔹 pagination math (pure UI)
    const totalPages = Math.max(1, Math.ceil(files.length / PAGE_SIZE));

    const pageFiles = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return files.slice(start, start + PAGE_SIZE);
    }, [files, page]);

    return (
        <div className="rounded-2xl mb-5 border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                </h3>

                {isAdmin && (
                    <button
                        onClick={handleUpload}
                        className="flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    >
                        <Upload className="h-4 w-4" />
                        Upload
                    </button>
                )}
            </div>

            {/* States */}
            {loading && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Loading…
                </p>
            )}

            {!loading && files.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    No documents found.
                </p>
            )}

            {/* File list */}
            <div className="flex flex-col gap-1.5">
                {pageFiles.map((path) => {
                    const name = path.split(/[\\/]/).pop();
                    return (
                        <button
                            key={path}
                            onClick={() => handleOpen(path)}
                            className="
                                group flex items-center gap-2 rounded-xl border
                                border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs
                                hover:border-sky-400 hover:bg-sky-50
                                dark:border-slate-700 dark:bg-slate-800
                                dark:hover:border-sky-500 dark:hover:bg-slate-700
                                focus:outline-none focus:ring-2 focus:ring-sky-400
                            "
                        >
                            <FileText className="h-4 w-4 text-slate-400 group-hover:text-sky-500" />
                            <span className="truncate text-slate-800 dark:text-slate-100">
                                {name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Pagination */}
            {files.length > PAGE_SIZE && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </p>

                    <div className="flex gap-1">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="
                                rounded-lg border px-2 py-1
                                disabled:opacity-40 disabled:cursor-not-allowed
                                border-slate-300 bg-white hover:bg-slate-100
                                dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700
                            "
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className="
                                rounded-lg border px-2 py-1
                                disabled:opacity-40 disabled:cursor-not-allowed
                                border-slate-300 bg-white hover:bg-slate-100
                                dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700
                            "
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
