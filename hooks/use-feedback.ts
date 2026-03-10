"use client";

import { useState, useEffect } from "react";

export function useFeedback() {
  const [showFifthUseCard, setShowFifthUseCard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/feedback/status");
        if (res.ok) {
          const data = await res.json();
          setShowFifthUseCard(data.showFifthUseCard);
        }
      } catch {
        // Silently fail — feedback is non-critical
      } finally {
        setChecked(true);
      }
    }
    check();
  }, []);

  return { showFifthUseCard, checked };
}
