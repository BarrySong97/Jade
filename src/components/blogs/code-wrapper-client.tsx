"use client";
import { CodeBlock as CodeBlockComponent } from "./codeblock";
import { useEffect, useRef, useState } from "react";

interface CodeBlockWrapperProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  language?: string;
}

export function CodeBlockWrapper({
  children,
  className,
  style,
  language,
}: CodeBlockWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 如果还没有 mounted，先显示原始内容
  if (!mounted) {
    return (
      <pre className={className} style={style}>
        {children}
      </pre>
    );
  }

  return (
    <CodeBlockComponent className="my-6" title={language}>
      <div ref={contentRef} style={{ display: "none" }}>
        {children}
      </div>
      <pre className={`${className} p-2`} style={style}>
        {children}
      </pre>
    </CodeBlockComponent>
  );
}
