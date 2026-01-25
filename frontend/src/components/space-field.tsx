"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  phase: number;
}

export default function SpaceField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particlesRef.current = [];
      const count = Math.floor((canvas.width * canvas.height) / 18000);

      for (let i = 0; i < count; i += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particlesRef.current.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: Math.random() * 1.8 + 0.5,
          opacity: Math.random() * 0.35 + 0.1,
          speedX: (Math.random() - 0.5) * 0.08,
          speedY: (Math.random() - 0.5) * 0.06,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;
      const interactionRadius = 150;

      for (const particle of particlesRef.current) {
        particle.baseX += particle.speedX;
        particle.baseY += particle.speedY;

        if (particle.baseX < -20) particle.baseX = canvas.width + 20;
        if (particle.baseX > canvas.width + 20) particle.baseX = -20;
        if (particle.baseY < -20) particle.baseY = canvas.height + 20;
        if (particle.baseY > canvas.height + 20) particle.baseY = -20;

        const breathX = Math.sin(time + particle.phase) * 8;
        const breathY = Math.cos(time * 0.7 + particle.phase) * 6;

        let targetX = particle.baseX + breathX;
        let targetY = particle.baseY + breathY;

        const dx = targetX - mouse.x;
        const dy = targetY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < interactionRadius && dist > 0) {
          const force = (1 - dist / interactionRadius) * 30;
          const angle = Math.atan2(dy, dx);
          targetX += Math.cos(angle) * force;
          targetY += Math.sin(angle) * force;
        }

        particle.x += (targetX - particle.x) * 0.08;
        particle.y += (targetY - particle.y) * 0.08;

        let drawOpacity = particle.opacity;
        if (dist < interactionRadius * 1.5) {
          const brightnessFactor =
            1 + (1 - dist / (interactionRadius * 1.5)) * 0.8;
          drawOpacity = Math.min(particle.opacity * brightnessFactor, 0.7);
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 204, ${drawOpacity})`;
        ctx.fill();

        if (particle.size > 1.2 && drawOpacity > 0.25) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 255, 204, ${drawOpacity * 0.15})`;
          ctx.fill();
        }
      }

      animationId = window.requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
