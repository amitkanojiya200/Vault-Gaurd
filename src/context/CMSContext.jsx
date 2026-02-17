// src/context/CMSContext.jsx
import { load } from "@tauri-apps/plugin-store";
import React, { useEffect, useState, createContext, useContext } from "react";
// 🔄 real auth + session
import sessionClient from "@/lib/sessionClient";
import * as userClient from "@/lib/userClient";
import * as authClient from "@/lib/authClient";

const CMS_FILE = "cms.json";
const DEFAULT_CONTENT = {
    home_title: { type: "title", value: "2.1 National Level" },
    home_paragraph_1: {
        type: "paragraph",
        value: "Inspector General Bhisham Sharma assumed charge as Commander..."
    },
    home_paragraph_2: {
        type: "paragraph",
        value: "Wrire content here..."
    },
    // ... add your other defaults here
};

const CMSContext = createContext();

export function CMSProvider({ children }) {
    const [cms, setCms] = useState({});
    const [loading, setLoading] = useState(true);
    // ✅ current user from real backend session
    const [isAdmin, setIsAdmin] = React.useState(null);

    useEffect(() => {
        let mounted = true;

        async function reloadUserFromSession() {
            try {
                const token = await sessionClient.getSessionToken();
                if (!token) {
                    if (mounted) setIsAdmin(null);
                    return;
                }

                let user = null;
                if (userClient.validateSession) {
                    user = await userClient.validateSession(token);
                }

                if (mounted && user) {
                    // setIsAdmin({ ...user, token });
                    const isUserAdmin = user?.role === 'admin';
                    setIsAdmin(isUserAdmin);
                }
            } catch (err) {
                console.error("[Edit content] Failed to load current user from session:", err);
                try {
                    await sessionClient.clearSessionToken();
                } catch (_) {
                    // ignore
                }
                if (mounted) setIsAdmin(null);
            }
        }

        // run once on mount
        reloadUserFromSession();

        // run again whenever Login fires "session-updated"
        const handler = () => {
            reloadUserFromSession();
        };
        window.addEventListener("session-updated", handler);

        return () => {
            mounted = false;
            window.removeEventListener("session-updated", handler);
        };
    }, []);

    useEffect(() => {
        async function initStore() {
            try {
                // In v2, you 'load' the store to get the instance
                const store = await load(CMS_FILE);

                const savedData = await store.values();

                if (Object.keys(savedData).length === 0) {
                    for (const [key, val] of Object.entries(DEFAULT_CONTENT)) {
                        await store.set(key, val);
                    }
                    await store.save();
                    setCms(DEFAULT_CONTENT);
                } else {
                    const allEntries = await store.entries();
                    setCms(Object.fromEntries(allEntries));
                }
            } catch (error) {
                console.error("Store initialization failed:", error);
            } finally {
                setLoading(false);
            }
        }
        initStore();
    }, []);

    async function updateTag(tag, value) {
        try {
            const store = await load(CMS_FILE); // Always await load first
            const updatedEntry = { ...cms[tag], value };

            await store.set(tag, updatedEntry);
            await store.save();

            setCms(prev => ({ ...prev, [tag]: updatedEntry }));
        } catch (error) {
            console.error("Failed to update CMS:", error);
        }
    }

    return (
        <CMSContext.Provider value={{ cms, updateTag, isAdmin, loading }}>
            {!loading && children}
        </CMSContext.Provider>
    );
}

export const useCMS = () => useContext(CMSContext);