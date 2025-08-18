import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

export interface MultiStepFormStep {
  id: string;
  title: string;
  description?: string;
  isValid?: boolean;
  isOptional?: boolean;
  content: React.ReactNode;
}

export interface MultiStepFormProps {
  steps: MultiStepFormStep[];
  currentStep?: number;
  onStepChange?: (stepIndex: number) => void;
  onComplete?: () => void;
  onCancel?: () => void;
  allowStepNavigation?: boolean;
  showProgress?: boolean;
  showStepList?: boolean;
  className?: string;
  children?: React.ReactNode;
  'aria-label'?: string;
}

export function MultiStepForm({
  steps,
  currentStep: controlledCurrentStep,
  onStepChange,
  onComplete,
  onCancel,
  allowStepNavigation = false,
  showProgress = true,
  showStepList = true,
  className,
  children,
  'aria-label': ariaLabel = 'multi-step form',
}: MultiStepFormProps) {
  const [internalCurrentStep, setInternalCurrentStep] = React.useState(0);

  const currentStep =
    controlledCurrentStep !== undefined
      ? controlledCurrentStep
      : internalCurrentStep;
  const isControlled = controlledCurrentStep !== undefined;

  const handleStepChange = React.useCallback(
    (stepIndex: number) => {
      if (onStepChange) {
        onStepChange(stepIndex);
      }
      if (!isControlled) {
        setInternalCurrentStep(stepIndex);
      }
    },
    [onStepChange, isControlled]
  );

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const completedSteps = steps
    .slice(0, currentStep)
    .filter((step) => step.isValid !== false);
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete?.();
    } else {
      handleStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      handleStepChange(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    if (!allowStepNavigation) return;

    if (stepIndex < currentStep || steps[stepIndex].isOptional) {
      handleStepChange(stepIndex);
    }
  };

  const getStepStatus = (stepIndex: number, step: MultiStepFormStep) => {
    if (stepIndex < currentStep) {
      return step.isValid !== false ? 'completed' : 'error';
    }
    if (stepIndex === currentStep) {
      return 'current';
    }
    return 'pending';
  };

  const canProceed = !currentStepData || currentStepData.isValid !== false;

  return (
    <div
      className={cn('space-y-6', className)}
      role="form"
      aria-label={ariaLabel}
    >
      {showProgress && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-muted-foreground">
              {Math.round(progressPercentage)}% complete
            </span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2"
            aria-label={`progress: ${Math.round(progressPercentage)}% complete`}
          />
        </div>
      )}

      {showStepList && (
        <div className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">steps</h3>
          <div className="space-y-1">
            {steps.map((step, index) => {
              const status = getStepStatus(index, step);
              const isClickable =
                allowStepNavigation && (index < currentStep || step.isOptional);

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 rounded-md p-2 transition-colors',
                    isClickable && 'hover:bg-accent cursor-pointer',
                    status === 'current' && 'bg-accent',
                    !isClickable && 'cursor-default'
                  )}
                  onClick={() => handleStepClick(index)}
                  role={isClickable ? 'button' : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={(e) => {
                    if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleStepClick(index);
                    }
                  }}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors',
                      status === 'completed' &&
                        'bg-primary text-primary-foreground',
                      status === 'current' &&
                        'bg-primary text-primary-foreground',
                      status === 'error' &&
                        'bg-destructive text-destructive-foreground',
                      status === 'pending' && 'bg-muted text-muted-foreground'
                    )}
                    aria-hidden="true"
                  >
                    {status === 'completed' ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          status === 'current' && 'text-foreground',
                          status === 'completed' && 'text-foreground',
                          status === 'error' && 'text-destructive',
                          status === 'pending' && 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </span>
                      {step.isOptional && (
                        <Badge variant="secondary" className="text-xs">
                          optional
                        </Badge>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{currentStepData?.title}</CardTitle>
          {currentStepData?.description && (
            <CardDescription>{currentStepData.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div role="tabpanel" aria-labelledby={`step-${currentStep}-title`}>
            {currentStepData?.content}
          </div>

          {children}

          <div className="flex items-center justify-between border-t pt-4">
            <div>
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevious}
                  className="gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  previous
                </Button>
              )}
              {isFirstStep && onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  cancel
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isLastStep ? (
                <Button
                  type="submit"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  complete
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                  className="gap-2"
                >
                  next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function useMultiStepForm(steps: MultiStepFormStep[]) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [stepData, setStepData] = React.useState<Record<string, any>>({});

  const updateStepData = React.useCallback((stepId: string, data: any) => {
    setStepData((prev) => ({
      ...prev,
      [stepId]: { ...prev[stepId], ...data },
    }));
  }, []);

  const validateStep = React.useCallback(
    (stepIndex: number): boolean => {
      const step = steps[stepIndex];
      if (!step) return false;

      return step.isValid !== false;
    },
    [steps]
  );

  const goToNext = React.useCallback(() => {
    if (currentStep < steps.length - 1 && validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      return true;
    }
    return false;
  }, [currentStep, steps.length, validateStep]);

  const goToPrevious = React.useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      return true;
    }
    return false;
  }, [currentStep]);

  const goToStep = React.useCallback(
    (stepIndex: number) => {
      if (stepIndex >= 0 && stepIndex < steps.length) {
        setCurrentStep(stepIndex);
        return true;
      }
      return false;
    },
    [steps.length]
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = validateStep(currentStep);
  const progress = ((currentStep + 1) / steps.length) * 100;

  return {
    currentStep,
    stepData,
    updateStepData,
    goToNext,
    goToPrevious,
    goToStep,
    validateStep,
    isFirstStep,
    isLastStep,
    canProceed,
    progress,
  };
}
