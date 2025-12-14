// src/components/home/WhatsNewTicker.jsx
import React, { useEffect, useMemo, useRef } from 'react';

import sessionClient from '@/lib/sessionClient';
import * as fsClient from '@/lib/fsClient';

export default function WhatsNewTicker({
    items = [], // [{ id?, title, href? }] - href should now be a public URL/path
    autoScrollSpeed = 40, // px per second
    reverse = false,
    onItemClick,
}) {
    const trackRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(0);
    const positionRef = useRef(0);
    const totalHeightRef = useRef(0);

    // Normalize items
    const newsItems = useMemo(() => {
        if (!items || items.length === 0) return [];
        return items.map((item, index) =>
            typeof item === 'string'
                ? { id: index, title: item }
                : { id: item.id ?? index, title: item.title, href: item.href }
        );
    }, [items]);

    // Duplicate list for seamless loop
    const loopItems = useMemo(() => newsItems.concat(newsItems), [newsItems]);

    // Measure original list height
    useEffect(() => {
        if (!trackRef.current) return;

        const measure = () => {
            const track = trackRef.current;
            if (!track) return;
            // totalHeight is the height of the entire doubled list
            const totalHeight = track.scrollHeight;
            // We only need the height of the original list for seamless looping
            totalHeightRef.current = totalHeight / 2;
        };

        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [loopItems]);

    // Auto-scroll animation
    useEffect(() => {
        if (!trackRef.current || loopItems.length === 0) return;

        const loop = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            // Calculate new position based on speed and direction
            const direction = reverse ? -1 : 1;
            positionRef.current += direction * autoScrollSpeed * dt;

            // Handle seamless looping logic
            const totalHeight = totalHeightRef.current;
            if (totalHeight > 0) {
                // If scrolled past the end of the first list (scrolling up)
                if (positionRef.current >= totalHeight) positionRef.current -= totalHeight;
                // If scrolled past the start (scrolling down/reverse)
                if (positionRef.current < 0) positionRef.current += totalHeight;
            }

            if (trackRef.current) {
                // Apply the calculated scroll position
                trackRef.current.style.transform = `translateY(-${positionRef.current}px)`;
            }

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loopItems, autoScrollSpeed, reverse]);

    // --- MODIFIED CLICK HANDLER ---
    const handleClick = (item, event) => {
        // Prefer caller-provided handler
        if (onItemClick) {
            // pass both item and DOM MouseEvent so the caller can check modifiers
            onItemClick(item, event);
            return;
        }

        // legacy fallback (if no onItemClick provided)
        if (item.href || item.path) {
            // open in new tab (browser) as a fallback
            const url = item.href ?? item.path;
            if (typeof window !== "undefined") window.open(url, "_blank");
        }
    };
    // -----------------------------

    if (newsItems.length === 0) return null;

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div
                ref={trackRef}
                // The transform property is manipulated by the useEffect hook
                className="absolute inset-x-0 top-0 flex flex-col gap-2 will-change-transform"
            >
                {loopItems.map((item, index) => (
                    <button
                        key={`${item.id}-${index}`}
                        onClick={() => handleClick(item)}
                        type="button"
                        className="w-full text-left rounded-xl border border-slate-300/70 dark:border-slate-700/70 bg-gradient-to-br from-slate-50/90 to-slate-100/50 dark:from-slate-900/80 dark:to-slate-800/60 px-3 py-2.5 text-[0.78rem] font-medium text-slate-700 dark:text-slate-200 shadow-sm shadow-slate-300/50 dark:shadow-black/40 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-sky-500/70 whitespace-nowrap transition-colors">
                        <span className="inline-flex items-center gap-2 cursor-pointer">
                            {/* 🔹 left accent indicator */}
                            <span className="h-1.5 w-1.5 rounded-full bg-(--orange500) dark:bg-(--orange400)" />

                            {/* 📰 title */}
                            <span className="truncate">{item.title}</span>
                        </span>
                    </button>

                ))}
            </div>
        </div>
    );
}