import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function AnimatedBackground() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll();

  const orb1Y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const orb2Y = useTransform(scrollYProgress, [0, 1], ['0%', '-15%']);
  const meshOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.9, 0.7, 0.85]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => {
      mq.removeEventListener('change', onChange);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion || isMobile) return;

    const handleMove = (e: MouseEvent) => {
      if (!cursorRef.current) return;
      cursorRef.current.style.transform = `translate(${e.clientX - 200}px, ${e.clientY - 200}px)`;
    };

    const handleMouseDown = () => {
      if (!cursorRef.current) return;
      cursorRef.current.style.scale = '1.3';
      cursorRef.current.style.opacity = '0.14';
    };

    const handleMouseUp = () => {
      if (!cursorRef.current) return;
      cursorRef.current.style.scale = '1.0';
      cursorRef.current.style.opacity = '0.08';
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [reducedMotion, isMobile]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-975" />

      <motion.div className="absolute inset-0" style={{ opacity: reducedMotion ? 0.85 : meshOpacity }}>
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 15% 15%, rgba(99, 102, 241, 0.22) 0px, transparent 50%),
              radial-gradient(at 85% 10%, rgba(139, 92, 246, 0.18) 0px, transparent 50%),
              radial-gradient(at 50% 80%, rgba(34, 211, 238, 0.14) 0px, transparent 50%),
              radial-gradient(at 10% 90%, rgba(236, 72, 153, 0.1) 0px, transparent 50%),
              radial-gradient(at 70% 60%, rgba(52, 211, 153, 0.08) 0px, transparent 45%)
            `,
          }}
        />
      </motion.div>

      {!reducedMotion && (
        <>
          <motion.div
            style={{ y: orb1Y }}
            className={`absolute left-[8%] top-[6%] h-[420px] w-[420px] rounded-full opacity-30 blur-[100px] ${!isMobile ? 'animate-float' : ''}`}
          >
            <div className="h-full w-full rounded-full bg-gradient-to-br from-primary-500 to-violet-600" />
          </motion.div>
          <motion.div
            style={{ y: orb2Y }}
            className={`absolute right-[10%] top-[18%] h-[360px] w-[360px] rounded-full opacity-25 blur-[100px] ${!isMobile ? 'animate-float' : ''}`}
          >
            <div
              className="h-full w-full rounded-full bg-gradient-to-br from-violet-500 to-pink-500"
              style={{ animationDelay: '2s' }}
            />
          </motion.div>
          <div
            className={`absolute bottom-[12%] left-[35%] h-[320px] w-[320px] rounded-full opacity-20 blur-[100px] ${!isMobile ? 'animate-float' : ''}`}
            style={{ background: 'radial-gradient(circle, #22D3EE, #34D399, transparent 70%)', animationDelay: '4s' }}
          />
        </>
      )}

      <div className="absolute inset-0 bg-grid-fine opacity-30" />

      {!reducedMotion && !isMobile && <Particles />}

      {!reducedMotion && !isMobile && (
        <div
          ref={cursorRef}
          className="absolute h-[400px] w-[400px] rounded-full opacity-[0.08] blur-[80px] transition-[transform,scale,opacity] duration-300 ease-out will-change-transform"
          style={{ background: 'radial-gradient(circle, #8B5CF6, #6366F1, transparent 60%)' }}
        />
      )}
    </div>
  );
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  origVx: number;
  origVy: number;
  r: number;
  c: string;
}

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let particles: Particle[] = [];
    const mouse = { x: -1000, y: -1000, active: false };

    const colors = ['#6366F1', '#8B5CF6', '#22D3EE', '#EC4899', '#34D399'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(45, Math.floor((canvas.width * canvas.height) / 35000));
      particles = Array.from({ length: count }, () => {
        const vx = (Math.random() - 0.5) * 0.25;
        const vy = (Math.random() - 0.5) * 0.25;
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx,
          vy,
          origVx: vx,
          origVy: vy,
          r: Math.random() * 1.5 + 0.6,
          c: colors[Math.floor(Math.random() * colors.length)],
        };
      });
    };
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw constellation lines between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = '#8B5CF6';
            ctx.globalAlpha = ((110 - dist) / 110) * 0.08;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Update and draw particles
      particles.forEach((p) => {
        // Mouse interaction
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 180) {
            const force = (180 - dist) / 180;
            p.vx += (dx / dist) * force * 0.04;
            p.vy += (dy / dist) * force * 0.04;

            // Draw line to mouse
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = p.c;
            ctx.globalAlpha = ((180 - dist) / 180) * 0.09;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }

        // Return toward base velocity gradually (decay force)
        p.vx += (p.origVx - p.vx) * 0.025;
        p.vy += (p.origVy - p.vy) * 0.025;

        // Move particle
        p.x += p.vx;
        p.y += p.vy;

        // Bounce walls
        if (p.x < 0 || p.x > canvas.width) {
          p.vx *= -1;
          p.origVx *= -1;
        }
        if (p.y < 0 || p.y > canvas.height) {
          p.vy *= -1;
          p.origVy *= -1;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.45;
        ctx.fill();
      });

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}
