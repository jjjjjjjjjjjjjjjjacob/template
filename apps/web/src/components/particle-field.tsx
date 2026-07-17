import { OrthographicCamera } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as THREE from 'three';
import type { ParticleConfig } from './particle-controls';

interface ParticleFieldProps extends Partial<ParticleConfig> {
  containerSize?: { width: number; height: number };
  onCopyPositions?: (positions: Float32Array) => void;
  configs?: ParticleConfig[];
  initialPositions?: Float32Array;
  onReady?: () => void;
}

function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(max-width: 768px)').matches ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  );
}

function getMobilePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  return Math.min(window.devicePixelRatio, isMobileDevice() ? 1.5 : 2);
}

// Precomputed jitter table (values in [-0.5, 0.5)) — replaces the millions of
// Math.random() calls per second made by the per-frame physics loop.
const RAND_SIZE = 1 << 16;
const RAND_MASK = RAND_SIZE - 1;
const RAND_TABLE = (() => {
  const table = new Float32Array(RAND_SIZE);
  for (let i = 0; i < RAND_SIZE; i += 1) {
    table[i] = Math.random() - 0.5;
  }
  return table;
})();

// Reused every frame to avoid allocating a THREE.Color per frame.
const SCRATCH_COLOR = new THREE.Color();

function Particles({
  // Basic
  count = 10000,
  size = 1,
  speed = 0.075,
  opacity = 0.6,
  color = '#ffffff',

  // Initial Distribution
  initialVelocity = 0.3,

  // Physics
  damping = 0.98,
  turbulence = 0.004,
  turbulenceScale = 1.0,

  // Convection
  convectionStrength = 1.0,
  convectionSpeedX = 0.3,
  convectionSpeedY = 0.2,
  convectionScaleX = 0.005,
  convectionScaleY = 0.005,
  buoyancy = 0.02,
  temperatureDiffusion = 0.005,

  // Mouse Interaction
  mouseRadius = 10,
  mouseForce = 1.5,
  mouseHeat = 0.1,

  // Boundaries
  boundaryDamping = 0.8,
  boundaryPadding = 0,
  boundaryRoundness = 0,

  // Temperature
  coolingRate = 0.9,
  heatingRate = 1.1,

  // Wind
  windX = 0,
  windY = 0,
  windVariation = 0,

  // Gravity
  gravityX = 0,
  gravityY = 0,
  gravityRange = 300,

  // Vortex
  vortexStrength = 0,
  vortexRadius = 200,

  // Center Obstacle
  obstacleEnabled = true,
  obstacleX = 0,
  obstacleY = 0,
  obstacleRadius = 300,
  obstacleForce = 1.5,
  obstacleHeat = 0.05,

  // Corona/Slope Controls

  // Scroll Inertia
  scrollInertiaStrength = 0.5,
  scrollInertiaDamping = 0.92,
  scrollInertiaMax = 2.0,

  containerSize = { width: 800, height: 600 },
  currentPositionsRef,
  pausedRef,
  mouseRef,
  scrollVelocityRef,
  scrollSeqRef,
}: ParticleFieldProps & {
  currentPositionsRef?: React.RefObject<Float32Array | null>;
  pausedRef?: React.RefObject<boolean>;
  mouseRef?: React.RefObject<{ x: number; y: number; active: boolean }>;
  scrollVelocityRef?: React.RefObject<{ x: number; y: number }>;
  scrollSeqRef?: React.RefObject<number>;
}) {
  const mesh = useRef<THREE.Points>(null);
  const scrollInertia = useRef({ x: 0, y: 0 });
  const lastScrollSeq = useRef(0);
  const frameCount = useRef(0);
  const randCursorRef = useRef(0);

  const isMobile = useMemo(() => isMobileDevice(), []);
  const frameSkip = isMobile ? 2 : 1;

  // Fade-in control
  const fadeInDuration = 5; // seconds

  // Calculate actual boundaries based on container size
  const boundaryX = containerSize.width / 2;
  const boundaryY = containerSize.height / 2;

  // Use deferred value to prevent blocking during heavy computations
  const deferredCount = useDeferredValue(count);

  const positions = useMemo(() => {
    const positions = new Float32Array(deferredCount * 3);

    for (let i = 0; i < deferredCount; i++) {
      const angle = Math.random() * Math.PI * 2;

      // Spawn particles in a tight ring just outside the obstacle
      const minRadius = obstacleRadius * 0.7;
      const maxRadius = obstacleRadius;

      // Gaussian noise around a base radius near the obstacle edge
      const randomU = Math.random();
      const randomV = Math.random();
      const gaussianRandom =
        Math.sqrt(-2.0 * Math.log(randomU)) * Math.cos(2.0 * Math.PI * randomV);

      const baseRadius = obstacleRadius * 0.5;
      const radiusSpread = (maxRadius - minRadius) * 0.1;
      const radius = baseRadius + gaussianRandom * radiusSpread;

      const finalRadius = Math.max(minRadius, Math.min(maxRadius, radius));

      // Small positional noise to avoid perfect ring
      const noiseScale = 0.03;
      const noiseX = (Math.random() - 0.5) * finalRadius * noiseScale;
      const noiseY = (Math.random() - 0.5) * finalRadius * noiseScale;

      positions[i * 3] = Math.cos(angle) * finalRadius + noiseX;
      positions[i * 3 + 1] = Math.sin(angle) * finalRadius + noiseY;
      positions[i * 3 + 2] = 0;
    }
    return positions;
  }, [deferredCount, obstacleRadius]);

  const velocities = useMemo(() => {
    const velocities = new Float32Array(deferredCount * 3);

    for (let i = 0; i < deferredCount; i++) {
      // Give particles initial velocity away from their cluster center
      const particleX = positions[i * 3];
      const particleY = positions[i * 3 + 1];
      const distFromCenter = Math.sqrt(
        particleX * particleX + particleY * particleY
      );

      if (distFromCenter > 0) {
        // Radial expansion velocity
        velocities[i * 3] =
          (particleX / distFromCenter) * initialVelocity +
          (Math.random() - 0.5) * 0.2;
        velocities[i * 3 + 1] =
          (particleY / distFromCenter) * initialVelocity +
          (Math.random() - 0.5) * 0.2;
      } else {
        velocities[i * 3] = (Math.random() - 0.5) * 0.5;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      }
      velocities[i * 3 + 2] = 0;
    }
    return velocities;
  }, [deferredCount, positions, initialVelocity]);

  const temperatures = useMemo(() => {
    const temps = new Float32Array(deferredCount);
    for (let i = 0; i < deferredCount; i++) {
      temps[i] = Math.random();
    }
    return temps;
  }, [deferredCount]);

  // Pointer position and scroll velocity are tracked once by the ParticleField
  // parent and shared with every field via refs (mouseRef / scrollVelocityRef /
  // scrollSeqRef), so the listeners aren't duplicated per particle system.

  // Ensure material starts invisible to avoid initial flicker
  useEffect(() => {
    if (mesh.current && mesh.current.material) {
      (mesh.current.material as THREE.PointsMaterial).opacity = 0;
    }
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;

    frameCount.current += 1;
    const shouldUpdatePhysics = frameCount.current % frameSkip === 0;

    const geometry = mesh.current.geometry;
    const positionsArray = geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;

    // Fade in particle opacity over the first second
    const material = mesh.current.material as THREE.PointsMaterial | undefined;
    if (material) {
      const progress = Math.min(1, time / fadeInDuration);
      material.opacity = opacity * progress;
    }

    // Pause heavy physics when the field is off-screen or the tab is hidden
    if (pausedRef?.current) {
      return;
    }

    // Apply this field's scroll inertia from the shared scroll velocity.
    // Seeded once per new scroll (via scrollSeqRef), then damped every frame —
    // each field keeps its own strength/damping/max so the feel is preserved.
    if (scrollSeqRef && scrollSeqRef.current !== lastScrollSeq.current) {
      lastScrollSeq.current = scrollSeqRef.current;
      const velocityX = scrollVelocityRef?.current.x ?? 0;
      const velocityY = scrollVelocityRef?.current.y ?? 0;
      scrollInertia.current.x = Math.min(
        Math.max(velocityX * scrollInertiaStrength * 0.001, -scrollInertiaMax),
        scrollInertiaMax
      );
      scrollInertia.current.y = Math.min(
        Math.max(-velocityY * scrollInertiaStrength * 0.001, -scrollInertiaMax),
        scrollInertiaMax
      );
    }
    scrollInertia.current.x *= scrollInertiaDamping;
    scrollInertia.current.y *= scrollInertiaDamping;
    if (Math.abs(scrollInertia.current.x) < 0.0001) {
      scrollInertia.current.x = 0;
    }
    if (Math.abs(scrollInertia.current.y) < 0.0001) {
      scrollInertia.current.y = 0;
    }

    // Skip physics update on some frames for mobile performance
    if (!shouldUpdatePhysics) {
      return;
    }

    // Smooth #ff0059 ↔ cyan cycle avoiding oversaturated intermediate colors
    if (color === '#06b6d4') {
      const rawCycle = (Math.sin(time) + 1) / 20; // 0..1
      // Transform cycle to stay longer on endpoints (ff0059 & cyan) with shorter transitions
      // Use power curve to compress middle and expand endpoints
      let cycle;
      if (rawCycle < 0.5) {
        // First half: mostly stay on ff0059, quick transition at end
        cycle = Math.pow(rawCycle * 2, 3) * 0.5; // cubic curve: slow start, fast end
      } else {
        // Second half: quick transition at start, mostly stay on cyan
        cycle = 0.5 + (1 - Math.pow(2 - rawCycle * 2, 3)) * 0.5; // inverted cubic
      }

      // Start with cyan values, end with magenta
      const CYAN_H = 160; // degrees - start color 160.1 84.1% 39.4%
      const CYAN_S = 0.84;
      const CYAN_L = 0.39;

      const FF0059_H = 355; // degrees - end color (magenta)
      const FF0059_S = 1.0;
      const FF0059_L = 0.5;

      // Only desaturate during the brief transition periods
      let saturationCurve = 1.0;
      if (cycle > 0.1 && cycle < 0.9) {
        // Only desaturate in the middle 80% of transition, but more aggressively
        const transitionProgress = (cycle - 0.1) / 0.8; // 0..1 within transition zone
        saturationCurve = 1 - Math.sin(transitionProgress * Math.PI) * 0.8; // 0.2 to 1.0
      }

      // Lerp hue taking shorter path around color wheel (cyan to magenta)
      const h1 = CYAN_H; // Start with cyan
      let h2 = FF0059_H; // End with magenta
      const hueDiff = h2 - h1;

      // Take shorter path around color wheel
      if (hueDiff > 180) {
        h2 -= 360;
      } else if (hueDiff < -180) {
        h2 += 360;
      }

      const h = h1 + (h2 - h1) * cycle;
      const s = Math.min(CYAN_S, FF0059_S) * saturationCurve;
      const l =
        CYAN_L + (FF0059_L - CYAN_L) * cycle + (1 - saturationCurve) * 0.2;

      SCRATCH_COLOR.setHSL((h < 0 ? h + 360 : h) / 360, s, l);
      if (mesh.current.material) {
        (mesh.current.material as THREE.PointsMaterial).color.copy(
          SCRATCH_COLOR
        );
      }
    }

    // Update position reference for copying if provided
    if (currentPositionsRef) {
      currentPositionsRef.current = positionsArray;
    }

    let randCursor = randCursorRef.current;

    for (let i = 0; i < deferredCount; i++) {
      const i3 = i * 3;

      // Get particle position first
      const particleX = positionsArray[i3];
      const particleY = positionsArray[i3 + 1];

      // Convection: hot particles rise, cold sink
      const temperature = temperatures[i];
      const buoyancyForce = (temperature - 0.5) * buoyancy;
      velocities[i3 + 1] += buoyancyForce;

      // Create balanced orbital flow around the page
      const centerX = 0;
      const centerY = 0;
      const distanceFromCenter = Math.sqrt(
        (particleX - centerX) * (particleX - centerX) +
          (particleY - centerY) * (particleY - centerY)
      );

      if (distanceFromCenter > 0) {
        // sin(atan2(y,x)) = y/dist, cos(atan2(y,x)) = x/dist (center is 0,0),
        // so the orbital/radial basis needs no atan2/sin/cos.
        const invDist = 1 / distanceFromCenter;
        const cosA = particleX * invDist;
        const sinA = particleY * invDist;
        const tangentX = -sinA; // Perpendicular to radial direction
        const tangentY = cosA;

        // Create varying orbital speeds based on distance
        const orbitalSpeed = convectionStrength * 0.1;

        // Add radial convection with bias toward filling center
        const radialX = cosA;
        const radialY = sinA;

        // Create inward bias to fill the center void
        const inwardBias = obstacleEnabled
          ? Math.max(
              0,
              (distanceFromCenter - obstacleRadius * 0.6) / obstacleRadius
            ) * 0.02
          : 0;

        // Radial oscillation plus inward bias
        const radialFlow =
          Math.sin(
            time * convectionSpeedX + distanceFromCenter * convectionScaleX
          ) *
            0.01 *
            convectionStrength -
          inwardBias;

        let convectionX: number;
        let convectionY: number;

        if (isMobile) {
          // Simplified convection for mobile - skip multi-scale turbulence
          convectionX = tangentX * orbitalSpeed + radialX * radialFlow;
          convectionY = tangentY * orbitalSpeed + radialY * radialFlow;
        } else {
          // Multi-scale turbulence for better distribution (desktop only)
          const largeScale =
            Math.sin(
              time * convectionSpeedX * 0.3 + particleX * convectionScaleX * 0.5
            ) *
            Math.cos(
              time * convectionSpeedY * 0.4 + particleY * convectionScaleY * 0.5
            );
          const mediumScale =
            Math.sin(time * convectionSpeedX + particleX * convectionScaleX) *
            Math.cos(time * convectionSpeedY + particleY * convectionScaleY);

          // Combine orbital and radial flows with multi-scale patterns
          convectionX =
            tangentX * orbitalSpeed +
            radialX * radialFlow +
            largeScale * 0.008 * convectionStrength;
          convectionY =
            tangentY * orbitalSpeed +
            radialY * radialFlow +
            mediumScale * 0.008 * convectionStrength;
        }

        // Add turbulent noise (reduced on mobile)
        const noiseFactor = isMobile ? 0.003 : 0.005;
        const noiseX =
          RAND_TABLE[randCursor++ & RAND_MASK] *
          noiseFactor *
          convectionStrength;
        const noiseY =
          RAND_TABLE[randCursor++ & RAND_MASK] *
          noiseFactor *
          convectionStrength;

        velocities[i3] += convectionX + noiseX;
        velocities[i3 + 1] += convectionY + noiseY;
      }

      // Update temperature based on position (cooler at top, warmer at bottom)
      const heightFactor =
        (positionsArray[i3 + 1] + boundaryY) / (boundaryY * 2);
      temperatures[i] +=
        (1 - heightFactor - temperatures[i]) * temperatureDiffusion;

      // Mouse interaction - particles bounce away from cursor

      // Only apply mouse interaction when active
      const activeMouse = mouseRef?.current;
      if (activeMouse?.active) {
        const mdx = particleX - activeMouse.x;
        const mdy = particleY - activeMouse.y;
        const distanceFromMouse = Math.sqrt(mdx * mdx + mdy * mdy);

        if (distanceFromMouse < mouseRadius && distanceFromMouse > 0) {
          const force =
            ((mouseRadius - distanceFromMouse) / mouseRadius) * mouseForce;
          const invDist = 1 / distanceFromMouse;
          velocities[i3] += mdx * invDist * force;
          velocities[i3 + 1] += mdy * invDist * force;

          // Heat up particles near mouse
          temperatures[i] = Math.min(1, temperatures[i] + mouseHeat);
        }
      }

      // Center obstacle interaction - gentler deflection
      if (obstacleEnabled) {
        const odx = particleX - obstacleX;
        const ody = particleY - obstacleY;
        const distanceFromObstacle = Math.sqrt(odx * odx + ody * ody);

        // Create a softer boundary that allows particles closer
        const effectiveRadius = obstacleRadius * 0.7; // Smaller effective radius

        if (
          distanceFromObstacle < effectiveRadius &&
          distanceFromObstacle > 0
        ) {
          // Gentler force curve - less aggressive repulsion (pow(x,0.5) = sqrt)
          const forceFactor = Math.sqrt(
            (effectiveRadius - distanceFromObstacle) / effectiveRadius
          );
          const force = forceFactor * obstacleForce * 0.3; // Reduced force multiplier

          // Add tangential component for swirling around obstacle
          const tangentialForce = force * 0.5;
          const invDist = 1 / distanceFromObstacle;
          const cosA = odx * invDist;
          const sinA = ody * invDist;
          const tangentX = -sinA;
          const tangentY = cosA;

          velocities[i3] += cosA * force + tangentX * tangentialForce;
          velocities[i3 + 1] += sinA * force + tangentY * tangentialForce;

          // Heat up particles near obstacle
          temperatures[i] = Math.min(1, temperatures[i] + obstacleHeat);
        }
      }

      // Apply velocities
      positionsArray[i3] += velocities[i3] * speed * 60;
      positionsArray[i3 + 1] += velocities[i3 + 1] * speed * 60;

      // Apply gravity with range limitation
      if (gravityX !== 0 || gravityY !== 0) {
        const gravityCenter = { x: 0, y: 0 }; // Gravity center point
        const distanceFromGravityCenter = Math.sqrt(
          (particleX - gravityCenter.x) * (particleX - gravityCenter.x) +
            (particleY - gravityCenter.y) * (particleY - gravityCenter.y)
        );

        if (distanceFromGravityCenter <= gravityRange) {
          // Apply gravity with falloff based on distance
          const gravityFalloff = Math.max(
            0,
            1 - distanceFromGravityCenter / gravityRange
          );
          const effectiveGravityX = gravityX * gravityFalloff;
          const effectiveGravityY = gravityY * gravityFalloff;

          velocities[i3] += effectiveGravityX;
          velocities[i3 + 1] += effectiveGravityY;
        }
      }

      // Apply wind with variation
      velocities[i3] +=
        windX + RAND_TABLE[randCursor++ & RAND_MASK] * windVariation;
      velocities[i3 + 1] +=
        windY + RAND_TABLE[randCursor++ & RAND_MASK] * windVariation;

      // Apply vortex force. cos(a+90°) = -y/dist, sin(a+90°) = x/dist, and the
      // vortex distance equals distanceFromCenter, so reuse it (no extra sqrt).
      if (
        vortexStrength > 0 &&
        distanceFromCenter > 0 &&
        distanceFromCenter < vortexRadius
      ) {
        const vortexForce =
          (1 - distanceFromCenter / vortexRadius) * vortexStrength;
        const invDist = 1 / distanceFromCenter;
        velocities[i3] += -particleY * invDist * vortexForce;
        velocities[i3 + 1] += particleX * invDist * vortexForce;
      }

      // Apply scroll inertia to particles
      velocities[i3] += scrollInertia.current.x;
      velocities[i3 + 1] += scrollInertia.current.y;

      // Damping
      velocities[i3] *= damping;
      velocities[i3 + 1] *= damping;

      // Add turbulence
      velocities[i3] +=
        RAND_TABLE[randCursor++ & RAND_MASK] * turbulence * turbulenceScale;
      velocities[i3 + 1] +=
        RAND_TABLE[randCursor++ & RAND_MASK] * turbulence * turbulenceScale;

      // Boundary bouncing with elastic collision and rounded corners
      if (boundaryRoundness > 0) {
        // Rounded rectangle boundary
        const effectiveBoundaryX = boundaryX - boundaryPadding;
        const effectiveBoundaryY = boundaryY - boundaryPadding;
        const cornerRadius = Math.min(
          boundaryRoundness,
          effectiveBoundaryX,
          effectiveBoundaryY
        );

        // Check if particle is in a corner region
        const cornerX = effectiveBoundaryX - cornerRadius;
        const cornerY = effectiveBoundaryY - cornerRadius;

        // Check each corner
        if (Math.abs(particleX) > cornerX && Math.abs(particleY) > cornerY) {
          // Particle is in a corner region
          const nearestCornerX = particleX > 0 ? cornerX : -cornerX;
          const nearestCornerY = particleY > 0 ? cornerY : -cornerY;

          const distFromCorner = Math.sqrt(
            Math.pow(particleX - nearestCornerX, 2) +
              Math.pow(particleY - nearestCornerY, 2)
          );

          if (distFromCorner > cornerRadius) {
            // Particle is outside the rounded corner
            const angle = Math.atan2(
              particleY - nearestCornerY,
              particleX - nearestCornerX
            );

            // Position particle just inside the corner boundary with small offset
            const safeRadius = cornerRadius * 0.95; // Small inward offset to prevent sticking
            positionsArray[i3] = nearestCornerX + Math.cos(angle) * safeRadius;
            positionsArray[i3 + 1] =
              nearestCornerY + Math.sin(angle) * safeRadius;

            // Calculate proper reflection normal
            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            const dotProduct =
              velocities[i3] * normalX + velocities[i3 + 1] * normalY;

            // Only reflect if moving outward (positive dot product)
            if (dotProduct > 0) {
              velocities[i3] -= 2 * dotProduct * normalX;
              velocities[i3 + 1] -= 2 * dotProduct * normalY;

              // Add small random perturbation to prevent getting stuck
              const perturbation = 0.1;
              velocities[i3] += (Math.random() - 0.5) * perturbation;
              velocities[i3 + 1] += (Math.random() - 0.5) * perturbation;
            }

            // Apply damping
            velocities[i3] *= boundaryDamping;
            velocities[i3 + 1] *= boundaryDamping;

            // Temperature effects
            if (particleY > 0) {
              temperatures[i] *= coolingRate; // Cool down at top
            } else {
              temperatures[i] = Math.min(1, temperatures[i] * heatingRate); // Heat up at bottom
            }
          }
        } else {
          // Particle is on a straight edge, use regular boundary check
          if (positionsArray[i3] > effectiveBoundaryX) {
            positionsArray[i3] = effectiveBoundaryX;
            velocities[i3] = -Math.abs(velocities[i3]) * boundaryDamping;
          } else if (positionsArray[i3] < -effectiveBoundaryX) {
            positionsArray[i3] = -effectiveBoundaryX;
            velocities[i3] = Math.abs(velocities[i3]) * boundaryDamping;
          }

          if (positionsArray[i3 + 1] > effectiveBoundaryY) {
            positionsArray[i3 + 1] = effectiveBoundaryY;
            velocities[i3 + 1] =
              -Math.abs(velocities[i3 + 1]) * boundaryDamping;
            temperatures[i] *= coolingRate; // Cool down at top
          } else if (positionsArray[i3 + 1] < -effectiveBoundaryY) {
            positionsArray[i3 + 1] = -effectiveBoundaryY;
            velocities[i3 + 1] = Math.abs(velocities[i3 + 1]) * boundaryDamping;
            temperatures[i] = Math.min(1, temperatures[i] * heatingRate); // Heat up at bottom
          }
        }
      } else {
        // Regular rectangular boundary
        if (positionsArray[i3] > boundaryX - boundaryPadding) {
          positionsArray[i3] = boundaryX - boundaryPadding;
          velocities[i3] = -Math.abs(velocities[i3]) * boundaryDamping;
        } else if (positionsArray[i3] < -boundaryX + boundaryPadding) {
          positionsArray[i3] = -boundaryX + boundaryPadding;
          velocities[i3] = Math.abs(velocities[i3]) * boundaryDamping;
        }

        if (positionsArray[i3 + 1] > boundaryY - boundaryPadding) {
          positionsArray[i3 + 1] = boundaryY - boundaryPadding;
          velocities[i3 + 1] = -Math.abs(velocities[i3 + 1]) * boundaryDamping;
          temperatures[i] *= coolingRate; // Cool down at top
        } else if (positionsArray[i3 + 1] < -boundaryY + boundaryPadding) {
          positionsArray[i3 + 1] = -boundaryY + boundaryPadding;
          velocities[i3 + 1] = Math.abs(velocities[i3 + 1]) * boundaryDamping;
          temperatures[i] = Math.min(1, temperatures[i] * heatingRate); // Heat up at bottom
        }
      }
    }

    randCursorRef.current = randCursor;
    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={deferredCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          color={color}
          transparent
          opacity={opacity}
          sizeAttenuation={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Render center obstacle (fewer segments on mobile) */}
      {obstacleEnabled && (
        <mesh position={[obstacleX, obstacleY, 0]}>
          <circleGeometry args={[obstacleRadius, isMobile ? 32 : 64]} />
          <meshBasicMaterial color="#444444" transparent opacity={0.0} />
        </mesh>
      )}
    </>
  );
}

export function ParticleField(
  props: ParticleFieldProps & { copyTrigger?: number }
) {
  // Guard against SSR/hydration issues: react-three-fiber should only render on client
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    startTransition(() => {
      setIsClient(true);
    });
  }, []);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPositionsRef = useRef<Float32Array | null>(null);
  const pausedRef = useRef(false);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const scrollVelocityRef = useRef({ x: 0, y: 0 });
  const scrollSeqRef = useRef(0);

  // Handle position copying when requested
  const { onCopyPositions, copyTrigger } = props;
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally constrained dependencies
  useEffect(() => {
    // Only act on explicit user-triggered increments (copyTrigger > 0)
    if (
      onCopyPositions &&
      currentPositionsRef.current &&
      typeof copyTrigger === 'number' &&
      copyTrigger > 0
    ) {
      onCopyPositions(currentPositionsRef.current);
    }
  }, [copyTrigger]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Pause the simulation when the field scrolls off-screen or the tab is hidden
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    let isOnScreen = true;
    const updatePaused = () => {
      pausedRef.current = !isOnScreen || document.hidden;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        isOnScreen = entries[0]?.isIntersecting ?? true;
        updatePaused();
      },
      { threshold: 0 }
    );
    observer.observe(element);
    document.addEventListener('visibilitychange', updatePaused);
    updatePaused();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', updatePaused);
    };
  }, []);

  // Shared pointer tracking for all particle systems (one listener set)
  useEffect(() => {
    const activePointers = new Set<number>();

    const handlePointerDown = (event: PointerEvent) => {
      activePointers.add(event.pointerId);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (
        event.pointerType === 'mouse' ||
        activePointers.has(event.pointerId)
      ) {
        const element = containerRef.current;
        if (element) {
          const rect = element.getBoundingClientRect();
          mouseRef.current.x =
            ((event.clientX - rect.left) / rect.width - 0.5) *
            containerSize.width;
          mouseRef.current.y =
            -((event.clientY - rect.top) / rect.height - 0.5) *
            containerSize.height;
          mouseRef.current.active = true;
        }
      }
    };
    const handlePointerUp = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (activePointers.size === 0) mouseRef.current.active = false;
    };
    const handlePointerCancel = (event: PointerEvent) => {
      activePointers.delete(event.pointerId);
      if (activePointers.size === 0) mouseRef.current.active = false;
    };
    const handlePointerLeave = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') mouseRef.current.active = false;
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('pointerleave', handlePointerLeave);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, [containerSize.width, containerSize.height]);

  // Shared scroll-velocity tracking (one listener). Each field applies its own
  // strength/damping/max in its frame loop, keyed off scrollSeqRef.
  useEffect(() => {
    let lastTime = performance.now();
    let lastX = window.scrollX || window.pageXOffset;
    let lastY = window.scrollY || window.pageYOffset;

    const handleScroll = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      const currentX = window.scrollX || window.pageXOffset;
      const currentY = window.scrollY || window.pageYOffset;
      if (deltaTime > 0 && deltaTime < 0.1) {
        scrollVelocityRef.current.x = (currentX - lastX) / deltaTime;
        scrollVelocityRef.current.y = (currentY - lastY) / deltaTime;
        scrollSeqRef.current += 1;
      }
      lastX = currentX;
      lastY = currentY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className="particle-container pointer-events-none absolute inset-0 p-0"
    >
      {isClient && (
        <Canvas
          orthographic
          dpr={getMobilePixelRatio()}
          camera={{
            position: [0, 0, 100],
            zoom: 1,
            left: -containerSize.width / 2,
            right: containerSize.width / 2,
            top: containerSize.height / 2,
            bottom: -containerSize.height / 2,
            near: 0.1,
            far: 1000,
          }}
          style={{ background: 'transparent' }}
          gl={{
            antialias: !isMobileDevice(),
            powerPreference: 'high-performance',
          }}
        >
          {/* Notify once on first rendered frame */}
          {(() => {
            function FirstFrameNotifier({ onReady }: { onReady?: () => void }) {
              const notified = useRef(false);
              useFrame(() => {
                if (!notified.current) {
                  notified.current = true;
                  if (onReady) onReady();
                }
              });
              return null;
            }
            return <FirstFrameNotifier onReady={props.onReady} />;
          })()}
          <OrthographicCamera
            makeDefault
            position={[0, 0, 100]}
            left={-containerSize.width / 2}
            right={containerSize.width / 2}
            top={containerSize.height / 2}
            bottom={-containerSize.height / 2}
            near={0.1}
            far={1000}
          />
          {props.configs ? (
            // Render multiple particle systems
            props.configs.map((config, index) => (
              <Particles
                key={index}
                {...config}
                containerSize={containerSize}
                currentPositionsRef={
                  index === 0 ? currentPositionsRef : undefined
                }
                pausedRef={pausedRef}
                mouseRef={mouseRef}
                scrollVelocityRef={scrollVelocityRef}
                scrollSeqRef={scrollSeqRef}
              />
            ))
          ) : (
            // Single particle system (backward compatibility)
            <Particles
              key="single-particle-system"
              {...props}
              containerSize={containerSize}
              currentPositionsRef={currentPositionsRef}
              pausedRef={pausedRef}
              mouseRef={mouseRef}
              scrollVelocityRef={scrollVelocityRef}
              scrollSeqRef={scrollSeqRef}
            />
          )}
        </Canvas>
      )}
    </div>
  );
}
