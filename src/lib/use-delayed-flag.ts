import { useEffect, useState } from 'react';

/**
 * Returns true only after `flag` has been true for `delayMs`. If `flag` flips
 * back to false before the delay elapses, the returned value never becomes
 * true — which means fast loads don't flash a skeleton.
 */
export function useDelayedFlag(flag: boolean, delayMs = 150): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!flag) {
      setShown(false);
      return;
    }
    const t = setTimeout(() => setShown(true), delayMs);
    return () => clearTimeout(t);
  }, [flag, delayMs]);
  return shown;
}
