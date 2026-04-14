"use client";

import { useCallback, useEffect, useState } from "react";

interface UseInViewOptions {
  amount?: number;
  once?: boolean;
  enabled?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>({
  amount = 0.2,
  once = true,
  enabled = true,
}: UseInViewOptions = {}) {
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useCallback((element: T | null) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!enabled || !node) return;

    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => {
        setInView(true);
      });

      return () => {
        cancelAnimationFrame(frame);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);

          if (once) {
            observer.disconnect();
          }

          return;
        }

        if (!once) {
          setInView(false);
        }
      },
      { threshold: amount }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [amount, enabled, node, once]);

  return { ref, inView };
}
