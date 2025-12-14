import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function CircularGallery({
  images = [],
  autoScrollSpeed = 40, // px per second
  showLabels = true,
  reverse = false, // if true, scrolls in reverse direction
}) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const positionRef = useRef(0);
  const totalWidthRef = useRef(0);
  const modalOpenRef = useRef(false);

  const [activeIndex, setActiveIndex] = useState(null); // for fullscreen preview

  // Normalize images prop
  const slides = useMemo(() => {
    if (!images || images.length === 0) return [];

    return images.map((img, index) =>
      typeof img === 'string'
        ? { src: img, alt: `Image ${index + 1}`, label: `Image ${index + 1}` }
        : {
            src: img.src,
            alt: img.alt || img.label || `Image ${index + 1}`,
            label: img.label || img.alt || `Image ${index + 1}`,
          }
    );
  }, [images]);

  // Duplicate slides for seamless infinite loop
  const loopSlides = useMemo(() => slides.concat(slides), [slides]);

  // Sync modal state to ref (used to pause scrolling)
  useEffect(() => {
    modalOpenRef.current = activeIndex !== null;
  }, [activeIndex]);

  // Measure width of one loop (original slides only)
  useEffect(() => {
    if (!trackRef.current) return;

    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const totalWidth = track.scrollWidth;
      totalWidthRef.current = totalWidth / 2; // original width
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

      const shouldPause = modalOpenRef.current;

      if (!shouldPause) {
        const direction = reverse ? -1 : 1;
        positionRef.current += direction * autoScrollSpeed * dt;
      }

      const totalWidth = totalWidthRef.current;
      if (totalWidth > 0) {
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
                h-[85%]
                w-[70vw] sm:w-[45vw] lg:w-[32vw]
                rounded-2xl
                overflow-hidden
                bg-neutral-200 dark:bg-neutral-800
                shadow-md
                cursor-pointer
              "
            >
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-70 object-cover"
                loading="lazy"
              />
              {showLabels && (
                <figcaption
                  className="
                    absolute bottom-0 left-0 right-0
                    bg-gradient-to-t from-black/70 to-transparent
                    px-4 py-3
                    text-sm font-medium
                    text-neutral-100 dark:text-neutral-50
                  "
                >
                  
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>

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
              flex items-center justify-center
            "
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeSlide.src}
              alt={activeSlide.alt}
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-xl"
            />

            <button
              onClick={() => setActiveIndex(null)}
              className="
                absolute top-3 right-3
                rounded-full
                bg-red-500/70
                text-neutral-100
                px-3 py-1 text-sm
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
