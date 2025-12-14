// src/components/BentoGrid.jsx
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";

/**
 * Tailwind-only Bento Grid (6 cells)
 * - No external CSS: uses Tailwind utility classes + inline React
 * - Desktop (lg) layout uses col/row start/span utilities to create asymmetric bento
 * - md: 2-column balanced layout, sm: stacked column
 * - Framer Motion: entrance animations (staggered)
 * - GSAP: reduced-intensity tilt on hover (max tilt 4°)
 *
 * Usage:
 * <BentoGrid gap="gap-6">
 *   <img src="/1.jpg" alt="" />
 *   <img src="/2.jpg" alt="" />
 *   <img src="/3.jpg" alt="" />
 *   <div>4</div>
 *   <div>5</div>
 *   <video src="/6.mp4" muted loop />
 * </BentoGrid>
 *
 * Note: pass a Tailwind gap utility name (e.g. 'gap-6', 'gap-8') as `gap` prop, or omit to use 'gap-6'.
 */

function useGsapTilt(ref, { max = 4, scale = 1.02 } = {}) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let w = 0, h = 0;
    const onMove = (e) => {
      if (!w || !h) {
        const r = el.getBoundingClientRect();
        w = r.width; h = r.height;
      }
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / w;
      const y = (e.clientY - rect.top) / h;
      const rotateY = (x - 0.5) * -max * 2;
      const rotateX = (y - 0.5) * max * 2;

      gsap.to(el, { rotateX, rotateY, scale, duration: 0.35, ease: "power3.out", transformPerspective: 800 });
    };

    const onEnter = () => gsap.to(el, { scale: scale, duration: 0.22, ease: "power2.out" });
    const onLeave = () => gsap.to(el, { rotateX: 0, rotateY: 0, scale: 1, duration: 0.45, ease: "power3.out" });

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [ref, max, scale]);
}

function GridItem({ children, index = 0, from = "left", className = "" }) {
  const ref = useRef(null);
  useGsapTilt(ref, { max: 4, scale: 1.02 });

  const initial = {
    left: { x: -36, opacity: 0 },
    right: { x: 36, opacity: 0 },
    top: { y: -28, opacity: 0 },
    bottom: { y: 28, opacity: 0 },
  }[from] ?? { y: 18, opacity: 0 };

  // If children is img or video element, clone to add lazy + classes
  const content = React.isValidElement(children) && (children.type === "img" || children.type === "video")
    ? React.cloneElement(children, {
        loading: "lazy",
        className: `${children.props.className ?? ""} w-full h-full object-cover block`,
      })
    : children;

  return (
    <motion.div
      ref={ref}
      initial={initial}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: index * 0.07 }}
      viewport={{ once: true, amount: 0.28 }}
      className={`relative rounded-2xl overflow-hidden shadow-lg bg-[var(--bg-light-soft,#fff)] ${className}`}
      style={{ willChange: "transform", transformStyle: "preserve-3d" }}
    >
      {/* subtle overlay */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-60 bg-gradient-to-b from-transparent to-black/5" />
      <div className="relative w-full h-full flex items-center justify-center">
        {content}
      </div>
    </motion.div>
  );
}

export default function BentoGrid({ children, gap = "gap-6", className = "" }) {
  const kids = React.Children.toArray(children).slice(0, 6);
  while (kids.length < 6) kids.push(<div key={`empty-${kids.length}`} className="text-sm text-[var(--navy-muted,#475569)]">Empty</div>);

  // entrance 'from' directions for variety
  const froms = ["left", "top", "right", "bottom", "left", "right"];

  return (
    <div className={`w-full ${className}`}>
      {/* Grid container: mobile stack -> md: 2 columns -> lg: 3 columns with bento placements */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gap} auto-rows-auto`}>

        {/* Cell A (small top-left) */}
        <div
          className={`
            group
            /* grid placement */
            col-span-1
            md:col-span-1 lg:col-span-1 lg:row-span-1
            /* reserve space (aspect) */
            aspect-[4/3] md:aspect-[4/3] lg:min-h-[220px] lg:aspect-[4/3]
          `}
        >
          <GridItem index={0} from={froms[0]}>
            {kids[0]}
          </GridItem>
        </div>

        {/* Cell B (wider/taller center) - on lg it's middle column, spans 2 rows */}
        <div
          className={`
            group
            col-span-1
            md:col-span-1 lg:col-span-1 lg:row-span-2 lg:col-start-2
            aspect-[3/2] md:aspect-[3/2] lg:min-h-[380px]
          `}
        >
          <GridItem index={1} from={froms[1]}>
            {kids[1]}
          </GridItem>
        </div>

        {/* Cell C (right column tall) - spans 2 rows */}
        <div
          className={`
            group
            col-span-1
            md:col-span-1 lg:col-span-1 lg:row-span-2 lg:col-start-3
            aspect-[3/2] md:aspect-[3/2] lg:min-h-[380px]
          `}
        >
          <GridItem index={2} from={froms[2]}>
            {kids[2]}
          </GridItem>
        </div>

        {/* Cell D (left under A) */}
        <div
          className={`
            group
            col-span-1
            md:col-span-1 lg:col-span-1 lg:row-span-1 lg:col-start-1 lg:row-start-2
            aspect-[4/3] md:aspect-[4/3] lg:min-h-[160px]
          `}
        >
          <GridItem index={3} from={froms[3]}>
            {kids[3]}
          </GridItem>
        </div>

        {/* Cell E (left bottom third row) */}
        <div
          className={`
            group
            col-span-1
            md:col-span-1 lg:col-span-1 lg:row-span-1 lg:col-start-1 lg:row-start-3
            aspect-[4/3] md:aspect-[4/3] lg:min-h-[160px]
          `}
        >
          <GridItem index={4} from={froms[4]}>
            {kids[4]}
          </GridItem>
        </div>

        {/* Cell F (bottom right wide: spans two columns on bottom row) */}
        <div
          className={`
            group
            col-span-1 md:col-span-2 lg:col-span-2 lg:col-start-2 lg:row-start-3
            aspect-video md:aspect-video lg:min-h-[220px]
          `}
        >
          <GridItem index={5} from={froms[5]}>
            {kids[5]}
          </GridItem>
        </div>
      </div>
    </div>
  );
}
