"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseResizableOptions {
  defaultWidth: number;
  minWidth: number;
  maxWidth: number;
  storageKey?: string;
  side: "left" | "right";
}

export function useResizable({
  defaultWidth,
  minWidth,
  maxWidth,
  storageKey,
  side,
}: UseResizableOptions) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined" && storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) return Math.max(minWidth, Math.min(maxWidth, parseInt(stored, 10)));
    }
    return defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
    },
    [width]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = side === "left"
        ? e.clientX - startXRef.current
        : startXRef.current - e.clientX;

      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidthRef.current + diff));
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (storageKey) {
        localStorage.setItem(storageKey, width.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, side, storageKey, width]);

  // Save to localStorage when width changes
  useEffect(() => {
    if (storageKey && !isResizing) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey, isResizing]);

  return {
    width,
    setWidth,
    isResizing,
    handleMouseDown,
  };
}
