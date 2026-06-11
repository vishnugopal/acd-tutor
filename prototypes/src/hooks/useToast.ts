import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastState {
  /** Current toast content (simple text; <b>…</b> spans allowed) or null. */
  toast: string | null;
  showToast: (html: string, durationMs?: number) => void;
}

export function useToast(): ToastState {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = useCallback((html: string, durationMs = 2400) => {
    setToast(html);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  return { toast, showToast };
}
