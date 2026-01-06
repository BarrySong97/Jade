"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useSpring, AnimatePresence } from "motion/react";
import { IconMouse } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ImageItem {
  name: string;
  description: string;
  imageSrc: string;
}

const defaultImages: ImageItem[] = [
  {
    name: "Mountain View",
    description: "Nature",
    imageSrc: "https://picsum.photos/seed/gallery1/800/1200",
  },
  {
    name: "City Lights",
    description: "Urban",
    imageSrc: "https://picsum.photos/seed/gallery2/800/1200",
  },
  {
    name: "Ocean Waves",
    description: "Sea",
    imageSrc: "https://picsum.photos/seed/gallery3/800/1200",
  },
  {
    name: "Forest Path",
    description: "Woods",
    imageSrc: "https://picsum.photos/seed/gallery4/800/1200",
  },
  {
    name: "Desert Dunes",
    description: "Desert",
    imageSrc: "https://picsum.photos/seed/gallery5/800/1200",
  },
];

interface ImageCardProps {
  name: string;
  description: string;
  imageSrc: string;
  className?: string;
}

function ImageCard({ name, description, imageSrc, className }: ImageCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative shrink-0 cursor-pointer",
        "w-[280px]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="h-full w-full overflow-hidden rounded-lg">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img
            src={imageSrc}
            alt={`${name}`}
            className="h-[360px] w-full object-cover object-center"
          />
        </motion.div>
      </div>
      <motion.div
        className="mt-3 flex justify-between text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground">{description}</span>
      </motion.div>
    </motion.div>
  );
}

interface ImageGallerySectionProps {
  images?: ImageItem[];
  title?: string;
  subtitle?: string;
}

export default function ImageGallerySection({
  images = defaultImages,
  title = "图片集",
  subtitle = "记录生活中的美好瞬间",
}: ImageGallerySectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const x = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const imageWidth = 280;
  const imageGap = 24;
  const singleImageOffset = imageWidth + imageGap;
  const maxOffset = -(images.length - 1) * singleImageOffset;

  useEffect(() => {
    const unsubscribe = x.onChange((latest) => {
      setShowScrollHint(latest > maxOffset + 100);
    });
    return () => unsubscribe();
  }, [x, maxOffset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let accumulatedDelta = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      accumulatedDelta += e.deltaY;

      if (Math.abs(accumulatedDelta) > 80) {
        if (accumulatedDelta > 0) {
          x.set(Math.max(x.get() - singleImageOffset, maxOffset));
        } else {
          x.set(Math.min(x.get() + singleImageOffset, 0));
        }
        accumulatedDelta = 0;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [images.length, x, singleImageOffset, maxOffset]);

  return (
    <section className="px-10 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        <AnimatePresence>
          {showScrollHint && images.length > 2 && (
            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <span>滚动查看更多</span>
              <IconMouse className="h-4 w-4 " />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div ref={containerRef} className="relative h-[420px] overflow-hidden">
        <div className="flex h-full w-full items-center">
          <motion.div className="flex gap-6" style={{ x }}>
            {images.map((image, index) => (
              <div
                key={index}
                className="flex-shrink-0"
                style={{ width: `${imageWidth}px` }}
              >
                <ImageCard
                  name={image.name}
                  description={image.description}
                  imageSrc={image.imageSrc}
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
