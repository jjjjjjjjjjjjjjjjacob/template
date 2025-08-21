import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface ParticleConfig {
  // Basic
  count: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  
  // Initial Distribution
  spreadX: number;
  spreadY: number;
  clusterCount: number;
  clusterRadius: number;
  initialVelocity: number;
  
  // Physics
  damping: number;
  turbulence: number;
  turbulenceScale: number;
  
  // Convection
  convectionStrength: number;
  convectionSpeedX: number;
  convectionSpeedY: number;
  convectionScaleX: number;
  convectionScaleY: number;
  buoyancy: number;
  temperatureDiffusion: number;
  
  // Mouse Interaction
  mouseRadius: number;
  mouseForce: number;
  mouseHeat: number;
  
  // Boundaries
  boundaryDamping: number;
  boundaryPadding: number;
  
  // Temperature
  coolingRate: number;
  heatingRate: number;
  
  // Wind
  windX: number;
  windY: number;
  windVariation: number;
  
  // Gravity
  gravityX: number;
  gravityY: number;
  gravityRange: number;
  
  // Vortex
  vortexStrength: number;
  vortexRadius: number;
  
  // Center Obstacle
  obstacleEnabled: boolean;
  obstacleX: number;
  obstacleY: number;
  obstacleRadius: number;
  obstacleForce: number;
  obstacleHeat: number;
  
  // Corona/Slope Controls
  innerBoundary: number;
  outerBoundary: number;
  slopeSharpness: number;
}

interface ParticleControlsProps {
  config: ParticleConfig;
  onChange: (config: ParticleConfig) => void;
  onReset: () => void;
  onInitialize: () => void;
  onCopyPositions?: () => void;
}

export const defaultParticleConfig: ParticleConfig = {
  // Basic
  count: 6000,
  size: 1.5,
  speed: 0.03,
  opacity: 0.6,
  color: '#ffffff',
  
  // Initial Distribution
  spreadX: 0.1,
  spreadY: 0.1,
  clusterCount: 3,
  clusterRadius: 0.15,
  initialVelocity: 0.3,
  
  // Physics
  damping: 0.975,
  turbulence: 0.358,
  turbulenceScale: 0.4,
  
  // Convection
  convectionStrength: 0.08,
  convectionSpeedX: 0.2,
  convectionSpeedY: 0.25,
  convectionScaleX: 0.013,
  convectionScaleY: 0.013,
  buoyancy: 0.05,
  temperatureDiffusion: 0.008,
  
  // Mouse Interaction
  mouseRadius: 45,
  mouseForce: 0.4,
  mouseHeat: 0.25,
  
  // Boundaries
  boundaryDamping: 1,
  boundaryPadding: 5,
  
  // Temperature
  coolingRate: 1,
  heatingRate: 1.1,
  
  // Wind
  windX: 0,
  windY: 0,
  windVariation: 0.01,
  
  // Gravity
  gravityX: 0,
  gravityY: 0.0001,
  gravityRange: 375,
  
  // Vortex
  vortexStrength: 0.01,
  vortexRadius: 320,
  
  // Center Obstacle
  obstacleEnabled: true,
  obstacleX: 0,
  obstacleY: 0,
  obstacleRadius: 300,
  obstacleForce: 1.6,
  obstacleHeat: 0,
  
  // Corona/Slope Controls
  innerBoundary: 180,
  outerBoundary: 1500,
  slopeSharpness: 7,
};

export function ParticleControls({ config, onChange, onReset, onInitialize, onCopyPositions }: ParticleControlsProps) {
  const [openSections, setOpenSections] = useState({
    basic: true,
    distribution: false,
    physics: false,
    convection: false,
    mouse: false,
    boundaries: false,
    temperature: false,
    forces: false,
    obstacle: false,
    corona: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (key: keyof ParticleConfig, value: number[] | string | boolean) => {
    if (Array.isArray(value)) {
      if (key === 'obstacleEnabled') {
        onChange({ ...config, [key]: value[0] === 1 });
      } else {
        onChange({ ...config, [key]: value[0] });
      }
    } else {
      onChange({ ...config, [key]: value });
    }
  };

  return (
    <Card className="w-full bg-black/80 text-white backdrop-blur-sm border-white/20 max-h-[600px] overflow-y-auto">
      <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">particle controls</h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onInitialize}
                  className="text-white hover:bg-white/10"
                  title="Restart particles with current settings"
                >
                  initialize
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="text-white hover:bg-white/10"
                  title="Reset all settings to defaults"
                >
                  reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                    // Simple feedback - you could add a toast notification here
                    const btn = document.activeElement as HTMLButtonElement;
                    const originalText = btn.innerText;
                    btn.innerText = 'copied!';
                    setTimeout(() => {
                      btn.innerText = originalText;
                    }, 1000);
                  }}
                  className="text-white hover:bg-white/10"
                  title="Copy configuration as JSON"
                >
                  json
                </Button>
                {onCopyPositions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onCopyPositions();
                      const btn = document.activeElement as HTMLButtonElement;
                      const originalText = btn.innerText;
                      btn.innerText = 'copied!';
                      setTimeout(() => {
                        btn.innerText = originalText;
                      }, 1000);
                    }}
                    className="text-white hover:bg-white/10"
                    title="Copy current particle positions"
                  >
                    positions
                  </Button>
                )}
              </div>
            </div>

            {/* Basic Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('basic')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.basic ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">basic</span>
              </button>
              
              {openSections.basic && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">
                      count: {config.count}
                      {config.count !== defaultParticleConfig.count && (
                        <span className="ml-2 text-yellow-400">
                          ({config.count > defaultParticleConfig.count ? '+' : ''}{config.count - defaultParticleConfig.count})
                        </span>
                      )}
                    </Label>
                    <Slider
                      value={[config.count]}
                      onValueChange={(v) => handleChange('count', v)}
                      min={5000}
                      max={50000}
                      step={1000}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">size: {config.size}</Label>
                    <Slider
                      value={[config.size]}
                      onValueChange={(v) => handleChange('size', v)}
                      min={0.5}
                      max={5}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">speed: {config.speed.toFixed(3)}</Label>
                    <Slider
                      value={[config.speed]}
                      onValueChange={(v) => handleChange('speed', v)}
                      min={0.005}
                      max={0.1}
                      step={0.005}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">opacity: {config.opacity.toFixed(2)}</Label>
                    <Slider
                      value={[config.opacity]}
                      onValueChange={(v) => handleChange('opacity', v)}
                      min={0.1}
                      max={1}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">color: {config.color}</Label>
                    <input
                      type="color"
                      value={config.color}
                      onChange={(e) => handleChange('color', e.target.value)}
                      className="mt-1 h-8 w-full cursor-pointer rounded border border-white/20 bg-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Distribution Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('distribution')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.distribution ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">initial distribution</span>
              </button>
              
              {openSections.distribution && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">spread x: {config.spreadX.toFixed(2)}</Label>
                    <Slider
                      value={[config.spreadX]}
                      onValueChange={(v) => handleChange('spreadX', v)}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">spread y: {config.spreadY.toFixed(2)}</Label>
                    <Slider
                      value={[config.spreadY]}
                      onValueChange={(v) => handleChange('spreadY', v)}
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">clusters: {config.clusterCount}</Label>
                    <Slider
                      value={[config.clusterCount]}
                      onValueChange={(v) => handleChange('clusterCount', v)}
                      min={1}
                      max={10}
                      step={1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">cluster radius: {config.clusterRadius.toFixed(2)}</Label>
                    <Slider
                      value={[config.clusterRadius]}
                      onValueChange={(v) => handleChange('clusterRadius', v)}
                      min={0.05}
                      max={0.5}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">initial velocity: {config.initialVelocity.toFixed(2)}</Label>
                    <Slider
                      value={[config.initialVelocity]}
                      onValueChange={(v) => handleChange('initialVelocity', v)}
                      min={0}
                      max={2}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Physics Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('physics')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.physics ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">physics</span>
              </button>
              
              {openSections.physics && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">damping: {config.damping.toFixed(3)}</Label>
                    <Slider
                      value={[config.damping]}
                      onValueChange={(v) => handleChange('damping', v)}
                      min={0.9}
                      max={1}
                      step={0.001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">turbulence: {config.turbulence.toFixed(3)}</Label>
                    <Slider
                      value={[config.turbulence]}
                      onValueChange={(v) => handleChange('turbulence', v)}
                      min={0}
                      max={0.5}
                      step={0.002}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">turbulence scale: {config.turbulenceScale.toFixed(2)}</Label>
                    <Slider
                      value={[config.turbulenceScale]}
                      onValueChange={(v) => handleChange('turbulenceScale', v)}
                      min={0}
                      max={8}
                      step={0.2}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Convection Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('convection')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.convection ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">convection</span>
              </button>
              
              {openSections.convection && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">strength: {config.convectionStrength.toFixed(2)}</Label>
                    <Slider
                      value={[config.convectionStrength]}
                      onValueChange={(v) => handleChange('convectionStrength', v)}
                      min={0}
                      max={0.5}
                      step={0.02}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">speed x: {config.convectionSpeedX.toFixed(2)}</Label>
                    <Slider
                      value={[config.convectionSpeedX]}
                      onValueChange={(v) => handleChange('convectionSpeedX', v)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">speed y: {config.convectionSpeedY.toFixed(2)}</Label>
                    <Slider
                      value={[config.convectionSpeedY]}
                      onValueChange={(v) => handleChange('convectionSpeedY', v)}
                      min={0}
                      max={1}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">scale x: {config.convectionScaleX.toFixed(3)}</Label>
                    <Slider
                      value={[config.convectionScaleX]}
                      onValueChange={(v) => handleChange('convectionScaleX', v)}
                      min={0.001}
                      max={0.05}
                      step={0.002}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">scale y: {config.convectionScaleY.toFixed(3)}</Label>
                    <Slider
                      value={[config.convectionScaleY]}
                      onValueChange={(v) => handleChange('convectionScaleY', v)}
                      min={0.001}
                      max={0.05}
                      step={0.002}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">buoyancy: {config.buoyancy.toFixed(3)}</Label>
                    <Slider
                      value={[config.buoyancy]}
                      onValueChange={(v) => handleChange('buoyancy', v)}
                      min={0}
                      max={0.05}
                      step={0.002}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">temp diffusion: {config.temperatureDiffusion.toFixed(3)}</Label>
                    <Slider
                      value={[config.temperatureDiffusion]}
                      onValueChange={(v) => handleChange('temperatureDiffusion', v)}
                      min={0}
                      max={0.02}
                      step={0.001}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mouse Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('mouse')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.mouse ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">mouse interaction</span>
              </button>
              
              {openSections.mouse && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">radius: {config.mouseRadius}px</Label>
                    <Slider
                      value={[config.mouseRadius]}
                      onValueChange={(v) => handleChange('mouseRadius', v)}
                      min={10}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">force: {config.mouseForce.toFixed(1)}</Label>
                    <Slider
                      value={[config.mouseForce]}
                      onValueChange={(v) => handleChange('mouseForce', v)}
                      min={0}
                      max={5}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">heat: {config.mouseHeat.toFixed(2)}</Label>
                    <Slider
                      value={[config.mouseHeat]}
                      onValueChange={(v) => handleChange('mouseHeat', v)}
                      min={0}
                      max={0.5}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Boundaries Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('boundaries')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.boundaries ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">boundaries</span>
              </button>
              
              {openSections.boundaries && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">damping: {config.boundaryDamping.toFixed(2)}</Label>
                    <Slider
                      value={[config.boundaryDamping]}
                      onValueChange={(v) => handleChange('boundaryDamping', v)}
                      min={0.5}
                      max={1}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">padding: {config.boundaryPadding}px</Label>
                    <Slider
                      value={[config.boundaryPadding]}
                      onValueChange={(v) => handleChange('boundaryPadding', v)}
                      min={0}
                      max={50}
                      step={5}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Temperature Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('temperature')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.temperature ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">temperature</span>
              </button>
              
              {openSections.temperature && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">cooling rate: {config.coolingRate.toFixed(2)}</Label>
                    <Slider
                      value={[config.coolingRate]}
                      onValueChange={(v) => handleChange('coolingRate', v)}
                      min={0.8}
                      max={1}
                      step={0.02}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">heating rate: {config.heatingRate.toFixed(2)}</Label>
                    <Slider
                      value={[config.heatingRate]}
                      onValueChange={(v) => handleChange('heatingRate', v)}
                      min={1}
                      max={1.5}
                      step={0.05}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Forces Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('forces')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.forces ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">forces</span>
              </button>
              
              {openSections.forces && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">wind x: {config.windX.toFixed(3)}</Label>
                    <Slider
                      value={[config.windX]}
                      onValueChange={(v) => handleChange('windX', v)}
                      min={-0.01}
                      max={0.01}
                      step={0.001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">wind y: {config.windY.toFixed(3)}</Label>
                    <Slider
                      value={[config.windY]}
                      onValueChange={(v) => handleChange('windY', v)}
                      min={-0.01}
                      max={0.01}
                      step={0.001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">wind variation: {config.windVariation.toFixed(3)}</Label>
                    <Slider
                      value={[config.windVariation]}
                      onValueChange={(v) => handleChange('windVariation', v)}
                      min={0}
                      max={0.03}
                      step={0.002}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">gravity x: {config.gravityX.toFixed(3)}</Label>
                    <Slider
                      value={[config.gravityX]}
                      onValueChange={(v) => handleChange('gravityX', v)}
                      min={-0.001}
                      max={0.001}
                      step={0.0001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">gravity y: {config.gravityY.toFixed(3)}</Label>
                    <Slider
                      value={[config.gravityY]}
                      onValueChange={(v) => handleChange('gravityY', v)}
                      min={-0.001}
                      max={0.001}
                      step={0.0001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">gravity range: {config.gravityRange}px</Label>
                    <Slider
                      value={[config.gravityRange]}
                      onValueChange={(v) => handleChange('gravityRange', v)}
                      min={100}
                      max={800}
                      step={25}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">vortex strength: {config.vortexStrength.toFixed(3)}</Label>
                    <Slider
                      value={[config.vortexStrength]}
                      onValueChange={(v) => handleChange('vortexStrength', v)}
                      min={0}
                      max={0.02}
                      step={0.001}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">vortex radius: {config.vortexRadius}px</Label>
                    <Slider
                      value={[config.vortexRadius]}
                      onValueChange={(v) => handleChange('vortexRadius', v)}
                      min={100}
                      max={600}
                      step={20}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Obstacle Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('obstacle')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.obstacle ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">center obstacle</span>
              </button>
              
              {openSections.obstacle && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">enabled</Label>
                    <input
                      type="checkbox"
                      checked={config.obstacleEnabled}
                      onChange={(e) => handleChange('obstacleEnabled', e.target.checked ? [1] : [0])}
                      className="mt-1 h-4 w-4 cursor-pointer"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">position x: {config.obstacleX.toFixed(0)}</Label>
                    <Slider
                      value={[config.obstacleX]}
                      onValueChange={(v) => handleChange('obstacleX', v)}
                      min={-200}
                      max={200}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">position y: {config.obstacleY.toFixed(0)}</Label>
                    <Slider
                      value={[config.obstacleY]}
                      onValueChange={(v) => handleChange('obstacleY', v)}
                      min={-200}
                      max={200}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">radius: {config.obstacleRadius}px</Label>
                    <Slider
                      value={[config.obstacleRadius]}
                      onValueChange={(v) => handleChange('obstacleRadius', v)}
                      min={100}
                      max={600}
                      step={20}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">force: {config.obstacleForce.toFixed(1)}</Label>
                    <Slider
                      value={[config.obstacleForce]}
                      onValueChange={(v) => handleChange('obstacleForce', v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">heat: {config.obstacleHeat.toFixed(2)}</Label>
                    <Slider
                      value={[config.obstacleHeat]}
                      onValueChange={(v) => handleChange('obstacleHeat', v)}
                      min={0}
                      max={0.2}
                      step={0.02}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Corona/Slope Section */}
            <div className="mb-4">
              <button
                onClick={() => toggleSection('corona')}
                className="flex items-center gap-2 w-full text-left mb-2 hover:text-white/80"
              >
                {openSections.corona ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span className="text-sm font-medium">corona/slope</span>
              </button>
              
              {openSections.corona && (
                <div className="space-y-3 pl-6">
                  <div>
                    <Label className="text-xs text-white/60">inner boundary: {config.innerBoundary}px</Label>
                    <Slider
                      value={[config.innerBoundary]}
                      onValueChange={(v) => handleChange('innerBoundary', v)}
                      min={50}
                      max={500}
                      step={10}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">outer boundary: {config.outerBoundary}px</Label>
                    <Slider
                      value={[config.outerBoundary]}
                      onValueChange={(v) => handleChange('outerBoundary', v)}
                      min={300}
                      max={2000}
                      step={50}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-white/60">slope sharpness: {config.slopeSharpness.toFixed(1)}</Label>
                    <Slider
                      value={[config.slopeSharpness]}
                      onValueChange={(v) => handleChange('slopeSharpness', v)}
                      min={0.5}
                      max={8}
                      step={0.5}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
        </div>
      </Card>
  );
}