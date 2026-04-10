'use client';

import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
  isVisible: boolean;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const stylesByType: Record<NonNullable<ToastProps['type']>, string> = {
  success: 'border-emerald-300 bg-emerald-50/95 text-emerald-900',
  info: 'border-blue-300 bg-blue-50/95 text-blue-900',
  warning: 'border-amber-300 bg-amber-50/95 text-amber-900',
  error: 'border-rose-300 bg-rose-50/95 text-rose-900'
};

export default function Toast({
  message,
  type = 'info',
  duration = 5000,
  isVisible,
  onClose,
  action
}: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    setIsShowing(true);
    const timer = setTimeout(() => {
      setIsShowing(false);
      setTimeout(onClose, 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed right-4 top-4 z-50 max-w-[520px] transform transition-all duration-300 ${
        isShowing ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      role="status"
      aria-live="polite"
    >
      <div className={`rounded-xl border p-4 shadow-lg shadow-slate-900/10 backdrop-blur-sm ${stylesByType[type]}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium leading-relaxed">{message}</p>
            {action ? (
              <button
                onClick={action.onClick}
                className="mt-2 text-xs font-semibold underline decoration-1 underline-offset-2 hover:no-underline"
              >
                {action.label}
              </button>
            ) : null}
          </div>

          <button
            onClick={() => {
              setIsShowing(false);
              setTimeout(onClose, 200);
            }}
            className="rounded-lg border border-current/25 px-2 py-1 text-xs font-medium hover:bg-white/40"
            aria-label="Close notification"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
