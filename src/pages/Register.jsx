// src/pages/Register.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User2, Lock, Eye, EyeOff } from 'lucide-react';
import bgImage2 from '../assets/dbg2.png';
import { authRegister } from '@/lib/authClient';
import { ROUTES, useRoute } from '../router/Router';

export default function Register() {
    const { navigate } = useRoute();

    const [role, setRole] = useState('user'); // dev toggle
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [seePass, setSeePass] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setInfo('');

        if (!name.trim() || !username.trim() || !password.trim()) {
            setError('Please fill all fields.');
            return;
        }

        setLoading(true);
        try {
            // call real backend
            const created = await authRegister(name.trim(), username.trim(), password, role, null);

            // Backend returns created user object (UserPublic). Show friendly info and go to login.
            setInfo(`User "${created.username}" created successfully. Redirecting to Login…`);

            // short visible delay then navigate (keeps user informed). This is a UI delay only.
            setTimeout(() => navigate(ROUTES.LOGIN), 700);
        } catch (err) {
            // authClient already normalizes errors to throw Error(message)
            setError(err?.message || String(err) || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    }

    function goToLogin() {
        navigate(ROUTES.LOGIN);
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
                    <div className="mb-4 flex items-start gap-2">
                        <UserPlus className="mt-1 h-5 w-5 text-sky-600 dark:text-sky-300" />
                        <div>
                            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                PRABAL · User Registration
                            </p>
                            <h1 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                                Register User Account
                            </h1>
                            <p className="mt-1 text-[0.75rem] text-slate-500 dark:text-slate-400">
                                This screen creates standard <b>User</b> accounts only. Admin roles are provisioned separately.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Full Name
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950/70">
                                <User2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                                    placeholder="e.g. Yadav, Ops Cell"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-sky-500/60 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100"
                                placeholder="e.g. ops_user01"
                                autoComplete="username"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                                Password
                            </label>
                            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-950/70">
                                <Lock className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                <input
                                    type={seePass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex-1 bg-transparent text-sm outline-none dark:text-slate-100"
                                    placeholder="Set a strong password"
                                    autoComplete="new-password"
                                />
                                <button type="button" onClick={() => setSeePass((v) => !v)} className="p-1">
                                    {seePass ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Role selector (dev-only toggle) */}
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Role</p>
                            <div className="ml-2 inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setRole('user')}
                                    className={[
                                        'rounded-md px-3 py-1 text-sm font-medium transition',
                                        role === 'user'
                                            ? 'bg-white/90 text-sky-700 dark:bg-sky-600 dark:text-white'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/50',
                                    ].join(' ')}
                                >
                                    User
                                </button>
                                {/* <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={[
                                        'rounded-md px-3 py-1 text-sm font-medium transition',
                                        role === 'admin'
                                            ? 'bg-white/90 text-amber-700 dark:bg-amber-500 dark:text-slate-950'
                                            : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700/50',
                                    ].join(' ')}
                                >
                                    Admin
                                </button> */}
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
                            {loading ? 'Registering…' : 'Register User'}
                        </button>
                    </form>

                    <div className="mt-4 flex items-center justify-between text-[0.75rem] text-slate-500 dark:text-slate-400">
                        <span>Already have an account?</span>
                        <button type="button" onClick={goToLogin} className="text-sky-700 hover:underline dark:text-sky-300">
                            Back to Login
                        </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[0.75rem] text-slate-500 dark:text-slate-400">
                        <span>Want to see public view?</span>
                        <button type="button" onClick={() => navigate(ROUTES.HOME)} className="text-sky-700 hover:underline dark:text-sky-300">
                            Back to Home
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
