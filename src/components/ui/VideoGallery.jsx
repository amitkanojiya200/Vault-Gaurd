import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * props.videos can be:
 *  - ['video1.mp4', 'video2.mp4']
 *  - [{ src: 'video1.mp4', title?: string, description?: string, thumbnail?: string }, ...]
 */
export default function VideoGallery({
  videos = [],
  autoScrollSpeed = 30, // px per second
  reverse = false,
  showMeta = true, // show title/description on cards & modal
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const positionRef = useRef(0);
  const totalWidthRef = useRef(0);
  const modalOpenRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(null); // for fullscreen video modal

  // Normalize videos prop
  const slides = useMemo(() => {
    if (!videos || videos.length === 0) return [];

    return videos.map((item, index) => {
      if (typeof item === 'string') {
        return {
          src: item,
          title: `Video ${index + 1}`,
          description: '',
          thumbnail: null,
        };
      }

      return {
        src: item.src,
        title: item.title || `Video ${index + 1}`,
        description: item.description || '',
        thumbnail: item.thumbnail || null,
      };
    });
  }, [videos]);

  // Duplicate slides for seamless infinite loop
  const loopSlides = useMemo(() => slides.concat(slides), [slides]);

  // Keep ref in sync with modal state (to pause auto-scroll when preview open)
  useEffect(() => {
    modalOpenRef.current = activeIndex !== null;
  }, [activeIndex]);

  // Measure full width of one loop (so we know when to wrap)
  useEffect(() => {
    if (!trackRef.current) return;

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const totalWidth = track.scrollWidth;
      totalWidthRef.current = totalWidth / 2; // width of original slides (without duplication)
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [loopSlides]);

  // Auto-scrolling animation
  useEffect(() => {
    if (!trackRef.current || loopSlides.length === 0) return;

    const loop = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = time;

      const shouldPause = modalOpenRef.current; // only pause when modal is open

      if (!shouldPause) {
        const direction = reverse ? -1 : 1;
        positionRef.current += direction * autoScrollSpeed * dt;
      }

      const totalWidth = totalWidthRef.current;
      if (totalWidth > 0) {
        // wrap for infinite effect
        if (positionRef.current > totalWidth) positionRef.current -= totalWidth;
        if (positionRef.current < 0) positionRef.current += totalWidth;
      }

      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(-${positionRef.current}px)`;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      lastTimeRef.current = 0;
    };
  }, [loopSlides, autoScrollSpeed, reverse]);

  // ESC closes preview
  useEffect(() => {
    if (activeIndex === null) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex]);

  if (slides.length === 0) return null;

  const handleCardClick = (loopIndex) => {
    const realIndex = loopIndex % slides.length;
    setActiveIndex(realIndex);
  };

  const activeSlide = activeIndex !== null ? slides[activeIndex] : null;

  return (
    <>
      {/* Auto-scrolling video gallery */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none"
      >
        <div
          ref={trackRef}
          className="flex gap-4 pl-4 will-change-transform"
        >
          {loopSlides.map((item, index) => (
            <figure
              key={index}
              onClick={() => handleCardClick(index)}
              className="
                relative flex-none
                w-[70vw] sm:w-[45vw] lg:w-[32vw]
                aspect-video
                rounded-2xl
                overflow-hidden
                bg-neutral-900
                shadow-lg
                cursor-pointer
              "
            >
              {/* Card content: thumbnail if provided, else muted looping video */}
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  // autoPlay
                  preload="metadata"
                />
              )}

              {/* Dark gradient + text at bottom */}
              {showMeta && (
                <figcaption
                  className="
                    absolute inset-x-0 bottom-0
                    bg-gradient-to-t from-black/80 via-black/40 to-transparent
                    px-4 py-3
                    text-neutral-100 dark:text-neutral-50
                  "
                >
                  <div className="text-sm font-semibold truncate">
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="mt-1 text-xs opacity-80">
                      {item.description}
                    </div>
                  )}
                </figcaption>
              )}

              {/* Center play icon overlay (always visible, no hover effect) */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="
                    flex items-center justify-center
                    h-10 w-10 sm:h-12 sm:w-12
                    rounded-full
                    bg-black/60
                  "
                >
                  <span className="ml-0.5 text-lg sm:text-xl text-neutral-100">
                    ▶
                  </span>
                </div>
              </div>
            </figure>
          ))}
        </div>
      </div>

      {/* Fullscreen video modal */}
      {activeSlide && (
        <div
          className="
            fixed inset-0 z-50
            bg-black/80
            flex items-center justify-center
            p-4
          "
          onClick={() => setActiveIndex(null)}
        >
          <div
            className="
              relative max-w-5xl w-full max-h-[90vh]
              flex flex-col gap-3
            "
            onClick={(e) => e.stopPropagation()} // don't close when clicking inside
          >
            <video
              src={activeSlide.src}
              className="w-full max-h-[70vh] object-contain rounded-xl bg-black"
              controls
              autoPlay
              playsInline
            />

            {showMeta && (
              <div className="flex flex-col gap-1 text-neutral-100">
                <div className="text-base sm:text-lg font-semibold">
                  {activeSlide.title}
                </div>
                {activeSlide.description && (
                  <div className="text-xs sm:text-sm text-neutral-200/80">
                    {activeSlide.description}
                  </div>
                )}
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setActiveIndex(null)}
              className="
                absolute -top-2 -right-2 sm:top-0 sm:right-0
                rounded-full
                bg-black/80
                text-neutral-100
                px-3 py-1 text-xs sm:text-sm
              "
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
