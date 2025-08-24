import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { ParticleConfig } from './particle-controls';

interface ParticleFieldProps extends Partial<ParticleConfig> {
  containerSize?: { width: number; height: number };
  onCopyPositions?: (positions: Float32Array) => void;
  configs?: ParticleConfig[];
}

function Particles({
  // Basic
  count = 10000,
  size = 1,
  speed = 0.075,
  opacity = 0.6,
  color = '#ffffff',

  // Initial Distribution
  spreadX = 0.1,
  spreadY = 0.1,
  clusterCount = 3,
  clusterRadius = 0.15,
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
  boundaryPadding = 5,
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
  innerBoundary = 200,
  outerBoundary = 800,
  slopeSharpness = 2.5,

  // Scroll Inertia
  scrollInertiaStrength = 0.5,
  scrollInertiaDamping = 0.92,
  scrollInertiaMax = 2.0,

  containerSize = { width: 800, height: 600 },
  currentPositionsRef,
}: ParticleFieldProps & {
  currentPositionsRef?: React.RefObject<Float32Array | null>;
}) {
  const mesh = useRef<THREE.Points>(null);
  const mouse = useRef({ x: 0, y: 0, active: false });
  const activePointers = useRef(new Set<number>());
  const scrollVelocity = useRef({ x: 0, y: 0 });
  const lastScrollPosition = useRef({ x: 0, y: 0 });
  const scrollInertia = useRef({ x: 0, y: 0 });
  const [defaultPositionsData, setDefaultPositionsData] = useState<Float32Array | null>(null);
  const [isLoadingPositions, setIsLoadingPositions] = useState(true);
  const [fadeInOpacity, setFadeInOpacity] = useState(0);
  const [positionCount, setPositionCount] = useState(0);

  // Load positions-buffer.json on mount
  useEffect(() => {
    fetch('/positions-buffer.json')
      .then((res) => res.json())
      .then((data) => {
        // Convert the array back to ArrayBuffer and then to Float32Array
        const uint8Array = new Uint8Array(data.positionsBuffer);
        const buffer = uint8Array.buffer;
        const floatArray = new Float32Array(buffer);
        setDefaultPositionsData(floatArray);
        setPositionCount(data.count);
        setIsLoadingPositions(false);
      })
      .catch(() => {
        setIsLoadingPositions(false);
      });
  }, []);

  // Fade in animation when positions are loaded
  useEffect(() => {
    if (!isLoadingPositions && fadeInOpacity < 1) {
      const fadeTimer = setInterval(() => {
        setFadeInOpacity((prev) => {
          const newOpacity = prev + 0.05;
          if (newOpacity >= 1) {
            clearInterval(fadeTimer);
            return 1;
          }
          return newOpacity;
        });
      }, 16); // ~60fps

      return () => clearInterval(fadeTimer);
    }
  }, [isLoadingPositions, fadeInOpacity]);

  // Calculate actual boundaries based on container size
  const boundaryX = containerSize.width / 2;
  const boundaryY = containerSize.height / 2;

  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);

    // If still loading, return empty positions to prevent flash
    if (isLoadingPositions) {
      return positions;
    }

    // Try to use positions from the buffer if available
    if (defaultPositionsData && defaultPositionsData.length > 0) {
      const availablePositions = Math.floor(defaultPositionsData.length / 3);

      for (let i = 0; i < count; i++) {
        if (i < availablePositions) {
          // Use position from buffer
          positions[i * 3] = defaultPositionsData[i * 3];
          positions[i * 3 + 1] = defaultPositionsData[i * 3 + 1];
          positions[i * 3 + 2] = defaultPositionsData[i * 3 + 2];
        } else {
          // If we need more particles than available in buffer, generate additional ones
          // using the same ring/corona formation pattern
          const angle = Math.random() * Math.PI * 2;

          const minRadius = obstacleRadius * 1.2;
          const maxRadius =
            Math.min(containerSize.width, containerSize.height) * 0.4;

          const randomU = Math.random();
          const randomV = Math.random();
          const gaussianRandom =
            Math.sqrt(-2.0 * Math.log(randomU)) *
            Math.cos(2.0 * Math.PI * randomV);

          const centerRadius = (minRadius + maxRadius) / 2;
          const radiusSpread = (maxRadius - minRadius) / 4;
          const radius = centerRadius + gaussianRandom * radiusSpread;

          const finalRadius = Math.max(minRadius, Math.min(maxRadius, radius));

          const noiseScale = 0.1;
          const noiseX = (Math.random() - 0.5) * finalRadius * noiseScale;
          const noiseY = (Math.random() - 0.5) * finalRadius * noiseScale;

          positions[i * 3] = Math.cos(angle) * finalRadius + noiseX;
          positions[i * 3 + 1] = Math.sin(angle) * finalRadius + noiseY;
          positions[i * 3 + 2] = 0;
        }
      }
    } else {
      // Fallback to original generation if JSON is not available
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;

        const minRadius = obstacleRadius * 1.2;
        const maxRadius =
          Math.min(containerSize.width, containerSize.height) * 0.4;

        const randomU = Math.random();
        const randomV = Math.random();
        const gaussianRandom =
          Math.sqrt(-2.0 * Math.log(randomU)) *
          Math.cos(2.0 * Math.PI * randomV);

        const centerRadius = (minRadius + maxRadius) / 2;
        const radiusSpread = (maxRadius - minRadius) / 4;
        const radius = centerRadius + gaussianRandom * radiusSpread;

        const finalRadius = Math.max(minRadius, Math.min(maxRadius, radius));

        const noiseScale = 0.1;
        const noiseX = (Math.random() - 0.5) * finalRadius * noiseScale;
        const noiseY = (Math.random() - 0.5) * finalRadius * noiseScale;

        positions[i * 3] = Math.cos(angle) * finalRadius + noiseX;
        positions[i * 3 + 1] = Math.sin(angle) * finalRadius + noiseY;
        positions[i * 3 + 2] = 0;
      }
    }
    return positions;
  }, [
    count,
    containerSize,
    obstacleRadius,
    defaultPositionsData,
    isLoadingPositions,
  ]);

  const velocities = useMemo(() => {
    const velocities = new Float32Array(count * 3);

    // Only apply initial velocity if we're generating new positions (not loading from buffer)
    const shouldApplyInitialVelocity =
      !defaultPositionsData || defaultPositionsData.length === 0;

    for (let i = 0; i < count; i++) {
      if (shouldApplyInitialVelocity) {
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
      } else {
        // Start with zero velocity when loading from saved positions
        velocities[i * 3] = 0;
        velocities[i * 3 + 1] = 0;
      }
      velocities[i * 3 + 2] = 0;
    }
    return velocities;
  }, [count, positions, initialVelocity, defaultPositionsData]);

  const temperatures = useMemo(() => {
    const temps = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      temps[i] = Math.random();
    }
    return temps;
  }, [count]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      // Track active pointers
      activePointers.current.add(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      // Only activate if pointer is down (dragging) for touch, or always for mouse
      if (
        event.pointerType === 'mouse' ||
        activePointers.current.has(event.pointerId)
      ) {
        const containerElement = document.querySelector('.particle-container');
        if (containerElement) {
          const rect = containerElement.getBoundingClientRect();
          mouse.current.x =
            ((event.clientX - rect.left) / rect.width - 0.5) *
            containerSize.width;
          mouse.current.y =
            -((event.clientY - rect.top) / rect.height - 0.5) *
            containerSize.height;
          mouse.current.active = true;
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      // Remove from active pointers
      activePointers.current.delete(event.pointerId);

      // Deactivate if no more active pointers
      if (activePointers.current.size === 0) {
        mouse.current.active = false;
      }
    };

    const handlePointerCancel = (event: PointerEvent) => {
      // Handle cancelled pointers
      activePointers.current.delete(event.pointerId);

      if (activePointers.current.size === 0) {
        mouse.current.active = false;
      }
    };

    const handlePointerLeave = (event: PointerEvent) => {
      // Deactivate when pointer leaves the window
      if (event.pointerType === 'mouse') {
        mouse.current.active = false;
      }
    };

    // Add pointer event listeners
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
  }, [containerSize]);

  // Add scroll velocity tracking
  useEffect(() => {
    let rafId: number;
    let lastTime = performance.now();
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      const currentScrollX = window.scrollX || window.pageXOffset;
      const currentScrollY = window.scrollY || window.pageYOffset;

      // Calculate scroll velocity
      if (deltaTime > 0 && deltaTime < 0.1) {
        // Ignore large time gaps
        const velocityX =
          (currentScrollX - lastScrollPosition.current.x) / deltaTime;
        const velocityY =
          (currentScrollY - lastScrollPosition.current.y) / deltaTime;

        // Apply velocity to inertia with clamping
        scrollInertia.current.x = Math.min(
          Math.max(
            velocityX * scrollInertiaStrength * 0.001,
            -scrollInertiaMax
          ),
          scrollInertiaMax
        );
        scrollInertia.current.y = Math.min(
          Math.max(
            -velocityY * scrollInertiaStrength * 0.001,
            -scrollInertiaMax
          ),
          scrollInertiaMax
        );
      }

      lastScrollPosition.current.x = currentScrollX;
      lastScrollPosition.current.y = currentScrollY;

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Set timeout to detect when scrolling stops (for future use)
      scrollTimeout = setTimeout(() => {
        // Scrolling has stopped
      }, 150);
    };

    const updateInertia = () => {
      // Gradually dampen the inertia
      scrollInertia.current.x *= scrollInertiaDamping;
      scrollInertia.current.y *= scrollInertiaDamping;

      // Clamp to zero when very small to prevent drift
      if (Math.abs(scrollInertia.current.x) < 0.0001) {
        scrollInertia.current.x = 0;
      }
      if (Math.abs(scrollInertia.current.y) < 0.0001) {
        scrollInertia.current.y = 0;
      }

      // Continue updating
      rafId = requestAnimationFrame(updateInertia);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Start inertia update loop
    updateInertia();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(scrollTimeout);
    };
  }, [scrollInertiaStrength, scrollInertiaDamping, scrollInertiaMax]);

  useFrame((state) => {
    if (!mesh.current) return;

    const geometry = mesh.current.geometry;
    const positionsArray = geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    // Handle color lerping for magenta field (between H 137 & H 340)
    if (color === '#ff0059') {
      // Lerp between green (H 137) and magenta (H 340)
      const t = (Math.sin(time * 0.08) + 1) / 2; // Much slower oscillation for smooth transitions
      const hue = 137 + (340 - 137) * t; // Lerp between 137 and 340
      const hslColor = new THREE.Color();
      hslColor.setHSL(hue / 360, 1, 0.5);
      if (mesh.current.material) {
        (mesh.current.material as THREE.PointsMaterial).color = hslColor;
      }
    }
    
    // Handle inverse color lerping for cyan field (opposite to magenta) - pastel colors
    if (color === '#00ffff') {
      // Lerp inversely - when magenta is at H 340, cyan is at H 137
      const t = (Math.sin(time * 0.08) + 1) / 2; // Same speed as magenta
      const hue = 340 - (340 - 137) * t; // Inverse lerp: 340 to 137
      const hslColor = new THREE.Color();
      hslColor.setHSL(hue / 360, 0.4, 0.7); // Lower saturation (0.4) and higher lightness (0.7) for pastel effect
      if (mesh.current.material) {
        (mesh.current.material as THREE.PointsMaterial).color = hslColor;
      }
    }

    // Update position reference for copying if provided
    if (currentPositionsRef) {
      currentPositionsRef.current = positionsArray;
    }

    for (let i = 0; i < count; i++) {
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
        // Calculate tangential velocity for circular flow
        const angle = Math.atan2(particleY - centerY, particleX - centerX);
        const tangentX = -Math.sin(angle); // Perpendicular to radial direction
        const tangentY = Math.cos(angle);

        // Create varying orbital speeds based on distance
        const orbitalSpeed = convectionStrength * 0.1;

        // Add radial convection with bias toward filling center
        const radialX = Math.cos(angle);
        const radialY = Math.sin(angle);

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

        // Multi-scale turbulence for better distribution
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
        const convectionX =
          tangentX * orbitalSpeed +
          radialX * radialFlow +
          largeScale * 0.008 * convectionStrength;
        const convectionY =
          tangentY * orbitalSpeed +
          radialY * radialFlow +
          mediumScale * 0.008 * convectionStrength;

        // Add turbulent noise
        const noiseX = (Math.random() - 0.5) * 0.005 * convectionStrength;
        const noiseY = (Math.random() - 0.5) * 0.005 * convectionStrength;

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
      if (mouse.current.active) {
        const distanceFromMouse = Math.sqrt(
          Math.pow(particleX - mouse.current.x, 2) +
            Math.pow(particleY - mouse.current.y, 2)
        );

        if (distanceFromMouse < mouseRadius) {
          const angle = Math.atan2(
            particleY - mouse.current.y,
            particleX - mouse.current.x
          );
          const force =
            ((mouseRadius - distanceFromMouse) / mouseRadius) * mouseForce;
          velocities[i3] += Math.cos(angle) * force;
          velocities[i3 + 1] += Math.sin(angle) * force;

          // Heat up particles near mouse
          temperatures[i] = Math.min(1, temperatures[i] + mouseHeat);
        }
      }

      // Center obstacle interaction - gentler deflection
      if (obstacleEnabled) {
        const distanceFromObstacle = Math.sqrt(
          Math.pow(particleX - obstacleX, 2) +
            Math.pow(particleY - obstacleY, 2)
        );

        // Create a softer boundary that allows particles closer
        const effectiveRadius = obstacleRadius * 0.7; // Smaller effective radius

        if (distanceFromObstacle < effectiveRadius) {
          const angle = Math.atan2(
            particleY - obstacleY,
            particleX - obstacleX
          );

          // Gentler force curve - less aggressive repulsion
          const forceFactor = Math.pow(
            (effectiveRadius - distanceFromObstacle) / effectiveRadius,
            0.5
          );
          const force = forceFactor * obstacleForce * 0.3; // Reduced force multiplier

          // Add tangential component for swirling around obstacle
          const tangentialForce = force * 0.5;
          const tangentX = -Math.sin(angle);
          const tangentY = Math.cos(angle);

          velocities[i3] +=
            Math.cos(angle) * force + tangentX * tangentialForce;
          velocities[i3 + 1] +=
            Math.sin(angle) * force + tangentY * tangentialForce;

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
      velocities[i3] += windX + (Math.random() - 0.5) * windVariation;
      velocities[i3 + 1] += windY + (Math.random() - 0.5) * windVariation;

      // Apply vortex force
      if (vortexStrength > 0) {
        const vortexDist = Math.sqrt(
          particleX * particleX + particleY * particleY
        );
        if (vortexDist < vortexRadius && vortexDist > 0) {
          const vortexAngle = Math.atan2(particleY, particleX) + Math.PI / 2;
          const vortexForce = (1 - vortexDist / vortexRadius) * vortexStrength;
          velocities[i3] += Math.cos(vortexAngle) * vortexForce;
          velocities[i3 + 1] += Math.sin(vortexAngle) * vortexForce;
        }
      }

      // Apply scroll inertia to particles
      velocities[i3] += scrollInertia.current.x;
      velocities[i3 + 1] += scrollInertia.current.y;

      // Damping
      velocities[i3] *= damping;
      velocities[i3 + 1] *= damping;

      // Add turbulence
      velocities[i3] += (Math.random() - 0.5) * turbulence * turbulenceScale;
      velocities[i3 + 1] +=
        (Math.random() - 0.5) * turbulence * turbulenceScale;

      // Boundary bouncing with elastic collision and rounded corners
      if (boundaryRoundness > 0) {
        // Rounded rectangle boundary
        const effectiveBoundaryX = boundaryX - boundaryPadding;
        const effectiveBoundaryY = boundaryY - boundaryPadding;
        const cornerRadius = Math.min(boundaryRoundness, effectiveBoundaryX, effectiveBoundaryY);
        
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
            positionsArray[i3 + 1] = nearestCornerY + Math.sin(angle) * safeRadius;
            
            // Calculate proper reflection normal
            const normalX = Math.cos(angle);
            const normalY = Math.sin(angle);
            const dotProduct = velocities[i3] * normalX + velocities[i3 + 1] * normalY;
            
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
            velocities[i3 + 1] = -Math.abs(velocities[i3 + 1]) * boundaryDamping;
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

    geometry.attributes.position.needsUpdate = true;
  });

  return (
    <>
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={count}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={size}
          color={color}
          transparent
          opacity={opacity * fadeInOpacity}
          sizeAttenuation={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Render center obstacle */}
      {obstacleEnabled && (
        <mesh position={[obstacleX, obstacleY, 0]}>
          <circleGeometry args={[obstacleRadius, 64]} />
          <meshBasicMaterial color="#444444" transparent opacity={0.0} />
        </mesh>
      )}
    </>
  );
}


export function ParticleField(
  props: ParticleFieldProps & { copyTrigger?: number }
) {
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 600,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const currentPositionsRef = useRef<Float32Array | null>(null);

  // Handle position copying when requested
  useEffect(() => {
    if (
      props.onCopyPositions &&
      currentPositionsRef.current &&
      props.copyTrigger !== undefined
    ) {
      props.onCopyPositions(currentPositionsRef.current);
    }
  }, [props.copyTrigger, props.onCopyPositions]);

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

  return (
    <div
      ref={containerRef}
      className="particle-container pointer-events-none absolute inset-0"
    >
      <Canvas
        orthographic
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
      >
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
              currentPositionsRef={index === 0 ? currentPositionsRef : undefined}
            />
          ))
        ) : (
          // Single particle system (backward compatibility)
          <Particles
            {...props}
            containerSize={containerSize}
            currentPositionsRef={currentPositionsRef}
          />
        )}
      </Canvas>
    </div>
  );
}
