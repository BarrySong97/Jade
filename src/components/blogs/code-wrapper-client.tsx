/**
 * @purpose 客户端水合包装器:把 Shiki 高亮后的原始 <pre> 渐进增强为带复制/折叠功能的 CodeBlock
 * @role    博客代码块的 React island 入口,挂载后用 ./codeblock 的 CodeBlock 渲染,语言名作为标题
 * @deps    react hooks、./codeblock
 * @gotcha  mounted 前直接回显原始 <pre> 避免 SSR 闪烁/不匹配;详见 docs/modules/components/README.md
 */

"use client";
import { CodeBlock as CodeBlockComponent } from "./codeblock";
import { useEffect, useRef, useState } from "react";

interface CodeBlockWrapperProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  language?: string;
}

export function CodeBlockWrapper({ children, className, style, language }: CodeBlockWrapperProps) {
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
