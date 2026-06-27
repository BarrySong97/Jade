/**
 * @purpose 作品集页右下角固定的三色圆点主题切换器（dark / light / paper）
 * @role    被 works.tsx 渲染，受控组件：theme 来自父级、点击经 onChange 回写父级状态
 * @deps    本目录 works-data(Theme 类型)
 * @gotcha  圆点底色用本文件内置 SWATCH（与真实主题令牌分离，需手动对齐）；选中态边框取 var(--fg)，令牌见 src/styles/showcase.css，参 docs/modules/components/README.md
 */

import { type Theme } from "./works-data";

/* 每个主题对应的色板按钮底色 */
const SWATCH: Record<Theme, string> = {
  dark: "#0c0c0e",
  light: "#fbfbfa",
  paper: "#ece5d8",
};

const THEMES = Object.keys(SWATCH) as Theme[];

export default function ThemeSwitch({
  theme,
  onChange,
}: {
  theme: Theme;
  onChange: (t: Theme) => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex gap-2">
      {THEMES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          title={t}
          aria-label={t}
          className="h-5 w-5 rounded-full border transition"
          style={{
            borderColor: theme === t ? "var(--fg)" : "var(--line)",
            background: SWATCH[t],
          }}
        />
      ))}
    </div>
  );
}
