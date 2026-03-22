/**
 * SpeechBubble React Component
 *
 * React component for displaying speech bubbles in the UI.
 * Uses framer-motion for animations.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

export interface SpeechBubbleProps {
  text: string;
  isVisible: boolean;
  position?: 'top' | 'left' | 'right' | 'bottom';
  onClose?: () => void;
  duration?: number;
  className?: string;
  agentName?: string;
  variant?: 'default' | 'thinking' | 'speaking' | 'working';
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  isVisible,
  position = 'top',
  onClose,
  duration = 3000,
  className,
  agentName,
  variant = 'default',
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Typewriter effect when text changes
  useEffect(() => {
    if (!isVisible) {
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let index = 0;

    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsTyping(false);
        clearInterval(typeInterval);
      }
    }, 30);

    return () => clearInterval(typeInterval);
  }, [text, isVisible]);

  // Auto-close after duration
  useEffect(() => {
    if (isVisible && duration > 0 && !isTyping) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, isTyping, onClose]);

  const variantStyles = {
    default: 'bg-white border-gray-300 text-gray-800',
    thinking: 'bg-purple-50 border-purple-300 text-purple-800',
    speaking: 'bg-blue-50 border-blue-300 text-blue-800',
    working: 'bg-green-50 border-green-300 text-green-800',
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  };

  const tailStyles = {
    top: 'bottom-[-8px] left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-white',
    left: 'right-[-8px] top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-l-[8px] border-t-transparent border-b-transparent border-l-white',
    right: 'left-[-8px] top-1/2 -translate-y-1/2 border-t-[8px] border-b-[8px] border-r-[8px] border-t-transparent border-b-transparent border-r-white',
    bottom: 'top-[-8px] left-1/2 -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[8px] border-l-transparent border-r-transparent border-b-white',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30,
          }}
          className={clsx(
            'absolute z-50 max-w-[200px] rounded-lg border-2 p-3 shadow-lg',
            variantStyles[variant],
            positionStyles[position],
            className
          )}
        >
          {/* Agent name label */}
          {agentName && (
            <div className="mb-1 text-xs font-bold opacity-70">
              {agentName}
            </div>
          )}

          {/* Speech content */}
          <div className="relative">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {displayedText}
              {isTyping && (
                <span className="inline-block w-2 animate-pulse">▊</span>
              )}
            </p>

            {/* Close button */}
            {onClose && !isTyping && (
              <button
                onClick={onClose}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                aria-label="Close speech bubble"
              >
                ×
              </button>
            )}
          </div>

          {/* Tail */}
          <div
            className={clsx(
              'absolute h-0 w-0',
              tailStyles[position],
              variant === 'thinking' && 'border-t-purple-50',
              variant === 'speaking' && 'border-t-blue-50',
              variant === 'working' && 'border-t-green-50'
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SpeechBubble;
