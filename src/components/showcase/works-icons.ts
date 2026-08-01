/**
 * @purpose 作品集条目的 App / 品牌图标静态导入
 * @role    被 works-data 引用,挂到每条 Work.icon;资源在 src/assets/works/icons/
 * @deps    Vite/Astro 静态资源导入
 * @gotcha  图标从各项目源码或品牌素材拷入本目录(不走 R2——小图标本地更合适);换图标直接替换同名文件。
 */

import flowm from "@/assets/works/icons/flowm.png";
import immersed from "@/assets/works/icons/immersed.png";
import grove from "@/assets/works/icons/grove.png";
import journalTodo from "@/assets/works/icons/journal-todo.png";
import supplysmart from "@/assets/works/icons/supplysmart.png";
import limitless320 from "@/assets/works/icons/limitless-320.png";

export const WORK_ICONS = {
  flowm,
  immersed,
  grove,
  "journal-todo": journalTodo,
  supplysmart,
  "limitless-320": limitless320,
} as const;

export type WorkIconKey = keyof typeof WORK_ICONS;
