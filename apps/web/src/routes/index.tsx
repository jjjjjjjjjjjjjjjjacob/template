import { createFileRoute } from '@tanstack/react-router';
import { ParticleField } from '@/components/particle-field';
import { ParticleControls, defaultParticleConfig } from '@/components/particle-controls';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  const [isMobile, setIsMobile] = useState(false);
  const [showControls1, setShowControls1] = useState(false);
  const [showControls2, setShowControls2] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  // Shared configuration - only area/boundary definitions
  const [sharedConfig, setSharedConfig] = useState({
    // Mouse interaction area
    mouseRadius: defaultParticleConfig.mouseRadius,
    // Boundary area
    boundaryPadding: defaultParticleConfig.boundaryPadding,
    // Obstacle area
    obstacleEnabled: defaultParticleConfig.obstacleEnabled,
    obstacleX: defaultParticleConfig.obstacleX,
    obstacleY: defaultParticleConfig.obstacleY,
    obstacleRadius: defaultParticleConfig.obstacleRadius,
  });
  
  // Independent configs for each particle field (including how they respond to areas)
  const [particleConfig1, setParticleConfig1] = useState({
    ...defaultParticleConfig,
    color: '#00ffff', // Cyan for field 1
  });
  const [particleConfig2, setParticleConfig2] = useState({
    ...defaultParticleConfig,
    color: '#ff00ff', // Magenta for field 2
    count: 3000, // Different count
    turbulence: 0.002, // Different turbulence
    convectionStrength: 0.05, // Different convection
    mouseForce: 0.8, // Different mouse response
    obstacleForce: 1.2, // Different obstacle response
  });
  
  const [initKey1, setInitKey1] = useState(0);
  const [initKey2, setInitKey2] = useState(0);
  const [copyTrigger, setCopyTrigger] = useState(0);
  
  const handleReset1 = () => {
    setParticleConfig1({
      ...defaultParticleConfig,
      color: '#00ffff',
    });
    setInitKey1((prev) => prev + 1);
  };
  
  const handleReset2 = () => {
    setParticleConfig2({
      ...defaultParticleConfig,
      color: '#ff00ff',
      count: 3000,
      turbulence: 0.002,
      convectionStrength: 0.05,
      mouseForce: 0.8,
      obstacleForce: 1.2,
    });
    setInitKey2((prev) => prev + 1);
  };
  
  const handleInitialize1 = () => {
    setInitKey1((prev) => prev + 1);
  };
  
  const handleInitialize2 = () => {
    setInitKey2((prev) => prev + 1);
  };
  
  const handleCopyPositions = (positions: Float32Array) => {
    // Convert positions to a more readable format
    const positionsArray = Array.from(positions);
    const formattedPositions = [];
    for (let i = 0; i < positionsArray.length; i += 3) {
      formattedPositions.push([
        Math.round(positionsArray[i] * 100) / 100,
        Math.round(positionsArray[i + 1] * 100) / 100,
        Math.round(positionsArray[i + 2] * 100) / 100
      ]);
    }
    
    const positionData = {
      count: formattedPositions.length,
      positions: formattedPositions,
      timestamp: new Date().toISOString(),
      containerSize: { width: 800, height: 600 } // Default size, will be updated by component
    };
    
    // Copy positions to clipboard instead of downloading
    navigator.clipboard.writeText(JSON.stringify(positionData, null, 2));
  };
  
  // Merge configs for each field (shared areas override individual settings)
  const config1 = { 
    ...particleConfig1, 
    mouseRadius: sharedConfig.mouseRadius,
    boundaryPadding: sharedConfig.boundaryPadding,
    obstacleEnabled: sharedConfig.obstacleEnabled,
    obstacleX: sharedConfig.obstacleX,
    obstacleY: sharedConfig.obstacleY,
    obstacleRadius: sharedConfig.obstacleRadius,
  };
  const config2 = { 
    ...particleConfig2,
    mouseRadius: sharedConfig.mouseRadius,
    boundaryPadding: sharedConfig.boundaryPadding,
    obstacleEnabled: sharedConfig.obstacleEnabled,
    obstacleX: sharedConfig.obstacleX,
    obstacleY: sharedConfig.obstacleY,
    obstacleRadius: sharedConfig.obstacleRadius,
  };
  
  // Use keys that change when we need to reinitialize
  const particleKey1 = `particle1-${initKey1}-${particleConfig1.count}-${particleConfig1.clusterCount}`;
  const particleKey2 = `particle2-${initKey2}-${particleConfig2.count}-${particleConfig2.clusterCount}`;
  
  return (
    <div className="relative mt-16 min-h-screen overflow-hidden bg-black">
      {/* Both particle fields layered on top of each other */}
      <ParticleField 
        key={particleKey1} 
        {...config1} 
        onCopyPositions={handleCopyPositions}
        copyTrigger={copyTrigger} 
      />
      <ParticleField 
        key={particleKey2} 
        {...config2} 
        onCopyPositions={handleCopyPositions}
        copyTrigger={copyTrigger} 
      />
      
      {/* Control Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-4 md:top-4 md:bottom-auto md:left-auto md:right-4 md:translate-x-0">
        {/* Cyan Controls */}
        {isMobile ? (
          <Dialog open={showControls1} onOpenChange={setShowControls1}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-cyan-500/20 text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/30"
              >
                cyan controls
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-black/95 border-white/20">
              <ParticleControls 
                config={config1} 
                onChange={(newConfig) => {
                  const sharedUpdates: any = {};
                  if (newConfig.mouseRadius !== config1.mouseRadius) sharedUpdates.mouseRadius = newConfig.mouseRadius;
                  if (newConfig.boundaryPadding !== config1.boundaryPadding) sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                  if (newConfig.obstacleEnabled !== config1.obstacleEnabled) sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                  if (newConfig.obstacleX !== config1.obstacleX) sharedUpdates.obstacleX = newConfig.obstacleX;
                  if (newConfig.obstacleY !== config1.obstacleY) sharedUpdates.obstacleY = newConfig.obstacleY;
                  if (newConfig.obstacleRadius !== config1.obstacleRadius) sharedUpdates.obstacleRadius = newConfig.obstacleRadius;
                  
                  if (Object.keys(sharedUpdates).length > 0) {
                    setSharedConfig(prev => ({ ...prev, ...sharedUpdates }));
                  }
                  
                  setParticleConfig1(newConfig);
                }}
                onReset={handleReset1}
                onInitialize={handleInitialize1}
                onCopyPositions={() => {
                  setCopyTrigger((prev) => prev + 1);
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'copied!';
                  setTimeout(() => {
                    btn.innerText = originalText;
                  }, 1000);
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Popover open={showControls1} onOpenChange={setShowControls1}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-cyan-500/20 text-cyan-400 border-cyan-400/50 hover:bg-cyan-500/30"
              >
                cyan controls
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/95 border-white/20" align="end">
              <ParticleControls 
                config={config1} 
                onChange={(newConfig) => {
                  const sharedUpdates: any = {};
                  if (newConfig.mouseRadius !== config1.mouseRadius) sharedUpdates.mouseRadius = newConfig.mouseRadius;
                  if (newConfig.boundaryPadding !== config1.boundaryPadding) sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                  if (newConfig.obstacleEnabled !== config1.obstacleEnabled) sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                  if (newConfig.obstacleX !== config1.obstacleX) sharedUpdates.obstacleX = newConfig.obstacleX;
                  if (newConfig.obstacleY !== config1.obstacleY) sharedUpdates.obstacleY = newConfig.obstacleY;
                  if (newConfig.obstacleRadius !== config1.obstacleRadius) sharedUpdates.obstacleRadius = newConfig.obstacleRadius;
                  
                  if (Object.keys(sharedUpdates).length > 0) {
                    setSharedConfig(prev => ({ ...prev, ...sharedUpdates }));
                  }
                  
                  setParticleConfig1(newConfig);
                }}
                onReset={handleReset1}
                onInitialize={handleInitialize1}
                onCopyPositions={() => {
                  setCopyTrigger((prev) => prev + 1);
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'copied!';
                  setTimeout(() => {
                    btn.innerText = originalText;
                  }, 1000);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
        
        {/* Magenta Controls */}
        {isMobile ? (
          <Dialog open={showControls2} onOpenChange={setShowControls2}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-pink-500/20 text-pink-400 border-pink-400/50 hover:bg-pink-500/30"
              >
                magenta controls
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm bg-black/95 border-white/20">
              <ParticleControls 
                config={config2} 
                onChange={(newConfig) => {
                  const sharedUpdates: any = {};
                  if (newConfig.mouseRadius !== config2.mouseRadius) sharedUpdates.mouseRadius = newConfig.mouseRadius;
                  if (newConfig.boundaryPadding !== config2.boundaryPadding) sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                  if (newConfig.obstacleEnabled !== config2.obstacleEnabled) sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                  if (newConfig.obstacleX !== config2.obstacleX) sharedUpdates.obstacleX = newConfig.obstacleX;
                  if (newConfig.obstacleY !== config2.obstacleY) sharedUpdates.obstacleY = newConfig.obstacleY;
                  if (newConfig.obstacleRadius !== config2.obstacleRadius) sharedUpdates.obstacleRadius = newConfig.obstacleRadius;
                  
                  if (Object.keys(sharedUpdates).length > 0) {
                    setSharedConfig(prev => ({ ...prev, ...sharedUpdates }));
                  }
                  
                  setParticleConfig2(newConfig);
                }}
                onReset={handleReset2}
                onInitialize={handleInitialize2}
                onCopyPositions={() => {
                  setCopyTrigger((prev) => prev + 1);
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'copied!';
                  setTimeout(() => {
                    btn.innerText = originalText;
                  }, 1000);
                }}
              />
            </DialogContent>
          </Dialog>
        ) : (
          <Popover open={showControls2} onOpenChange={setShowControls2}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="bg-pink-500/20 text-pink-400 border-pink-400/50 hover:bg-pink-500/30"
              >
                magenta controls
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-black/95 border-white/20" align="end">
              <ParticleControls 
                config={config2} 
                onChange={(newConfig) => {
                  const sharedUpdates: any = {};
                  if (newConfig.mouseRadius !== config2.mouseRadius) sharedUpdates.mouseRadius = newConfig.mouseRadius;
                  if (newConfig.boundaryPadding !== config2.boundaryPadding) sharedUpdates.boundaryPadding = newConfig.boundaryPadding;
                  if (newConfig.obstacleEnabled !== config2.obstacleEnabled) sharedUpdates.obstacleEnabled = newConfig.obstacleEnabled;
                  if (newConfig.obstacleX !== config2.obstacleX) sharedUpdates.obstacleX = newConfig.obstacleX;
                  if (newConfig.obstacleY !== config2.obstacleY) sharedUpdates.obstacleY = newConfig.obstacleY;
                  if (newConfig.obstacleRadius !== config2.obstacleRadius) sharedUpdates.obstacleRadius = newConfig.obstacleRadius;
                  
                  if (Object.keys(sharedUpdates).length > 0) {
                    setSharedConfig(prev => ({ ...prev, ...sharedUpdates }));
                  }
                  
                  setParticleConfig2(newConfig);
                }}
                onReset={handleReset2}
                onInitialize={handleInitialize2}
                onCopyPositions={() => {
                  setCopyTrigger((prev) => prev + 1);
                  const btn = document.activeElement as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'copied!';
                  setTimeout(() => {
                    btn.innerText = originalText;
                  }, 1000);
                }}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="mb-8 text-6xl font-bold tracking-widest text-white opacity-90">
          template
        </h1>

        <p className="max-w-md text-center text-lg text-white/60">
          a modern full-stack monorepo template with real-time capabilities and
          3d graphics
        </p>

        <div className="mt-12 flex gap-4">
          <button className="rounded-lg border border-white/10 bg-white/10 px-6 py-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20">
            get started
          </button>
          <button className="rounded-lg border border-white/20 bg-transparent px-6 py-3 text-white transition-colors hover:bg-white/10">
            learn more
          </button>
        </div>
      </div>
    </div>
  );
}
