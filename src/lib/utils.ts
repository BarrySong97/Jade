/**
 * @purpose 提供 cn() 工具函数，合并并去重 Tailwind class 名
 * @role    全站通用工具，被几乎所有 UI/业务组件 import 用于条件拼接 className
 * @deps    clsx、tailwind-merge
 * @gotcha  全站基础依赖，签名变动影响面极大；详见 docs/modules/lib/README.md
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
