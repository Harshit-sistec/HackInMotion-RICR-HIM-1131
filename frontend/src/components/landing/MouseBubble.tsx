import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';

export function MouseBubble() {
  const [enabled, setEnabled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Position motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for delayed catching up physics
  const springX = useSpring(mouseX, { stiffness: 220, damping: 26, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 220, damping: 26, mass: 0.5 });

  useEffect(() => {
    // Disable on touch devices and small viewports
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    const isDesktop = window.innerWidth >= 1024;

    if (isTouch || !isDesktop) {
      setEnabled(false);
      return;
    }

    setEnabled(true);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Detect when hovering over interactive items
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const isInteractive = target.closest(
        'button, a, [role="button"], input, select, textarea, .interactive-card, [data-interactive="true"]',
      );
      setIsHovered(!!isInteractive);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
    };
  }, [mouseX, mouseY, isVisible]);

  if (!enabled) return null;

  const outerSize = isHovered ? 76 : 64;
  const dotSize = isHovered ? 9 : 7;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Subtle Ambient Radial Light (100px radius) following cursor */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              x: springX,
              y: springY,
              position: 'fixed',
              left: 0,
              top: 0,
              width: 200,
              height: 200,
              translateX: '-50%',
              translateY: '-50%',
              background: 'radial-gradient(circle 100px at center, rgba(37, 99, 235, 0.035) 0%, transparent 70%)',
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          />

          {/* Outer Bubble Circle with spring animations */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: outerSize,
              height: outerSize,
              backgroundColor: isHovered ? 'rgba(37, 99, 235, 0.05)' : 'rgba(37, 99, 235, 0.025)',
              borderColor: isHovered ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.18)',
              boxShadow: isHovered ? '0 0 20px rgba(37, 99, 235, 0.12)' : '0 0 0px rgba(37, 99, 235, 0)',
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 24,
              opacity: { duration: 0.25 },
            }}
            style={{
              x: springX,
              y: springY,
              position: 'fixed',
              left: 0,
              top: 0,
              translateX: '-50%',
              translateY: '-50%',
              borderRadius: '50%',
              borderWidth: '1px',
              borderStyle: 'solid',
              pointerEvents: 'none',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Center glowing dot */}
            <motion.div
              animate={{
                width: dotSize,
                height: dotSize,
                boxShadow: isHovered ? '0 0 16px rgba(37, 99, 235, 0.45)' : '0 0 12px rgba(37, 99, 235, 0.30)',
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
              }}
              style={{
                borderRadius: '50%',
                backgroundColor: '#2563EB',
                pointerEvents: 'none',
              }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
