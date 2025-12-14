// src/components/Splash.jsx
import React from "react";
import { motion } from "framer-motion";
import LottiePlayerWrapper from "./LottiePlayerWrapper";
import animation from "../assets/lottie/shipLoader2.json";

export default function Splash({ onDone }) {
  React.useEffect(() => {
    // fallback hide after 5s if parent doesn't control it
    const t = setTimeout(() => onDone && onDone(), 5000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[var(--navy)] to-[var(--coastal)]"
      aria-hidden={false}
    >
      <LottiePlayerWrapper
        animationData={animation}
        style={{ width: 200, height: 200 }}
        autoplay
        loop
        ariaLabel="loading animation"
      />
    </motion.div>
  );
}
