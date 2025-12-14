import React, { useEffect, useMemo, useRef } from 'react';

export default function WhatsNewVerticalTicker({
    items = [],// [{ id?, title, href: public_path_to_doc }]
    autoScrollSpeed = 40, // px per second
    reverse = false,// false = scroll up, true = scroll down
}) {
    // --- Refs for Animation Control ---
    const trackRef = useRef(null);
    const animationFrameRef = useRef(null);
    const lastTimeRef = useRef(0);
    const positionRef = useRef(0);
    const totalHeightRef = useRef(0);

    // --- Data Normalization ---
    const newsItems = useMemo(() => {
        if (!items || items.length === 0) return [];
        return items.map((item, index) =>
            typeof item === 'string'
                ? { id: index, title: item, href: '#' } // Added default href for safety
                : { id: item.id ?? index, title: item.title, href: item.href }
        );
    }, [items]);

    // Duplicate list for seamless loop
    const loopItems = useMemo(() => newsItems.concat(newsItems), [newsItems]);

    // --- Measure Height (Effect) ---
    useEffect(() => {
        if (!trackRef.current) return;

        const measure = () => {
            const track = trackRef.current;
            if (!track) return;
            const totalHeight = track.scrollHeight;
            // Store the height of the original list (half of the duplicated list)
            totalHeightRef.current = totalHeight / 2;
        };

        // Measure immediately and attach listener for resize
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [loopItems]);

    // --- Auto-scroll Animation (Effect) ---
    useEffect(() => {
        if (!trackRef.current || loopItems.length === 0) return;

        const loop = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            // Calculate new position based on speed and direction
            const direction = reverse ? -1 : 1;
            positionRef.current += direction * autoScrollSpeed * dt;

            // Handle seamless looping (reset position when necessary)
            const totalHeight = totalHeightRef.current;
            if (totalHeight > 0) {
                if (positionRef.current >= totalHeight) positionRef.current -= totalHeight;
                if (positionRef.current < 0) positionRef.current += totalHeight;
            }

            if (trackRef.current) {
                // Apply the calculated scroll position using transform
                trackRef.current.style.transform = `translateY(-${positionRef.current}px)`;
            }

            animationFrameRef.current = requestAnimationFrame(loop);
        };

        animationFrameRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animationFrameRef.current);
    }, [loopItems, autoScrollSpeed, reverse]);

    if (newsItems.length === 0) return null;

    return (
        <div className="relative h-full w-full overflow-hidden">
            <div
                ref={trackRef}
                className="absolute inset-x-0 top-0 flex flex-col gap-2 will-change-transform"
            >
                {loopItems.map((item, index) => (
                    // Using <a> tag to open the document link directly
                    <a
                        key={`${item.id}-${index}`}
                        href={item.href}
                        target="_blank" // Opens the document in a new tab
                        rel="noopener noreferrer"
                        className="w-full text-left rounded-xl border border-slate-300/70 dark:border-slate-700/70 bg-gradient-to-br from-slate-50/90 to-slate-100/50 dark:from-slate-900/80 dark:to-slate-800/60 px-3 py-2.5 text-[0.78rem] font-medium text-slate-700 dark:text-slate-200 shadow-sm shadow-slate-300/50 dark:shadow-black/40 backdrop-blur-sm focus:outline-none focus:ring-1 focus:ring-sky-500/70 whitespace-nowrap transition-colors inline-block"
                    >
                        <span className="inline-flex items-center gap-2 cursor-pointer">
                            {/* 🔹 left accent indicator */}
                            <span className="h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />

                            {/* 📰 title */}
                            <span className="truncate">{item.title}</span>
                        </span>
                    </a>
                ))}
            </div>
        </div>
    );
}