import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';

export interface DynamicPlaceholderInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholders?: string[];
  placeholder?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  rotationInterval?: number; // milliseconds
  animationDuration?: number; // milliseconds
  pauseOnFocus?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  inputClassName?: string;
  name?: string;
  id?: string;
  type?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function DynamicPlaceholderInput({
  value = '',
  onChange,
  placeholders = [
    'start typing...',
    "what's on your mind?",
    'share your thoughts...',
    'tell us more...',
  ],
  placeholder,
  label,
  description,
  required = false,
  disabled = false,
  multiline = false,
  rows = 3,
  rotationInterval = 3000,
  animationDuration = 500,
  pauseOnFocus = true,
  pauseOnHover = false,
  className,
  inputClassName,
  name,
  id,
  type = 'text',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: DynamicPlaceholderInputProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] =
    React.useState(0);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const intervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // Use static placeholder if provided, otherwise use dynamic placeholders
  const effectivePlaceholders = placeholder ? [placeholder] : placeholders;
  const shouldRotate = !placeholder && placeholders.length > 1;
  const shouldPause =
    (pauseOnFocus && isFocused) || (pauseOnHover && isHovered);

  const handleChange = React.useCallback(
    (newValue: string) => {
      if (isControlled) {
        onChange?.(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [isControlled, onChange]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleChange(e.target.value);
  };

  const rotatePlaceholder = React.useCallback(() => {
    if (!shouldRotate || shouldPause || currentValue.length > 0) {
      return;
    }

    setIsAnimating(true);

    timeoutRef.current = setTimeout(() => {
      setCurrentPlaceholderIndex(
        (prev) => (prev + 1) % effectivePlaceholders.length
      );
      setIsAnimating(false);
    }, animationDuration / 2);
  }, [
    shouldRotate,
    shouldPause,
    currentValue.length,
    effectivePlaceholders.length,
    animationDuration,
  ]);

  // Set up rotation interval
  React.useEffect(() => {
    if (!shouldRotate || shouldPause) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      return;
    }

    intervalRef.current = setInterval(rotatePlaceholder, rotationInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [rotatePlaceholder, rotationInterval, shouldRotate, shouldPause]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const currentPlaceholder =
    effectivePlaceholders[currentPlaceholderIndex] || effectivePlaceholders[0];

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsHovered(false);
    }
  };

  const generatedId = React.useId();
  const inputId = id || `dynamic-placeholder-input-${generatedId}`;
  const descriptionId = `${inputId}-description`;
  const fullAriaDescribedBy =
    [ariaDescribedBy, description ? descriptionId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  const InputComponent = multiline ? Textarea : Input;
  const inputProps = {
    id: inputId,
    name,
    type: multiline ? undefined : type,
    value: currentValue,
    onChange: handleInputChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    placeholder: currentPlaceholder,
    required,
    disabled,
    className: cn(
      // Smooth placeholder transition
      'transition-all duration-300 ease-in-out',
      // Animate placeholder opacity during rotation
      isAnimating && 'placeholder:opacity-50',
      inputClassName
    ),
    'aria-label': ariaLabel,
    'aria-describedby': fullAriaDescribedBy,
    ...(multiline && { rows }),
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId} className="text-sm font-light">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}

      {description && (
        <p id={descriptionId} className="text-muted-foreground text-sm">
          {description}
        </p>
      )}

      <div className="relative">
        <InputComponent {...inputProps} />

        {/* Visual indicator for dynamic placeholders */}
        {shouldRotate && effectivePlaceholders.length > 1 && (
          <div className="absolute right-1 bottom-1 flex space-x-1">
            {effectivePlaceholders.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-all duration-300',
                  index === currentPlaceholderIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30'
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        )}
      </div>

      {/* Screen reader friendly rotation announcement */}
      {shouldRotate && (
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
          key={currentPlaceholderIndex}
        >
          placeholder changed to: {currentPlaceholder}
        </div>
      )}
    </div>
  );
}

export function useDynamicPlaceholder(
  placeholders: string[],
  options: {
    rotationInterval?: number;
    pauseOnFocus?: boolean;
    autoStart?: boolean;
  } = {}
) {
  const { rotationInterval = 3000, autoStart = true } = options;

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(autoStart);
  const [isPaused, setIsPaused] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | undefined>(
    undefined
  );

  const rotate = React.useCallback(() => {
    if (placeholders.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % placeholders.length);
  }, [placeholders.length]);

  const start = React.useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = React.useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const pause = React.useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = React.useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = React.useCallback(() => {
    setCurrentIndex(0);
  }, []);

  React.useEffect(() => {
    if (!isRunning || isPaused || placeholders.length <= 1) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(rotate, rotationInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, rotate, rotationInterval, placeholders.length]);

  React.useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    currentPlaceholder: placeholders[currentIndex] || placeholders[0],
    currentIndex,
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    reset,
    rotate,
  };
}
