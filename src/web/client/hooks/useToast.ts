import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastState {
  toast: string | null;
  showToast: (text: string, durationMs?: number) => void;
}

export function useToast(): ToastState {
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const showToast = useCallback((text: string, durationMs = 2400) => {
    setToast(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), durationMs);
  }, []);

  return { toast, showToast };
}
