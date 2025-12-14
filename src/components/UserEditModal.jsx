// src/components/UserEditModal.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as userClient from '@/lib/userClient';

export default function UserEditModal({ open, onClose, onSaved, sessionToken, user }) {
    const isEdit = !!user;
    const [name, setName] = useState(user?.name ?? '');
    const [username, setUsername] = useState(user?.username ?? '');
    const [email, setEmail] = useState(user?.email ?? '');
    const [role, setRole] = useState(user?.role ?? 'user');
    const [password, setPassword] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setName(user?.name ?? '');
        setUsername(user?.username ?? '');
        setEmail(user?.email ?? '');
        setRole(user?.role ?? 'user');
        setPassword('');
        setError('');
    }, [user]);

    if (!open) return null;

    async function handleSave(e) {
        e.preventDefault();
        setError('');
        if (!name.trim() || !username.trim()) {
            setError('Name and username required.');
            return;
        }
        setSaving(true);
        try {
            if (isEdit) {
                await userClient.adminUpdateUser(sessionToken, user.id, name.trim(), username.trim(), email || null, password || null, role);
            } else {
                // require password for new user
                if (!password) { setError('Password required for new user'); setSaving(false); return; }
                await userClient.adminCreateUser(sessionToken, name.trim(), username.trim(), email || null, password, role);
            }
            onSaved && onSaved();
        } catch (err) {
            setError(err?.message || String(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center">
            <div onClick={onClose} className="absolute inset-0 bg-black/60" />
            <motion.div className="relative z-10 w-[min(720px,95%)] rounded-lg bg-white p-4">
                <h3 className="font-semibold">{isEdit ? 'Edit user' : 'Create user'}</h3>
                {error && <div className="text-red-600 my-2">{error}</div>}
                <form onSubmit={handleSave} className="space-y-2">
                    <div>
                        <label className="text-xs">Full name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                        <label className="text-xs">Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                        <label className="text-xs">Email (optional)</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>
                    <div>
                        <label className="text-xs">Role</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded px-2 py-1">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs">{isEdit ? 'New password (leave empty to keep)' : 'Password'}</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded px-2 py-1" />
                    </div>

                    <div className="flex gap-2 mt-2">
                        <button type="submit" className="rounded bg-sky-600 text-white px-3 py-1" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                        <button type="button" onClick={onClose} className="rounded border px-3 py-1">Cancel</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}
