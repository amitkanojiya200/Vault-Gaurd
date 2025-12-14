// src/components/AdminUsersPanel.jsx
import React, { useEffect, useState } from 'react';
import * as userClient from '@/lib/userClient';
import sessionClient from '@/lib/sessionClient';
import UserEditModal from '@/components/UserEditModal';

export default function AdminUsersPanel({ sessionToken: tokenProp }) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [sessionToken, setSessionToken] = useState(tokenProp || null);

    useEffect(() => {
        if (!sessionToken) {
            (async () => {
                const t = await sessionClient.getSessionToken();
                setSessionToken(t);
            })();
        }
    }, []);

    useEffect(() => {
        if (!sessionToken) return;
        loadUsers();
    }, [sessionToken]);

    async function loadUsers() {
        setLoading(true);
        setError('');
        try {
            const list = await userClient.adminListUsers(sessionToken);
            setUsers(list || []);
        } catch (err) {
            setError(err?.message || String(err));
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    function openCreate() {
        setEditingUser(null);
        setModalOpen(true);
    }

    function openEdit(u) {
        setEditingUser(u);
        setModalOpen(true);
    }

    async function handleDelete(u) {
        if (!confirm(`Delete user ${u.username} (${u.name})? This cannot be undone.`)) return;
        try {
            await userClient.adminDeleteUser(sessionToken, u.id);
            await loadUsers();
        } catch (err) {
            alert('Delete failed: ' + (err?.message || String(err)));
        }
    }

    async function onModalSaved() {
        setModalOpen(false);
        await loadUsers();
    }

    return (
        <div className="rounded-2xl border bg-white p-4 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Admin · Users</h2>
                <div>
                    <button onClick={openCreate} className="rounded-md bg-sky-600 text-white px-3 py-1">Create user</button>
                </div>
            </div>

            {error && <div className="mb-2 text-red-600">{error}</div>}
            {loading ? <div>Loading users…</div> : (
                <div className="overflow-auto max-h-64">
                    <table className="w-full text-sm">
                        <thead className="text-slate-500">
                            <tr>
                                <th className="text-left">Name</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Last Login</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-t">
                                    <td className="py-2">{u.name}</td>
                                    <td className="py-2 text-slate-600">{u.username}</td>
                                    <td className="py-2 text-slate-600">{u.role}</td>
                                    <td className="py-2 text-slate-600">{u.last_login ? new Date(u.last_login * 1000).toLocaleString() : '—'}</td>
                                    <td className="py-2 text-right">
                                        <button onClick={() => openEdit(u)} className="mr-2 text-sky-600">Edit</button>
                                        <button onClick={() => handleDelete(u)} className="text-red-600">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {modalOpen && (
                <UserEditModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSaved={onModalSaved}
                    sessionToken={sessionToken}
                    user={editingUser}
                />
            )}
        </div>
    );
}
