import React from "react";
import Marquee from "react-fast-marquee";

const galleryImages = [
  "https://picsum.photos/seed/demo1/800/450",
  "https://picsum.photos/seed/demo2/800/450",
  "https://picsum.photos/seed/demo3/800/450",
  "https://picsum.photos/seed/demo4/800/450",
  "https://picsum.photos/seed/demo5/800/450",
];

const numImages = 20;
const allImages = Array.from({ length: numImages }).map(
  (_, i) => galleryImages[i % galleryImages.length]
);

const row1Images = allImages.slice(0, Math.ceil(numImages / 3));
const row2Images = allImages.slice(
  Math.ceil(numImages / 3),
  Math.ceil(numImages / 3) * 2
);
const row3Images = allImages.slice(Math.ceil(numImages / 3) * 2);

interface ImageCardProps {
  src: string;
  alt: string;
  sizeClass: string;
}

function ImageCard({ src, alt, sizeClass }: ImageCardProps) {
  return (
    <div
      className={`relative mx-2 flex-shrink-0 overflow-hidden border border-white/10 bg-gray-900 shadow-xl ${sizeClass}`}
    >
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
      />
    </div>
  );
}

export default function MarqueeDemoPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gradient-to-b from-black via-black to-gray-900 py-20">
      <div className="container mx-auto flex flex-col gap-8 px-4 lg:flex-row">
        <div className="flex w-full items-center text-left lg:w-1/3">
          <h1 className="text-4xl font-bold text-white md:text-5xl lg:text-6xl">
            Launch with ease using stunning, ready-to-use themes & sections
            designed for every need.
          </h1>
        </div>
        <div className="w-full lg:w-2/3">
          <div className="flex flex-col gap-4 gap-y-2">
            <Marquee
              gradientColor="#000"
              gradient={true}
              speed={30}
              pauseOnHover
            >
              {row1Images.map((src, index) => (
                <ImageCard
                  key={`row1-${index}`}
                  src={src}
                  alt={`Row 1 Image ${index + 1}`}
                  sizeClass="aspect-video w-80"
                />
              ))}
            </Marquee>

            <Marquee
              gradient={true}
              gradientColor="#000"
              speed={40}
              pauseOnHover
              direction="right"
            >
              {row2Images.map((src, index) => (
                <ImageCard
                  key={`row2-${index}`}
                  src={src}
                  alt={`Row 2 Image ${index + 1}`}
                  sizeClass="aspect-video w-72"
                />
              ))}
            </Marquee>

            <Marquee
              gradientColor="#000"
              gradient={true}
              speed={35}
              pauseOnHover
            >
              {row3Images.map((src, index) => (
                <ImageCard
                  key={`row3-${index}`}
                  src={src}
                  alt={`Row 3 Image ${index + 1}`}
                  sizeClass="aspect-video w-64"
                />
              ))}
            </Marquee>
          </div>
        </div>
      </div>
    </div>
  );
}
