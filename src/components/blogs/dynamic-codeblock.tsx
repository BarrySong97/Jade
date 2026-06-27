/**
 * @purpose 把一段代码字符串包成带语言/文件名的 CodeBlock,用于直接传 code 而非已有 <pre> 的场景
 * @role    上层便捷组件,基于 ./codeblock 的 CodeBlock+Pre 渲染;有 filename 时显示标题栏
 * @deps    ./codeblock、@/lib/utils
 * @gotcha  仅做包装,语法高亮由 Astro 构建期 Shiki 处理而非本组件;详见 docs/modules/components/README.md
 */

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
        <CodeBlock {...props} className={cn("my-0", props.className)} title={filename}>
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
