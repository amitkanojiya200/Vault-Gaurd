// src/pages/AdminAuditLogs.jsx
import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useRoute, ROUTES } from '../router/Router';
import sessionClient from '@/lib/sessionClient';

export default function AdminAuditLogs() {
    const { navigate } = useRoute();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function fetchLogs() {
        setLoading(true);
        setError(null);
        try {
            const token = await sessionClient.getSessionToken(); // async secure getter
            if (!token) {
                setError('No session. Please login.');
                navigate(ROUTES.LOGIN);
                return;
            }
            // call the Tauri command
            const rows = await invoke('list_audit_logs', { session_token: token, limit: 200 });
            setLogs(rows || []);
        } catch (err) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-4">
            <h2 className="text-xl font-semibold mb-3">Audit Logs</h2>

            {loading && <div className="text-sm text-slate-500">Loading…</div>}
            {error && <div className="text-sm text-red-500 mb-2">{error}</div>}

            <div className="overflow-auto rounded border bg-white/90 dark:bg-slate-900 p-2">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-slate-500">
                            <th className="px-2 py-1">Time</th>
                            <th className="px-2 py-1">Actor</th>
                            <th className="px-2 py-1">Action</th>
                            <th className="px-2 py-1">Target</th>
                            <th className="px-2 py-1">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 && !loading && (
                            <tr><td colSpan={5} className="p-4 text-slate-500">No audit entries</td></tr>
                        )}
                        {logs.map((r, i) => {
                            // r shape: (id, actor_user_id, actor_username, action, target_user_id, details, created_at)
                            const [id, actor_id, actor_username, action, target_user_id, details, created_at] = r;
                            const timeStr = new Date(created_at * 1000).toLocaleString();
                            return (
                                <tr key={id || i} className="border-t hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <td className="px-2 py-2 align-top text-xs text-slate-600">{timeStr}</td>
                                    <td className="px-2 py-2 align-top text-xs">{actor_username || (actor_id ? `#${actor_id}` : 'system')}</td>
                                    <td className="px-2 py-2 align-top font-medium">{action}</td>
                                    <td className="px-2 py-2 align-top text-xs">{target_user_id ? `#${target_user_id}` : '-'}</td>
                                    <td className="px-2 py-2 align-top text-xs text-slate-600 break-all">{details || ''}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
