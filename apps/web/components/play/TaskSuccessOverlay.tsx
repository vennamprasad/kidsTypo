"use client";

import React, { useEffect } from 'react';
import { Trophy, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskSuccessOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
}

export const TaskSuccessOverlay = ({ isVisible, onClose, title }: TaskSuccessOverlayProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-sky-500/20 backdrop-blur-md pointer-events-none"
        >
          <motion.div 
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="bg-white rounded-[60px] p-12 shadow-[0_20px_100px_rgba(0,0,0,0.3)] text-center relative max-w-lg border-[12px] border-amber-400"
          >
            {/* Animated Stars */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-12 -left-12 text-amber-500"
            >
              <Star size={80} fill="currentColor" />
            </motion.div>
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-10 -right-10 text-sky-500"
            >
              <Star size={64} fill="currentColor" />
            </motion.div>

            <div className="w-32 h-32 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Trophy className="w-16 h-16 text-amber-600" />
            </div>

            <h2 className="text-5xl font-black text-sky-900 mb-4 italic leading-tight">
              WELL DONE!
            </h2>
            <p className="text-2xl font-bold text-sky-700 mb-8 uppercase tracking-wide">
              You completed: <br/>
              <span className="text-amber-600 text-3xl font-black italic">&quot;{title}&quot;</span>
            </p>

            <div className="flex gap-4 justify-center">
              <Sparkles className="text-amber-500 animate-pulse" />
              <div className="bg-sky-500 text-white px-8 py-3 rounded-full font-black text-xl shadow-lg animate-bounce">
                +100 POINTS!
              </div>
              <Sparkles className="text-amber-500 animate-pulse" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
