import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Exercise } from '../types';
import VideoPlayer from './VideoPlayer';

interface VideoPreviewModalProps {
  exercise: Exercise | null;
  onClose: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ exercise, onClose }) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    handleClose();
  }, [handleClose]);

  if (!exercise) return null;

  return (
    <AnimatePresence mode="wait">
      {exercise && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.2
            }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[95vw] md:max-w-3xl md:max-h-[90vh] z-50 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`video-title-${exercise.id}`}
          >
            <div className="w-full bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Video Container */}
              <div className="relative w-full aspect-video bg-black" role="region" aria-label="Exercise video preview">
                <VideoPlayer
                  videoUrl={exercise.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay
                  controls
                />

                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/70 transition-all z-10"
                  aria-label="Close video preview"
                >
                  <X size={20} className="text-white" />
                </button>

                {/* Exercise name overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                  <h2 id={`video-title-${exercise.id}`} className="text-white font-bold text-lg">{exercise.name}</h2>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default VideoPreviewModal;