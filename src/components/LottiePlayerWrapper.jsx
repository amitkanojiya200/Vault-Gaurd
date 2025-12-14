// src/components/LottiePlayerWrapper.jsx
import React from "react";
import Lottie from "lottie-react";

export default function LottiePlayerWrapper({
  animationData,
  loop = true,
  autoplay = true,
  style,
  className,
  ariaLabel = "animation",
  ...rest
}) {
  return (
    <div role="img" aria-label={ariaLabel} className={className}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={style}
        {...rest}
      />
    </div>
  );
}
