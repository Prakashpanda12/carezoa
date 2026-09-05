"use client";

import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

/**
 * Bottom sheet that lives inside the phone shell (absolute, not fixed).
 * Drag down past 120px to dismiss.
 */
export default function AppSheet({
  open,
  onClose,
  title,
  children,
  full = false,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  full?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 z-40 bg-ink/45 backdrop-blur-[2px]"
          />
          <motion.div
            key="sheet"
            initial={{ y: "104%" }}
            animate={{ y: 0 }}
            exit={{ y: "104%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            className={clsx(
              "absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-[30px] bg-paper shadow-2xl",
              full ? "top-12" : "max-h-[88%]",
            )}
          >
            <div className="grid place-items-center pt-2.5 pb-1">
              <div className="h-1.25 w-10 rounded-full bg-ink/15" />
            </div>
            {title !== undefined && (
              <div className="flex items-center justify-between px-5 pt-1 pb-3">
                <h2 className="font-display text-[22px] text-ink italic">{title}</h2>
                <button
                  onClick={onClose}
                  className="grid size-8 place-items-center rounded-full bg-ink/[0.06] text-ink-soft transition hover:bg-ink/10"
                  aria-label="Close"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            )}
            <div className="app-scroll min-h-0 flex-1 overflow-y-auto px-5 pb-8">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
