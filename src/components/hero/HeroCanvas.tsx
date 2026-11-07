import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';

export interface CanvasNode {
  id: string;
  name: string;
  sub: string;
  color: string;
  glowColor: string;
  baseRelX: number;
  baseRelY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX: number;
  targetY: number;
  phaseX: number;
  phaseY: number;
  pulseEnergy: number;
  mass: number;
  isHovered: boolean;
}

export interface Link {
  source: string;
  target: string;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  color: string;
  opacity: number;
  hitNodeIds: Set<string>;
}

export interface Photon {
  id: number;
  sourceId: string;
  targetId: string;
  progress: number;
  speed: number;
  color: string;
}

const INITIAL_NODES: Omit<CanvasNode, 'x' | 'y' | 'vx' | 'vy' | 'targetX' | 'targetY' | 'pulseEnergy' | 'isHovered'>[] = [
  {
    id: 'c-cpp',
    name: 'C/C++ & OS',
    sub: 'POSIX / Memory',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    baseRelX: 0.44,
    baseRelY: 0.28,
    radius: 48,
    phaseX: 0.2,
    phaseY: 1.4,
    mass: 1.25,
  },
  {
    id: 'linux',
    name: 'Linux/Bash',
    sub: 'Kernel & CLI',
    color: '#FF2A85',
    glowColor: 'rgba(255, 42, 133, 0.5)',
    baseRelX: 0.58,
    baseRelY: 0.25,
    radius: 44,
    phaseX: 2.1,
    phaseY: 0.8,
    mass: 1.05,
  },
  {
    id: 'react-ts',
    name: 'React & TypeScript',
    sub: 'Spatial Web UI',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    baseRelX: 0.44,
    baseRelY: 0.52,
    radius: 48,
    phaseX: 1.5,
    phaseY: 3.2,
    mass: 1.3,
  },
  {
    id: 'gsap',
    name: 'GSAP Motion',
    sub: 'Spatial Inertia',
    color: '#FF2A85',
    glowColor: 'rgba(255, 42, 133, 0.5)',
    baseRelX: 0.58,
    baseRelY: 0.54,
    radius: 44,
    phaseX: 3.4,
    phaseY: 1.9,
    mass: 1.1,
  },
  {
    id: 'node-db',
    name: 'Node & Databases',
    sub: 'Distributed IPC',
    color: '#00F0FF',
    glowColor: 'rgba(0, 240, 255, 0.5)',
    baseRelX: 0.50,
    baseRelY: 0.78,
    radius: 46,
    phaseX: 4.2,
    phaseY: 2.7,
    mass: 1.2,
  },
];

const LINKS: Link[] = [
  { source: 'c-cpp', target: 'linux' },
  { source: 'c-cpp', target: 'react-ts' }, // Systems to Spatial Web Bridge
  { source: 'c-cpp', target: 'node-db' },
  { source: 'linux', target: 'node-db' },
  { source: 'react-ts', target: 'gsap' },
  { source: 'react-ts', target: 'node-db' },
  { source: 'gsap', target: 'node-db' },
];

/**
 * Returns responsive layout coordinates for each domain node.
 * Desktop (>=1024px) concentrates the network in the right 45% (x: 0.60 - 0.90)
 * Tablet (768-1023px) shifts slightly left while maintaining text clearance.
 * Mobile (<768px) arranges an ambient constellation that leaves CTAs accessible.
 */
function getNodeBaseCoords(id: string, width: number): { relX: number; relY: number } {
  if (width >= 1024) {
    if (id === 'c-cpp') return { relX: 0.44, relY: 0.28 };
    if (id === 'linux') return { relX: 0.58, relY: 0.25 };
    if (id === 'react-ts') return { relX: 0.44, relY: 0.52 };
    if (id === 'gsap') return { relX: 0.58, relY: 0.54 };
    if (id === 'node-db') return { relX: 0.50, relY: 0.78 };
  } else if (width >= 768) {
    if (id === 'c-cpp') return { relX: 0.38, relY: 0.28 };
    if (id === 'linux') return { relX: 0.56, relY: 0.25 };
    if (id === 'react-ts') return { relX: 0.40, relY: 0.52 };
    if (id === 'gsap') return { relX: 0.58, relY: 0.54 };
    if (id === 'node-db') return { relX: 0.48, relY: 0.78 };
  } else {
    // Mobile constellation around perimeter
    if (id === 'c-cpp') return { relX: 0.22, relY: 0.24 };
    if (id === 'linux') return { relX: 0.78, relY: 0.22 };
    if (id === 'react-ts') return { relX: 0.22, relY: 0.80 };
    if (id === 'gsap') return { relX: 0.78, relY: 0.78 };
    if (id === 'node-db') return { relX: 0.50, relY: 0.86 };
  }
  return { relX: 0.50, relY: 0.5 };
}

export const HeroCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mutable animation state refs (avoid React re-render thrashing at 60-120 FPS)
  const nodesRef = useRef<CanvasNode[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const photonsRef = useRef<Photon[]>([]);
  const draggedNodeIdRef = useRef<string | null>(null);
  const pointerPosRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const prevPointerPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerDeltaRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const isPointerDownRef = useRef<boolean>(false);
  const pointerStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const photonIdSeqRef = useRef<number>(0);
  const dprRef = useRef<number>(1);
  const sizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const lastAmbientPhotonTimeRef = useRef<number>(0);

  // Initialize nodes
  useEffect(() => {
    nodesRef.current = INITIAL_NODES.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      targetX: 0,
      targetY: 0,
      pulseEnergy: 0,
      isHovered: false,
    }));

    return () => {
      document.body.removeAttribute('data-canvas-mode');
    };
  }, []);

  // Trigger tactile ripple wave
  const triggerRipple = useCallback((x: number, y: number, color = '#DF6C4F', baseImpulse = 4.0) => {
    ripplesRef.current.push({
      x,
      y,
      radius: 5,
      maxRadius: Math.max(sizeRef.current.width, sizeRef.current.height) * 0.55,
      speed: 6.2,
      color,
      opacity: 1.0,
      hitNodeIds: new Set<string>(),
    });

    // Spawn synaptic photons along links
    LINKS.forEach((link) => {
      photonIdSeqRef.current += 1;
      photonsRef.current.push({
        id: photonIdSeqRef.current,
        sourceId: link.source,
        targetId: link.target,
        progress: 0,
        speed: 0.025 + Math.random() * 0.02,
        color,
      });
    });

    // Immediate tactile pop for clicked node or nearby nodes
    nodesRef.current.forEach((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < node.radius + 15) {
        node.pulseEnergy = 1.0;
      } else if (dist < 320) {
        const force = (1 - dist / 320) * (baseImpulse * 0.4);
        node.vx += (dx / dist) * force;
        node.vy += (dy / dist) * force;
        node.pulseEnergy = Math.min(1.0, node.pulseEnergy + 0.6);
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Handle high-DPI scaling and responsive resizing
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;

      const width = Math.max(320, rect.width);
      const height = Math.max(450, rect.height);
      sizeRef.current = { width, height };

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      // Adaptive responsive layout scaling
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const radiusScale = isMobile ? 0.76 : isTablet ? 0.84 : 0.88;

      nodesRef.current.forEach((node) => {
        const initialDef = INITIAL_NODES.find((item) => item.id === node.id);
        const baseRadius = initialDef ? initialDef.radius : 46;
        node.radius = baseRadius * radiusScale;

        const coords = getNodeBaseCoords(node.id, width);

        // Initialize positions if first layout
        if (node.x === 0 && node.y === 0) {
          node.x = width * coords.relX;
          node.y = height * coords.relY;
        }
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);
    updateSize();

    // Trigger initial tactile greeting ripple after slight entrance delay
    const initialTimer = setTimeout(() => {
      const isMobile = sizeRef.current.width < 768;
      const centerX = sizeRef.current.width * (isMobile ? 0.5 : 0.74);
      const centerY = sizeRef.current.height * (isMobile ? 0.45 : 0.46);
      triggerRipple(centerX, centerY, '#DF6C4F', 3.0);
    }, 450);

    // Main 60-120 FPS Frame-rate Independent Physics & Render Loop synchronized via GSAP Ticker
    // Automatically pauses when scrolled completely out of the viewport
    let isVisible = true;
    let isTickerAttached = false;
    let lastTime = performance.now();

    const render = () => {
      if (!isVisible) return;
      const currentTime = performance.now();
      const rawDt = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;
      const time = currentTime * 0.001;

      // Normalize delta-time relative to standard 60 FPS (dt ~ 0.0166s)
      // At 60 FPS step = 1.0; at 120 FPS step = 0.5
      const step = Math.min(rawDt * 60, 2.0);

      const { width, height } = sizeRef.current;
      const isMobile = width < 768;

      ctx.clearRect(0, 0, width, height);

      const nodes = nodesRef.current;
      const nodeMap = new Map<string, CanvasNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      // Ambient synaptic pulse heartbeat (fires every ~1.8s) so canvas stays living & breathing
      if (currentTime - lastAmbientPhotonTimeRef.current > 1800) {
        lastAmbientPhotonTimeRef.current = currentTime;
        const link = LINKS[Math.floor(Math.random() * LINKS.length)];
        photonIdSeqRef.current += 1;
        photonsRef.current.push({
          id: photonIdSeqRef.current,
          sourceId: link.source,
          targetId: link.target,
          progress: 0,
          speed: 0.018 + Math.random() * 0.012,
          color: Math.random() > 0.4 ? '#00F0FF' : '#FF2A85',
        });
      }

      // 1. Calculate Harmonic Equilibrium Targets using unified base coords
      nodes.forEach((node) => {
        const coords = getNodeBaseCoords(node.id, width);

        // Organic orbital drift so nodes stay dynamic & breathing (disabled if prefers-reduced-motion)
        const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const driftAmpX = prefersReducedMotion ? 0 : (isMobile ? 7 : 13);
        const driftAmpY = prefersReducedMotion ? 0 : (isMobile ? 6 : 11);
        node.targetX = width * coords.relX + (prefersReducedMotion ? 0 : Math.sin(time * 0.95 + node.phaseX) * driftAmpX);
        node.targetY = height * coords.relY + (prefersReducedMotion ? 0 : Math.cos(time * 1.15 + node.phaseY) * driftAmpY);
      });

      // 2. Physics: Spring Forces along links (Hooke's Law with damping, step-scaled)
      const restLength = Math.min(width, height) * (isMobile ? 0.32 : 0.28);
      const springK = 0.0035;

      LINKS.forEach(({ source, target }) => {
        const n1 = nodeMap.get(source);
        const n2 = nodeMap.get(target);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.hypot(dx, dy) || 1;
        const diff = dist - restLength;
        const fx = (dx / dist) * diff * springK * step;
        const fy = (dy / dist) * diff * springK * step;

        if (draggedNodeIdRef.current !== n1.id) {
          n1.vx += fx / n1.mass;
          n1.vy += fy / n1.mass;
        }
        if (draggedNodeIdRef.current !== n2.id) {
          n2.vx -= fx / n2.mass;
          n2.vy -= fy / n2.mass;
        }
      });

      // 3. Physics: Mutual node collision & repulsion (Coulomb-like, step-scaled)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = n1.radius + n2.radius + 18;

          if (dist < minDist) {
            const overlap = minDist - dist;
            const force = (overlap / dist) * 0.12 * step;
            if (draggedNodeIdRef.current !== n1.id) {
              n1.vx -= dx * force;
              n1.vy -= dy * force;
            }
            if (draggedNodeIdRef.current !== n2.id) {
              n2.vx += dx * force;
              n2.vy += dy * force;
            }
          }
        }
      }

      // 4. Physics: Target anchor pull & velocity damping (step-scaled)
      const dampingFactor = Math.pow(0.88, step);
      const pullK = 0.024;
      const bottomPad = isMobile ? 180 : 115; // Buffer to prevent clipping into telemetry strip

      nodes.forEach((node) => {
        if (draggedNodeIdRef.current === node.id) {
          // Locked to pointer
          node.x = pointerPosRef.current.x;
          node.y = pointerPosRef.current.y;
          node.vx = 0;
          node.vy = 0;
        } else {
          // Spring pull toward target equilibrium
          node.vx += (node.targetX - node.x) * (pullK * step);
          node.vy += (node.targetY - node.y) * (pullK * step);

          // Fluid velocity damping
          node.vx *= dampingFactor;
          node.vy *= dampingFactor;
          node.x += node.vx * step;
          node.y += node.vy * step;
        }

        // Keep inside bounds (with right boundary protection for HeroPortrait on desktop)
        const pad = node.radius + 12;
        const maxRightBound = width >= 1024 ? width * 0.64 - pad : width - pad;
        node.x = Math.max(pad, Math.min(maxRightBound, node.x));
        node.y = Math.max(pad, Math.min(height - bottomPad, node.y));

        // Pulse energy relaxation
        node.pulseEnergy = Math.max(0, node.pulseEnergy - rawDt * 1.6);
      });

      // 5. Update & Draw Ripples (Shockwave effect with single-hit guarantee)
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const ripple = ripples[i];
        ripple.radius += ripple.speed * step;
        ripple.opacity = Math.max(0, 1 - ripple.radius / ripple.maxRadius);

        // Check shockwave collision with nodes (hits each node exactly once)
        nodes.forEach((node) => {
          const d = Math.hypot(node.x - ripple.x, node.y - ripple.y);
          if (Math.abs(d - ripple.radius) < 24 && !ripple.hitNodeIds.has(node.id)) {
            ripple.hitNodeIds.add(node.id);
            const angle = Math.atan2(node.y - ripple.y, node.x - ripple.x);
            const impulse = (1 - ripple.radius / ripple.maxRadius) * 4.2;
            if (draggedNodeIdRef.current !== node.id) {
              node.vx += Math.cos(angle) * impulse;
              node.vy += Math.sin(angle) * impulse;
            }
            node.pulseEnergy = 1.0;
          }
        });

        // Draw Shockwave Ring
        if (ripple.opacity > 0.01) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
          ctx.lineWidth = 2.0 * ripple.opacity;
          ctx.strokeStyle = ripple.color === '#FF2A85'
            ? `rgba(255, 42, 133, ${ripple.opacity * 0.75})`
            : `rgba(0, 240, 255, ${ripple.opacity * 0.75})`;
          ctx.stroke();

          // Outer secondary faint ripple glow
          ctx.beginPath();
          ctx.arc(ripple.x, ripple.y, Math.max(0, ripple.radius - 8), 0, Math.PI * 2);
          ctx.lineWidth = 1.0 * ripple.opacity;
          ctx.strokeStyle = `rgba(244, 243, 239, ${ripple.opacity * 0.35})`;
          ctx.stroke();
          ctx.restore();
        }

        if (ripple.radius >= ripple.maxRadius || ripple.opacity <= 0.01) {
          ripples.splice(i, 1);
        }
      }

      // 6. Draw Spring Network Links (Highlighting Systems to Spatial Web Bridge)
      LINKS.forEach(({ source, target }) => {
        const n1 = nodeMap.get(source);
        const n2 = nodeMap.get(target);
        if (!n1 || !n2) return;

        const isBridge = (source === 'c-cpp' && target === 'react-ts') || (source === 'react-ts' && target === 'c-cpp');
        const isLinkActive = n1.isHovered || n2.isHovered || n1.pulseEnergy > 0.25 || n2.pulseEnergy > 0.25;
        const maxPulse = Math.max(n1.pulseEnergy, n2.pulseEnergy);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);

        if (isLinkActive) {
          const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
          grad.addColorStop(0, n1.color);
          grad.addColorStop(1, n2.color);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.0 + maxPulse * 2.5;
          ctx.shadowColor = n1.color;
          ctx.shadowBlur = 10 + maxPulse * 15;
          ctx.globalAlpha = 0.6 + maxPulse * 0.4;
        } else if (isBridge) {
          // Special luminous styling for the Systems to Spatial Web bridge
          ctx.strokeStyle = 'rgba(223, 108, 79, 0.4)';
          ctx.lineWidth = 1.6;
          ctx.shadowColor = '#DF6C4F';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.65;
        } else {
          ctx.strokeStyle = 'rgba(244, 243, 239, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.globalAlpha = 0.65;
        }
        ctx.stroke();
        ctx.restore();
      });

      // 7. Update & Draw Synaptic Photons (Data Packets)
      const photons = photonsRef.current;
      for (let i = photons.length - 1; i >= 0; i--) {
        const p = photons[i];
        p.progress += p.speed * step;

        const n1 = nodeMap.get(p.sourceId);
        const n2 = nodeMap.get(p.targetId);

        if (n1 && n2 && p.progress <= 1.0) {
          const curX = n1.x + (n2.x - n1.x) * p.progress;
          const curY = n1.y + (n2.y - n1.y) * p.progress;

          ctx.save();
          ctx.beginPath();
          ctx.arc(curX, curY, 3.2, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.restore();
        }

        if (p.progress >= 1.0) {
          if (n2) {
            n2.pulseEnergy = Math.max(n2.pulseEnergy, 0.65);
          }
          photons.splice(i, 1);
        }
      }

      // 8. Draw Domain Nodes (Tactile Glassmorphic Orbs with Contained Typography)
      nodes.forEach((node) => {
        const isInteracting = node.isHovered || draggedNodeIdRef.current === node.id;
        const totalEnergy = Math.min(1.0, (isInteracting ? 0.7 : 0) + node.pulseEnergy);

        ctx.save();

        // A. Ambient Radial Glow Aura
        const glowRadius = node.radius * (1.6 + totalEnergy * 0.9);
        const auraGrad = ctx.createRadialGradient(node.x, node.y, node.radius * 0.5, node.x, node.y, glowRadius);
        auraGrad.addColorStop(0, node.color === '#FF2A85' ? 'rgba(255, 42, 133, 0.35)' : 'rgba(0, 240, 255, 0.35)');
        auraGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // B. Dark Glass Core Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        const bodyGrad = ctx.createRadialGradient(
          node.x - node.radius * 0.35,
          node.y - node.radius * 0.35,
          node.radius * 0.1,
          node.x,
          node.y,
          node.radius
        );
        bodyGrad.addColorStop(0, isMobile ? 'rgba(26, 26, 26, 0.92)' : 'rgba(22, 22, 22, 0.96)');
        bodyGrad.addColorStop(1, isMobile ? 'rgba(10, 10, 10, 0.88)' : 'rgba(10, 10, 10, 0.94)');
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // C. Neon Border Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.lineWidth = isInteracting ? 2.5 : 1.5;
        ctx.strokeStyle = isInteracting || node.pulseEnergy > 0.2
          ? node.color
          : 'rgba(255, 255, 255, 0.22)';
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isInteracting ? 18 : 6;
        ctx.stroke();

        // D. Top Rim Glass Optical Specular Highlight
        ctx.beginPath();
        ctx.arc(node.x, node.y - node.radius * 0.45, node.radius * 0.4, 0, Math.PI, true);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.stroke();

        // E. Typography: Domain Title & Systems Subtitle (Ensuring all text fits cleanly inside orb)
        ctx.shadowBlur = 0; // Clear blur for razor-sharp text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Split long titles on " & " to guarantee clean containment inside the circle
        const shouldSplitTitle = node.name.length > 12 && node.name.includes(' & ');

        if (shouldSplitTitle) {
          const parts = node.name.split(' & ');
          const titleFontSize = Math.max(8.5, Math.round(node.radius * 0.22));
          ctx.font = `700 ${titleFontSize}px "Space Grotesk", "Syne", sans-serif`;
          ctx.fillStyle = '#FFFFFF';

          // Line 1: e.g. "React &"
          ctx.fillText(`${parts[0]} &`, node.x, node.y - node.radius * 0.25);
          // Line 2: e.g. "TypeScript"
          ctx.fillText(parts[1], node.x, node.y - node.radius * 0.02);
        } else {
          // Single line title
          const titleFontSize = Math.max(9.5, Math.round(node.radius * 0.25));
          ctx.font = `700 ${titleFontSize}px "Space Grotesk", "Syne", sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(node.name, node.x, node.y - node.radius * 0.14);
        }

        // Subtitle (Monospace JetBrains Mono) with automatic font-scaling to prevent truncation
        const maxSubWidth = node.radius * 1.55;
        let subFontSize = Math.max(6.5, Math.round(node.radius * (shouldSplitTitle ? 0.15 : 0.17)));
        ctx.font = `600 ${subFontSize}px "JetBrains Mono", monospace`;
        let measuredSubWidth = ctx.measureText(node.sub).width;
        while (measuredSubWidth > maxSubWidth && subFontSize > 5.5) {
          subFontSize -= 0.5;
          ctx.font = `600 ${subFontSize}px "JetBrains Mono", monospace`;
          measuredSubWidth = ctx.measureText(node.sub).width;
        }
        ctx.fillStyle = node.color;
        ctx.fillText(node.sub, node.x, node.y + (shouldSplitTitle ? node.radius * 0.32 : node.radius * 0.24));

        // F. Tiny Telemetry Dot at node apex
        ctx.beginPath();
        ctx.arc(node.x, node.y - node.radius * 0.62, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isInteracting ? '#FFFFFF' : node.color;
        ctx.fill();

        ctx.restore();
      });
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !isTickerAttached) {
          lastTime = performance.now();
          gsap.ticker.add(render);
          isTickerAttached = true;
        } else if (!isVisible && isTickerAttached) {
          gsap.ticker.remove(render);
          isTickerAttached = false;
        }
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(canvas);

    gsap.ticker.add(render);
    isTickerAttached = true;
    gsap.ticker.lagSmoothing(0);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      clearTimeout(initialTimer);
      if (isTickerAttached) {
        gsap.ticker.remove(render);
      }
    };
  }, [triggerRipple]);

  // Pointer interaction handlers with Touch Gesture Discrimination & Throw Momentum
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    pointerPosRef.current = { x, y };
    prevPointerPosRef.current = { x, y };
    pointerDeltaRef.current = { vx: 0, vy: 0 };
    pointerStartPosRef.current = { x, y };
    isPointerDownRef.current = true;

    // Detect if touching/clicking on a node (reverse search gives top-most rendered node)
    const clickedNode = [...nodesRef.current].reverse().find((node) => {
      const dist = Math.hypot(node.x - x, node.y - y);
      return dist <= node.radius + 10;
    });

    if (clickedNode) {
      draggedNodeIdRef.current = clickedNode.id;
      clickedNode.pulseEnergy = 1.0;

      // Lock touch action to allow smooth 360-degree node dragging without browser scroll hijacking
      canvas.style.touchAction = 'none';
      document.body.setAttribute('data-canvas-mode', 'grabbing');

      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    } else {
      // Background touch: preserve native vertical scrolling
      canvas.style.touchAction = 'pan-y';
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Track pointer velocity for drag release fling momentum
    pointerDeltaRef.current = {
      vx: x - prevPointerPosRef.current.x,
      vy: y - prevPointerPosRef.current.y,
    };
    prevPointerPosRef.current = { x, y };
    pointerPosRef.current = { x, y };

    let isOverAnyNode = false;
    nodesRef.current.forEach((node) => {
      const dist = Math.hypot(node.x - x, node.y - y);
      node.isHovered = dist <= node.radius + 8;
      if (node.isHovered) {
        isOverAnyNode = true;
      }
    });

    // Sync with custom cursor system
    const currentMode = draggedNodeIdRef.current ? 'grabbing' : isOverAnyNode ? 'grab' : '';
    if (currentMode) {
      document.body.setAttribute('data-canvas-mode', currentMode);
      canvas.setAttribute('data-cursor', 'pointer');
    } else {
      document.body.removeAttribute('data-canvas-mode');
      canvas.removeAttribute('data-cursor');
    }

    canvas.style.cursor = draggedNodeIdRef.current
      ? 'grabbing'
      : isOverAnyNode
      ? 'grab'
      : 'crosshair';
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const moveDist = Math.hypot(
      x - pointerStartPosRef.current.x,
      y - pointerStartPosRef.current.y
    );

    const draggedNode = nodesRef.current.find((n) => n.id === draggedNodeIdRef.current);

    if (draggedNode) {
      // Transfer pointer fling velocity to node for visceral inertial throw
      const { vx, vy } = pointerDeltaRef.current;
      draggedNode.vx = Math.max(-25, Math.min(25, vx * 0.85));
      draggedNode.vy = Math.max(-25, Math.min(25, vy * 0.85));
      draggedNode.pulseEnergy = 1.0;

      // Trigger ripple wave on release
      triggerRipple(x, y, draggedNode.color, 4.5);
    } else if (moveDist < 8) {
      // Click/tap on background triggers burnt coral ripple wave
      triggerRipple(x, y, '#DF6C4F', 4.5);
    }

    draggedNodeIdRef.current = null;
    isPointerDownRef.current = false;
    canvas.style.touchAction = 'pan-y';

    const isOverAnyNode = nodesRef.current.some((node) => {
      const dist = Math.hypot(node.x - x, node.y - y);
      return dist <= node.radius + 8;
    });

    if (isOverAnyNode) {
      document.body.setAttribute('data-canvas-mode', 'grab');
    } else {
      document.body.removeAttribute('data-canvas-mode');
    }

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Safe fallback
    }
  };

  const handlePointerCancel = () => {
    draggedNodeIdRef.current = null;
    isPointerDownRef.current = false;
    document.body.removeAttribute('data-canvas-mode');
    if (canvasRef.current) {
      canvasRef.current.style.touchAction = 'pan-y';
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full pointer-events-auto select-none overflow-hidden"
      aria-label="Interactive Systems & Web Domain Physics Network"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: 'pan-y' }}
        className="w-full h-full block opacity-80 transition-opacity duration-500"
      />
    </div>
  );
};
