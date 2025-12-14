import React, { useEffect, useState } from 'react';
import sessionClient from '@/lib/sessionClient';
import * as userClient from '@/lib/userClient';
import { useRoute, ROUTES } from '../router/Router';
import AdminUsersPanel from '@/components/AdminUserPanel';

export default function Profile() {
    const { navigate } = useRoute();
    const [loading, setLoading] = useState(true);
    const [sessionToken, setSessionToken] = useState(null);
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    // Form state
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const token = await sessionClient.getSessionToken();
                console.log('sessionClient.getSessionToken() ->', token);
                if (!token) {
                    navigate(ROUTES.LOGIN);
                    return;
                }
                setSessionToken(token);

                const p = await userClient.validateSession(token);
                console.log('validateSession returned ->', p);

                if (!mounted) return;
                setProfile(p || null);

                // populate form from returned profile (safe defaults)
                setName(p?.name || '');
                setUsername(p?.username || '');
            } catch (err) {
                console.error('[Profile] failed to load profile:', err);
                setError(err?.message || String(err));
            } finally {
                if (mounted) setLoading(false);
            }
        })();
        return () => { mounted = false; };
    }, [navigate]);

    async function handleSave(e) {
        e.preventDefault();
        setError('');
        setInfo('');
        if (!name.trim() || !username.trim()) {
            setError('Name and username are required.');
            return;
        }
        if (newPassword && newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            return;
        }

        setSaving(true);
        try {
            console.log('calling updateProfile with', { sessionToken, name: name.trim(), username: username.trim() });
            const updated = await userClient.updateProfile(sessionToken, name.trim(), username.trim(), newPassword || null);

            console.log('updateProfile returned ->', updated);

            // If backend returned a user object, use it; otherwise revalidate session to fetch fresh profile
            let finalProfile = updated;
            if (!finalProfile) {
                try {
                    finalProfile = await userClient.validateSession(sessionToken);
                    console.log('validateSession after update returned ->', finalProfile);
                } catch (ve) {
                    console.warn('validateSession after update failed:', ve);
                }
            }

            if (finalProfile) {
                setProfile(finalProfile);
                setName(finalProfile.name || '');
                setUsername(finalProfile.username || '');
                setInfo('Profile updated.');
            } else {
                // still try to reflect optimistic UI but warn the user
                setInfo('Profile update attempted — refresh may be required to see changes.');
            }

            // clear password fields always on success/attempt
            setNewPassword('');
            setConfirmPassword('');

            // notify global session changed: username or name changed might need UI update
            window.dispatchEvent(new CustomEvent('session-updated', { detail: { status: 'profile-updated' } }));
        } catch (err) {
            console.error('[Profile] update failed:', err);
            setError(err?.message || String(err));
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <div className="p-6">Loading profile…</div>;
    if (!profile) return <div className="p-6">No profile loaded.</div>;

    return (
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-6">
            <div className="rounded-2xl border bg-white p-6 dark:bg-slate-900">
                <h1 className="text-xl font-semibold">My Profile</h1>
                <p className="text-sm text-slate-500 mt-1">Update your name, username, or password.</p>

                {error && <div className="mt-3 rounded border border-red-400/30 bg-red-50/70 p-2 text-red-800">{error}</div>}
                {info && <div className="mt-3 rounded border border-emerald-400/30 bg-emerald-50/70 p-2 text-emerald-800">{info}</div>}

                <form onSubmit={handleSave} className="mt-4 space-y-3">
                    <div>
                        <label className="block text-xs text-slate-600">Full name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-md border px-3 py-2" />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600">Username</label>
                        <input value={username} onChange={e => setUsername(e.target.value)} className="w-full rounded-md border px-3 py-2" />
                    </div>

                    <div>
                        <label className="block text-xs text-slate-600">New password (leave blank to keep)</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-md border px-3 py-2" />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="w-full rounded-md border px-3 py-2 mt-2" />
                    </div>

                    <div className="flex gap-2">
                        <button type="submit" disabled={saving} className="rounded-md bg-(--orange500) text-white px-4 py-2">{saving ? 'Saving…' : 'Save Changes'}</button>
                        <button type="button" onClick={() => { setName(profile.name); setUsername(profile.username); setNewPassword(''); setConfirmPassword(''); }} className="rounded-md border px-4 py-2">Reset</button>
                    </div>
                </form>
            </div>

            {/* Admin area */}
            {profile.role === 'admin' && (
                <div className="mt-6">
                    <AdminUsersPanel sessionToken={sessionToken} />
                </div>
            )}
        </div>
    );
}
