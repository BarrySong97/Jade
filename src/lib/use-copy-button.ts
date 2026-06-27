/**
 * @purpose React Hook：管理复制按钮的「已复制」状态，1.5 秒后自动复位
 * @role    被代码块/复制类 React 组件调用，返回 checked 状态与点击处理函数
 * @deps    react（useState/useCallback）
 * @gotcha  复制中（checked 为 true）会忽略重复点击；实际写剪贴板逻辑由 onCopy 回调外部实现；详见 docs/modules/lib/README.md
 */

import { useCallback, useState } from "react";

export function useCopyButton(onCopy?: () => void): [boolean, () => void] {
  const [checked, setChecked] = useState(false);

  const onClick = useCallback(() => {
    if (checked) return;

    onCopy?.();
    setChecked(true);

    setTimeout(() => {
      setChecked(false);
    }, 1500);
  }, [checked, onCopy]);

  return [checked, onClick];
}
