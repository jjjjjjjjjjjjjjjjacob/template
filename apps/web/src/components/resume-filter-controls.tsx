import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Settings, Filter, Eye } from 'lucide-react';
import {
  type ResumeFilters,
  type FocusArea,
  type Domain,
  type Technology,
  useResumeFilterNavigation,
} from '@/hooks/use-resume-filter';

interface ResumeFilterControlsProps {
  currentFilters: ResumeFilters;
  className?: string;
}

const focusAreaOptions: {
  value: FocusArea;
  label: string;
  description: string;
}[] = [
  {
    value: 'frontend',
    label: 'Frontend',
    description: 'React, UI/UX, 3D graphics',
  },
  {
    value: 'backend',
    label: 'Backend',
    description: 'APIs, databases, architecture',
  },
  {
    value: 'fullstack',
    label: 'Full-Stack',
    description: 'End-to-end development',
  },
  {
    value: 'leadership',
    label: 'Leadership',
    description: 'Technical leadership, architecture',
  },
  {
    value: 'product',
    label: 'Product',
    description: 'Product development, founding',
  },
  {
    value: '3d-graphics',
    label: '3D Graphics',
    description: 'Three.js, WebGL, animation',
  },
  {
    value: 'realtime',
    label: 'Real-time',
    description: 'WebSocket, live updates',
  },
];

const domainOptions: { value: Domain; label: string }[] = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: '3d', label: '3D Graphics' },
  { value: 'payments', label: 'Payments' },
  { value: 'realtime', label: 'Real-time' },
  { value: 'auth', label: 'Authentication' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'social', label: 'Social Platform' },
  { value: 'testing', label: 'Testing' },
  { value: 'devops', label: 'DevOps' },
];

const technologyOptions = [
  'React',
  'TypeScript',
  'Three.js',
  'NestJS',
  'Convex',
  'AWS',
  'Terraform',
  'TanStack Start',
  'PostgreSQL',
  'Stripe',
  'Auth0',
  'Clerk',
  'Tailwind CSS',
  'Docker',
  'Cloudflare',
  'WebGL',
  'Node.js',
  'Python',
  'Nx',
];

const quickPresets: { name: string; filters: Partial<ResumeFilters> }[] = [
  {
    name: 'Frontend Focus',
    filters: {
      focus: ['frontend', '3d-graphics'],
      technologies: ['React', 'TypeScript', 'Three.js', 'Tailwind CSS'],
      domains: ['frontend', '3d'],
    },
  },
  {
    name: 'Backend Focus',
    filters: {
      focus: ['backend', 'fullstack'],
      technologies: ['NestJS', 'PostgreSQL', 'Convex', 'AWS'],
      domains: ['backend', 'infrastructure'],
    },
  },
  {
    name: 'Leadership',
    filters: {
      focus: ['leadership', 'fullstack'],
      domains: ['infrastructure', 'marketplace', 'social'],
      priority: 8,
    },
  },
  {
    name: '3D Specialist',
    filters: {
      focus: ['3d-graphics', 'frontend'],
      technologies: ['Three.js', 'WebGL', 'React'],
      domains: ['3d', 'frontend'],
    },
  },
  {
    name: 'Real-time Systems',
    filters: {
      focus: ['realtime', 'backend'],
      technologies: ['Convex', 'WebSocket', 'TanStack Query'],
      domains: ['realtime', 'social'],
    },
  },
];

export function ResumeFilterControls({
  currentFilters,
  className = '',
}: ResumeFilterControlsProps) {
  const navigate = useNavigate();
  const { createFilterUrl } = useResumeFilterNavigation();
  const [localFilters, setLocalFilters] =
    useState<Partial<ResumeFilters>>(currentFilters);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const applyFilters = (filters: Partial<ResumeFilters>) => {
    const url = createFilterUrl(filters);
    navigate({ to: url });
    setIsDialogOpen(false);
  };

  const applyPreset = (preset: {
    name: string;
    filters: Partial<ResumeFilters>;
  }) => {
    setLocalFilters(preset.filters);
    applyFilters(preset.filters);
  };

  const clearFilters = () => {
    setLocalFilters({});
    navigate({ to: '/' });
    setIsDialogOpen(false);
  };

  const toggleFocusArea = (focus: FocusArea) => {
    const currentFocus = localFilters.focus || [];
    const newFocus = currentFocus.includes(focus)
      ? currentFocus.filter((f) => f !== focus)
      : [...currentFocus, focus];

    setLocalFilters({ ...localFilters, focus: newFocus });
  };

  const toggleDomain = (domain: Domain) => {
    const currentDomains = localFilters.domains || [];
    const newDomains = currentDomains.includes(domain)
      ? currentDomains.filter((d) => d !== domain)
      : [...currentDomains, domain];

    setLocalFilters({ ...localFilters, domains: newDomains });
  };

  const toggleTechnology = (tech: Technology) => {
    const currentTech = localFilters.technologies || [];
    const newTech = currentTech.includes(tech)
      ? currentTech.filter((t) => t !== tech)
      : [...currentTech, tech];

    setLocalFilters({ ...localFilters, technologies: newTech });
  };

  const hasActiveFilters = Object.keys(currentFilters).some(
    (key) => key !== 'format' && currentFilters[key as keyof ResumeFilters]
  );

  const FilterDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${hasActiveFilters ? 'border-primary text-primary' : ''}`}
        >
          <Filter className="mr-2 h-4 w-4" />
          {hasActiveFilters ? 'filters active' : 'customize resume'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>customize resume content</DialogTitle>
          <DialogDescription>
            tailor your resume to highlight specific skills, technologies, and
            experience areas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Presets */}
          <div>
            <h3 className="mb-3 font-light">quick presets</h3>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <h3 className="mb-3 font-light">focus areas</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {focusAreaOptions.map((option) => (
                <div
                  key={option.value}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    (localFilters.focus || []).includes(option.value)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleFocusArea(option.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleFocusArea(option.value);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={(localFilters.focus || []).includes(
                    option.value
                  )}
                >
                  <div className="text-sm font-light">{option.label}</div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {option.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technologies */}
          <div>
            <h3 className="mb-3 font-light">key technologies</h3>
            <div className="flex flex-wrap gap-2">
              {technologyOptions.map((tech) => (
                <Badge
                  key={tech}
                  variant={
                    (localFilters.technologies || []).includes(tech)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleTechnology(tech)}
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Domains */}
          <div>
            <h3 className="mb-3 font-light">domains</h3>
            <div className="flex flex-wrap gap-2">
              {domainOptions.map((domain) => (
                <Badge
                  key={domain.value}
                  variant={
                    (localFilters.domains || []).includes(domain.value)
                      ? 'default'
                      : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleDomain(domain.value)}
                >
                  {domain.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Priority Level */}
          <div>
            <h3 className="mb-3 font-light">experience level</h3>
            <div className="flex gap-2">
              {[
                { value: 6, label: 'all experience' },
                { value: 7, label: 'significant projects' },
                { value: 8, label: 'major achievements' },
                { value: 9, label: 'top highlights' },
              ].map((level) => (
                <Button
                  key={level.value}
                  variant={
                    localFilters.priority === level.value
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    setLocalFilters({ ...localFilters, priority: level.value })
                  }
                >
                  {level.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Format Options */}
          <div>
            <h3 className="mb-3 font-light">format</h3>
            <div className="flex gap-2">
              {[
                { value: 'web', label: 'interactive web' },
                { value: 'detailed', label: 'detailed view' },
                { value: 'minimal', label: 'minimal/clean' },
                { value: 'pdf', label: 'pdf export' },
              ].map((format) => (
                <Button
                  key={format.value}
                  variant={
                    localFilters.format === format.value ? 'default' : 'outline'
                  }
                  size="sm"
                  onClick={() =>
                    setLocalFilters({
                      ...localFilters,
                      format: format.value as
                        | 'web'
                        | 'pdf'
                        | 'minimal'
                        | 'detailed',
                    })
                  }
                >
                  {format.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t pt-4">
            <Button onClick={() => applyFilters(localFilters)}>
              <Eye className="mr-2 h-4 w-4" />
              preview changes
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              clear filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const MobileFilterPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`md:hidden ${hasActiveFilters ? 'border-primary text-primary' : ''}`}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-light">quick presets</h4>
            <div className="space-y-1">
              {quickPresets.slice(0, 3).map((preset) => (
                <Button
                  key={preset.name}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => applyPreset(preset)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="w-full"
            size="sm"
          >
            full customization
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="hidden md:block">
        <FilterDialog />
      </div>
      <MobileFilterPopover />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          clear
        </Button>
      )}
    </div>
  );
}
