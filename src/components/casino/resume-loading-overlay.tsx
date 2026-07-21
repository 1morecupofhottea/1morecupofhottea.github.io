"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoadingIndicator } from "@/components/ui/loading-indicator";
import { useResumeLoading } from "@/components/casino/resume-loading-provider";

/** Renders the loading flash triggered by clicking a Resume link. Mounted once in the root layout. */
export function ResumeLoadingOverlay() {
  const { visible } = useResumeLoading();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          aria-hidden="true"
        >
          <LoadingIndicator label="Opening resume..." />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
