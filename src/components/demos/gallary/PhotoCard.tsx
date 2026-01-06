import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "motion/react";

interface PhotoCardProps extends HTMLMotionProps<"div"> {
  name: string;
  region: string;
  imageSrc: string;
}

export function PhotoCard({
  name,
  region,
  imageSrc,
  className,
  ...props
}: PhotoCardProps) {
  return (
    <motion.div
      className={cn(
        "group relative shrink-0 cursor-pointer",
        "w-[300px]",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      {...props}
    >
      <div className="h-full w-full overflow-hidden">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <img
            src={imageSrc}
            alt={`${name} from ${region}`}
            className="h-full w-full object-cover object-center"
          />
        </motion.div>
      </div>
      <motion.div
        className="mt-4 flex justify-between text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="font-medium uppercase">{name}</span>
        <span className="text-gray-600 dark:text-gray-400">{region}</span>
      </motion.div>
    </motion.div>
  );
};
