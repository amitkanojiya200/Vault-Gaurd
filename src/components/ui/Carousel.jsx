// src/components/Carousel.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "motion/react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const GAP = 16;
const SPRING_OPTIONS = { type: "spring", stiffness: 300, damping: 30 };
const VELOCITY_THRESHOLD = 1000;

function SlideImage({
  src,
  alt,
  itemWidth,
  imageHeight,
  index,
  trackOffset,
  xMotion,
  effectiveTransition
}) {
  const inputRange = [-(index + 1) * trackOffset, -index * trackOffset, -(index - 1) * trackOffset];
  const rotateY = useTransform(xMotion, inputRange, [90, 0, -90], { clamp: false });

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl bg-[var(--bg-light-soft)] dark:bg-[var(--bg-dark-soft)]"
      style={{
        flex: "0 0 auto",
        minWidth: itemWidth,
        maxWidth: itemWidth,
        boxSizing: "border-box",
        width: itemWidth,
        height: imageHeight,
        rotateY: rotateY
      }}
      transition={effectiveTransition}
      aria-hidden={false}
    >
      <img
        src={src}
        alt={alt || ""}
        className="block w-full h-full object-cover select-none"
        style={{ WebkitUserDrag: "none", display: "block" }}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        loading="lazy"
      />
    </motion.div>
  );
}

export default function Carousel({
  items = [], // items: [{ id, image (or src), alt? }]
  autoplay = false,
  autoplayDelay = 3000,
  pauseOnHover = false,
  loop = false,
  fullWidth = true,
  columnsVisible = 1,
  imageHeight = 420, // control slide image height
  showNav = true // show prev/next buttons
}) {
  const containerRef = useRef(null);
  const x = useMotionValue(0);

  const [containerWidth, setContainerWidth] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Measure container width (responsive)
  useEffect(() => {
    function measure() {
      const w = containerRef.current ? containerRef.current.clientWidth : 0;
      setContainerWidth(w || 0);
    }
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      try { ro.disconnect(); } catch (e) {}
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Compute item width & track offset
  // --- important change:
  // For a single visible column we make the slide width = containerWidth - 2*GAP
  // so it leaves an equal visual gutter at left/right.
  const rawItemWidth =
    fullWidth && columnsVisible === 1
      ? Math.max(220, containerWidth - GAP * 2)
      : fullWidth
      ? Math.max(220, (containerWidth - GAP * (columnsVisible + 1)) / columnsVisible)
      : 300;

  const itemWidth = Math.round(rawItemWidth || 300);
  const trackItemOffset = itemWidth + GAP;

  // side padding to center the single slide visually
  const sidePadding = Math.max(0, Math.round((containerWidth - itemWidth) / 2));

  // Prepare carousel items (clone first item for loop visual)
  const carouselItems = loop && items.length > 0 ? [...items, items[0]] : items;

  // Pause on hover handlers
  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const el = containerRef.current;
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover]);

  // Autoplay effect
  useEffect(() => {
    if (!autoplay || items.length === 0) return;
    if (pauseOnHover && isHovered) return;
    const t = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev === items.length - 1 && loop) return prev + 1;
        if (prev === carouselItems.length - 1) return loop ? 0 : prev;
        return prev + 1;
      });
    }, autoplayDelay);
    return () => clearInterval(t);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, loop, items.length, carouselItems.length]);

  const effectiveTransition = isResetting ? { duration: 0 } : SPRING_OPTIONS;

  // Loop-reset handler (snap back to 0 index)
  const handleAnimationComplete = useCallback(() => {
    if (loop && currentIndex === carouselItems.length - 1) {
      setIsResetting(true);
      // when using padding, reset to x = 0 (first slide centered by padding)
      x.set(0);
      setCurrentIndex(0);
      setTimeout(() => setIsResetting(false), 60);
    }
  }, [carouselItems.length, currentIndex, loop, x]);

  // Drag end logic with dynamic threshold (percentage of width)
  const handleDragEnd = (_, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x || 0;
    const dragThreshold = Math.max(40, Math.round(itemWidth * 0.15)); // 15% or min 40px

    if (offset < -dragThreshold || velocity < -VELOCITY_THRESHOLD) {
      // next
      if (loop && currentIndex === items.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex((prev) => Math.min(prev + 1, carouselItems.length - 1));
      }
    } else if (offset > dragThreshold || velocity > VELOCITY_THRESHOLD) {
      // prev
      if (loop && currentIndex === 0) {
        setCurrentIndex(items.length - 1);
      } else {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    } else {
      // no change (snap back)
      setCurrentIndex((prev) => prev);
    }
  };

  // drag constraints when not looping — account for sidePadding by shifting constraints
  const dragProps = loop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * (carouselItems.length - 1),
          right: 0
        }
      };

  // navigation helpers
  const goPrev = useCallback(() => {
    if (loop && currentIndex === 0) {
      setCurrentIndex(items.length - 1);
    } else {
      setCurrentIndex((p) => Math.max(0, p - 1));
    }
  }, [currentIndex, items.length, loop]);

  const goNext = useCallback(() => {
    if (loop && currentIndex === items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex((p) => Math.min(carouselItems.length - 1, p + 1));
    }
  }, [carouselItems.length, currentIndex, loop]);

  // keyboard accessibility
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  // animated x target: with side padding present the first slide sits at x=0,
  // so to show currentIndex we move by -currentIndex * trackItemOffset
  const animatedX = -currentIndex * trackItemOffset;

  const normalizedIndex = items.length ? currentIndex % items.length : 0;

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden"
      aria-roledescription="carousel"
      style={{ boxSizing: "border-box" }}
    >
      <motion.div
        className="flex items-stretch"
        drag="x"
        {...dragProps}
        style={{
          gap: `${GAP}px`,
          display: "flex",
          flexWrap: "nowrap",
          perspective: 1000,
          perspectiveOrigin: `${currentIndex * trackItemOffset + itemWidth / 2}px 50%`,
          x,
          touchAction: "pan-y",
          minWidth: 0,
          boxSizing: "border-box",
          paddingLeft: sidePadding,
          paddingRight: sidePadding
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: animatedX }}
        transition={effectiveTransition}
        onAnimationComplete={handleAnimationComplete}
      >
        {carouselItems.map((it, idx) => {
          const src = it.image || it.src || "";
          return (
            <SlideImage
              key={idx + "-" + (it.id || idx)}
              src={src}
              alt={it.alt || ""}
              itemWidth={itemWidth}
              imageHeight={imageHeight}
              index={idx}
              trackOffset={trackItemOffset}
              xMotion={x}
              effectiveTransition={effectiveTransition}
            />
          );
        })}
      </motion.div>

      {/* nav buttons */}
      {showNav && items.length > 0 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={goPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 dark:bg-[#061022]/80 shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <FiChevronLeft className="h-5 w-5 text-[var(--orange)] dark:text-[var(--soft-white)]" />
          </button>

          <button
            type="button"
            aria-label="Next slide"
            onClick={goNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-white/90 dark:bg-[#061022]/80 shadow-md hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-[var(--yellow)]"
            style={{ backdropFilter: "blur(4px)" }}
          >
            <FiChevronRight className="h-5 w-5 text-[var(--orange)] dark:text-[var(--soft-white)]" />
          </button>
        </>
      )}

      {/* pagination inside */}
      <div className="absolute left-0 right-0 bottom-4 z-40 pointer-events-none">
        <div className="flex justify-center">
          <div className="flex gap-3 pointer-events-auto">
            {items.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                initial={false}
                animate={{
                  scale: normalizedIndex === i ? 1.12 : 1,
                  opacity: normalizedIndex === i ? 1 : 0.85
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="relative flex items-center justify-center"
                style={{ width: 36, height: 36 }}
              >
                <motion.span
                  className={`absolute inset-0 rounded-full ${normalizedIndex === i ? "bg-[var(--orange)]/30" : "bg-black/8 dark:bg-white/5"}`}
                  initial={{ scale: 1, opacity: 0.35 }}
                  animate={normalizedIndex === i ? { scale: [1, 1.6, 1], opacity: [0.35, 0.12, 0.35] } : { scale: 1, opacity: 0.35 }}
                  transition={normalizedIndex === i ? { repeat: Infinity, repeatDelay: 1.6, duration: 1.6 } : { duration: 0.25 }}
                />
                <span className={`relative rounded-full w-3.5 h-3.5 ${normalizedIndex === i ? "bg-[var(--orange)]" : "bg-white/90 dark:bg-[#0F172A]"}`} />
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
