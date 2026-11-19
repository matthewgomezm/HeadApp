"use client";

import { MotionConfig, motion } from "motion/react";

/**
 * A short "it worked" moment after the big button: a check draws itself next
 * to the message, once (~0.4 s), then the parent removes it. Nothing loops,
 * and with iPhone's Reduce Motion on it simply appears.
 */
export function LoggedCheck({ message }: { message: string }) {
  return (
    <MotionConfig reducedMotion="user">
      <motion.p
        role="status"
        aria-live="polite"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex items-center justify-center gap-2 text-dusk-accent"
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className="size-5 shrink-0">
          <motion.path
            d="M3.5 8.5 6.5 11.5 12.5 4.5"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
        <span>{message}</span>
      </motion.p>
    </MotionConfig>
  );
}
