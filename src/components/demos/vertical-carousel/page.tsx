import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

const images = [
  "https://picsum.photos/seed/carousel1/1920/1080",
  "https://picsum.photos/seed/carousel2/1920/1080",
  "https://picsum.photos/seed/carousel3/1920/1080",
  "https://picsum.photos/seed/carousel4/1920/1080",
  "https://picsum.photos/seed/carousel5/1920/1080",
];

export default function VerticalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextIndex, setNextIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        {/* Current/Exiting Image */}
        <motion.div
          key={`exit-${currentIndex}`}
          className="absolute inset-0 z-20"
          initial={{ clipPath: "inset(0 0 0 0)" }}
          animate={{ clipPath: "inset(0 0 0 0)" }}
          exit={{
            clipPath: "inset(0 0 100% 0)",
            transition: {
              duration: 1.5,
              ease: [0.4, 0, 0.2, 1],
            },
          }}
          onAnimationStart={() => setIsTransitioning(true)}
          onAnimationComplete={() => {
            setIsTransitioning(false);
            setNextIndex(null);
          }}
        >
          <img
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </motion.div>

        {/* Next Image (Hidden until transition completes) */}
      </AnimatePresence>
      <div className="absolute inset-0 z-10">
        <img
          src={images[nextIndex ?? (currentIndex + 1) % images.length]}
          alt={`Next Slide ${((currentIndex + 1) % images.length) + 1}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      {/* Navigation dots */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isTransitioning) {
                setCurrentIndex(index);
                setNextIndex(index);
                setIsAutoPlaying(false);
              }
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              currentIndex === index
                ? "bg-white scale-150"
                : "bg-white/50 hover:bg-white/80"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
