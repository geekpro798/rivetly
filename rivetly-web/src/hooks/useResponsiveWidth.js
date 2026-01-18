import { useState, useEffect, useRef } from 'react';

export const useResponsiveWidth = (threshold = 350) => {
  const [isNarrow, setIsNarrow] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        // 当宽度小于阈值（比如 350px）时，判定为极窄模式
        setIsNarrow(entry.contentRect.width < threshold);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [threshold]);

  return { containerRef, isNarrow };
};
