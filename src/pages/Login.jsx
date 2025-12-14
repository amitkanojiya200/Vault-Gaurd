// src/pages/Login.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User2 } from 'lucide-react';
import bgImage2 from '../assets/dbg2.png';
import { authLogin } from '@/lib/authClient';
import { ROUTES } from '../router/Router';
import { useRoute } from '../router/Router';
import sessionClient from '@/lib/sessionClient'; // your secure session client

export default function Login() {
    const { navigate } = useRoute();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setInfo('');

        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.');
            console.log('USERNAME PASSWORD MISMATCH');
            return;
        }

        setLoading(true);
        try {
            const { user, token } = await authLogin(username.trim(), password);
            console.log('[Login] Logged in user from backend:', user);
            console.log('[Login] Session token from backend:', token);

            if (!token) {
                throw new Error('No session token returned from backend.');
            }

            const saved = await sessionClient.setSessionToken(token);
            console.log('[sessionClient] saving token to keyring:', token);

            if (!saved) {
                console.warn('Warning: failed to persist session token to secure store.');
                setInfo('Signed in — but failed to persist session token securely.');
            } else {
                setInfo('Signed in successfully.');
            }

            // 🔔 notify NavBar / Dashboard that session changed
            window.dispatchEvent(
                new CustomEvent('session-updated', { detail: { status: 'logged-in' } })
            );

            // Redirect according to role
            if (user?.role === 'admin') {
                navigate(ROUTES.DASHBOARD);
            } else {
                navigate(ROUTES.HOME);
            }
        } catch (err) {
            setError(err?.message || String(err) || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    }

    function goToRegister() {
        navigate(ROUTES.REGISTER);
    }

    return (
        <div className="relative min-h-screen overflow-hidden">
            <img
                src={bgImage2}
                alt="PRABAL background"
                className="fixed inset-0 -z-20 h-full w-full object-cover blur-lg brightness-75 saturate-150"
            />
            <div
                className="fixed inset-0 -z-10 backdrop-blur-xl opacity-90 dark:opacity-60"
                style={{
                    background:
                        'radial-gradient(circle at top, rgba(148,163,253,0.22), transparent 80%), linear-gradient(135deg, var(--gradient-from), var(--gradient-to))',
                }}
            />
            <div className="pointer-events-none fixed inset-0 -z-10 hidden bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.85),_transparent_70%)] dark:block" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 md:px-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-md rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm shadow-xl shadow-slate-300/40 dark:border-[var(--border-dark-soft,#1f2937)] dark:bg-slate-900/90 dark:text-[var(--soft-white,_#e5e7eb)] dark:shadow-black/40"
                >
                    <div className="mb-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                            PRABAL · Access
                        </p>
                        <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">Login</h1>
                        <p className="mt-1 text-[0.75rem] text-slate-500 dark:text-slate-400">Enter your credentials to access the portal.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Username</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950/70">
                                <User2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                                    placeholder="e.g. ops_user01"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Password</label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950/70">
                                <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-xl border border-red-500/30 bg-red-50/80 px-3 py-2 text-[0.75rem] text-red-700 dark:border-red-500/40 dark:bg-red-900/20 dark:text-red-200">
                                {error}
                            </div>
                        )}

                        {info && (
                            <div className="rounded-xl border border-emerald-500/30 bg-emerald-50/80 px-3 py-2 text-[0.75rem] text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/20 dark:text-emerald-200">
                                {info}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950"
                        >
                            {loading ? 'Checking…' : 'Login'}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between text-[0.75rem] text-slate-500 dark:text-slate-400">
                        <span>New user?</span>
                        <button type="button" onClick={goToRegister} className="text-sky-700 hover:underline dark:text-sky-300">
                            Register a user account
                        </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[0.75rem] text-slate-500 dark:text-slate-400">
                        <span>Just browsing?</span>
                        <button type="button" onClick={() => navigate(ROUTES.HOME)} className="text-sky-700 hover:underline dark:text-sky-300">
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
