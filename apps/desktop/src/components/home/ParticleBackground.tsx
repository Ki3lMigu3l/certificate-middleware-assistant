import { useEffect, useRef } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────
type Dot = {
  ox: number;
  oy: number; // resting / origin position
  x: number;
  y: number; // current position
  vx: number;
  vy: number; // velocity
  r: number; // radius
};

// ─── Component ─────────────────────────────────────────────────────────────────
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let alive = true;
    let animId = 0;

    const mouse = { x: -9999, y: -9999 };

    // ── Physics constants ──────────────────────────────────────────────────────
    const REPEL_RADIUS = 150;
    const REPEL_FORCE = 8;
    const SPRING = 0.045;
    const FRICTION = 0.84;
    const LINK_DIST = 100;

    let dots: Dot[] = [];

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const populate = () => {
      const count = Math.max(
        100,
        Math.floor((canvas.width * canvas.height) / 10_000),
      );
      dots = Array.from({ length: count }, () => {
        const ox = Math.random() * canvas.width;
        const oy = Math.random() * canvas.height;
        return {
          ox,
          oy,
          x: ox,
          y: oy,
          vx: 0,
          vy: 0,
          r: Math.random() * 1.6 + 0.4,
        };
      });
    };

    setCanvasSize();
    populate();

    // ── Event listeners ────────────────────────────────────────────────────────
    const onMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    const onResize = () => {
      setCanvasSize();
      populate();
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    window.addEventListener("resize", onResize);

    // ── Animation loop ─────────────────────────────────────────────────────────
    const tick = () => {
      if (!alive) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Physics update
      for (const d of dots) {
        const dx = mouse.x - d.x;
        const dy = mouse.y - d.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < REPEL_RADIUS) {
          const f = ((REPEL_RADIUS - dist) / REPEL_RADIUS) * REPEL_FORCE;
          d.vx -= (dx / dist) * f;
          d.vy -= (dy / dist) * f;
        }

        d.vx += (d.ox - d.x) * SPRING;
        d.vy += (d.oy - d.y) * SPRING;
        d.vx *= FRICTION;
        d.vy *= FRICTION;
        d.x += d.vx;
        d.y += d.vy;
      }

      // Draw connection lines (below dots)
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[j].x - dots[i].x;
          const dy = dots[j].y - dots[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < LINK_DIST) {
            const alpha = (1 - dist / LINK_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.strokeStyle = `rgba(150,150,165,${alpha.toFixed(3)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw dots
      ctx.fillStyle = "rgba(155,155,168,0.45)";
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(tick);
    };

    tick();

    // ── Cleanup ────────────────────────────────────────────────────────────────
    return () => {
      alive = false;
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      style={{ zIndex: -1 }}
    />
  );
}
