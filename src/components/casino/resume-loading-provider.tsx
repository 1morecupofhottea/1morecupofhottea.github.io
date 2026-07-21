"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ResumeLoadingContextValue {
  visible: boolean;
  trigger: () => void;
}

const ResumeLoadingContext = createContext<ResumeLoadingContextValue>({
  visible: false,
  trigger: () => {},
});

const DISPLAY_MS = 2000;

/**
 * Drives the brief "bouncing suits" loading flash shown when a Resume link
 * is clicked (see LoadingIndicator / ResumeLoadingOverlay). The PDF opens in
 * a new tab regardless — this is a deliberate visual moment on the
 * originating page, not a real navigation blocker.
 */
export function ResumeLoadingProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  const trigger = useCallback(() => {
    setVisible(true);
    setTimeout(() => setVisible(false), DISPLAY_MS);
  }, []);

  return (
    <ResumeLoadingContext.Provider value={{ visible, trigger }}>
      {children}
    </ResumeLoadingContext.Provider>
  );
}

export function useResumeLoading() {
  return useContext(ResumeLoadingContext);
}
