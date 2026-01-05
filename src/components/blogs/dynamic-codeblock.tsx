"use client";
import { CodeBlock, Pre } from "./codeblock";
import { cn } from "@/lib/utils";

const components = {
  pre(props: React.HTMLAttributes<HTMLPreElement>) {
    return (
      <CodeBlock {...props} className={cn("my-0", props.className)}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    );
  },
};

export function DynamicCodeBlock({
  lang,
  code,
  filename,
  className,
}: {
  lang?: string;
  code: string;
  filename?: string;
  className?: string;
}) {
  const componentsWithTitle = {
    pre(props: React.HTMLAttributes<HTMLPreElement>) {
      return (
        <CodeBlock
          {...props}
          className={cn("my-0", props.className)}
          title={filename}
        >
          <Pre>{props.children}</Pre>
        </CodeBlock>
      );
    },
  };

  // 在 Astro 中，代码高亮由 Shiki 在构建时处理
  // 这个组件主要用于包装已经高亮的代码
  const Component = filename ? componentsWithTitle.pre : components.pre;

  return (
    <Component className={className}>
      <code className={lang ? `language-${lang}` : undefined}>{code}</code>
    </Component>
  );
}
