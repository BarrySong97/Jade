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
