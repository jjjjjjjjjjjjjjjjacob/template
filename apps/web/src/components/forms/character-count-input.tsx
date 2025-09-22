import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';

export interface CharacterCountInputProps {
  value?: string;
  onChange?: (value: string) => void;
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  label?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
  showCount?: boolean;
  showRemaining?: boolean;
  warningThreshold?: number; // percentage at which to show warning (e.g., 80 for 80%)
  className?: string;
  inputClassName?: string;
  name?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export function CharacterCountInput({
  value = '',
  onChange,
  maxLength = 280,
  minLength,
  placeholder,
  label,
  description,
  required = false,
  disabled = false,
  multiline = false,
  rows = 3,
  showCount = true,
  showRemaining = false,
  warningThreshold = 90,
  className,
  inputClassName,
  name,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}: CharacterCountInputProps) {
  const [internalValue, setInternalValue] = React.useState(value);
  const [isFocused, setIsFocused] = React.useState(false);

  const isControlled = value !== undefined && onChange !== undefined;
  const currentValue = isControlled ? value : internalValue;
  const currentLength = currentValue.length;

  const handleChange = React.useCallback(
    (newValue: string) => {
      // Enforce max length if specified
      const trimmedValue = maxLength ? newValue.slice(0, maxLength) : newValue;

      if (isControlled) {
        onChange?.(trimmedValue);
      } else {
        setInternalValue(trimmedValue);
      }
    },
    [isControlled, onChange, maxLength]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    handleChange(e.target.value);
  };

  const remaining = maxLength ? maxLength - currentLength : 0;
  const percentage = maxLength ? (currentLength / maxLength) * 100 : 0;
  const isWarning = percentage >= warningThreshold;
  const isOverLimit = maxLength ? currentLength > maxLength : false;
  const isUnderMinimum = minLength ? currentLength < minLength : false;

  const getCountColor = () => {
    if (isOverLimit) return 'text-destructive';
    if (isWarning) return 'text-orange-600';
    return 'text-muted-foreground';
  };

  const generatedId = React.useId();
  const inputId = id || `character-count-input-${generatedId}`;
  const descriptionId = `${inputId}-description`;
  const countId = `${inputId}-count`;
  const fullAriaDescribedBy =
    [
      ariaDescribedBy,
      description ? descriptionId : undefined,
      showCount || showRemaining ? countId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

  const InputComponent = multiline ? Textarea : Input;
  const inputProps = {
    id: inputId,
    name,
    value: currentValue,
    onChange: handleInputChange,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
    placeholder,
    required,
    disabled,
    maxLength: maxLength || undefined,
    className: cn(
      isOverLimit && 'border-destructive focus-visible:ring-destructive',
      isWarning &&
        !isOverLimit &&
        'border-orange-500 focus-visible:ring-orange-500',
      inputClassName
    ),
    'aria-label': ariaLabel,
    'aria-describedby': fullAriaDescribedBy,
    'aria-invalid': isOverLimit || isUnderMinimum,
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

        {(showCount || showRemaining) && (isFocused || currentLength > 0) && (
          <div
            id={countId}
            className={cn(
              'pointer-events-none absolute right-2 bottom-2 text-xs font-light',
              'bg-background/80 rounded px-1.5 py-0.5 backdrop-blur-sm',
              getCountColor()
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {showRemaining && maxLength
              ? remaining >= 0
                ? `${remaining} remaining`
                : `${Math.abs(remaining)} over limit`
              : showCount &&
                (maxLength ? `${currentLength}/${maxLength}` : currentLength)}
          </div>
        )}
      </div>

      {/* Validation messages */}
      <div className="space-y-1">
        {isOverLimit && (
          <p className="text-destructive text-xs" role="alert">
            text exceeds maximum length of {maxLength} characters
          </p>
        )}
        {isUnderMinimum && minLength && currentLength > 0 && (
          <p className="text-destructive text-xs" role="alert">
            minimum {minLength} characters required
          </p>
        )}
        {isWarning && !isOverLimit && (
          <p className="text-xs text-orange-600" role="alert">
            approaching character limit
          </p>
        )}
      </div>

      {/* Progress bar for visual indication */}
      {maxLength && (isFocused || currentLength > 0) && (
        <div className="bg-muted h-1 w-full rounded-full">
          <div
            className={cn(
              'h-1 rounded-full transition-all duration-200',
              isOverLimit
                ? 'bg-destructive'
                : isWarning
                  ? 'bg-orange-500'
                  : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
            role="progressbar"
            aria-valuenow={currentLength}
            aria-valuemin={0}
            aria-valuemax={maxLength}
            aria-label={`character count: ${currentLength} of ${maxLength}`}
          />
        </div>
      )}
    </div>
  );
}

export function useCharacterCount(maxLength?: number) {
  const [value, setValue] = React.useState('');

  const currentLength = value.length;
  const remaining = maxLength ? maxLength - currentLength : Infinity;
  const percentage = maxLength ? (currentLength / maxLength) * 100 : 0;
  const isValid = maxLength ? currentLength <= maxLength : true;

  const updateValue = React.useCallback(
    (newValue: string) => {
      if (maxLength) {
        setValue(newValue.slice(0, maxLength));
      } else {
        setValue(newValue);
      }
    },
    [maxLength]
  );

  const clear = React.useCallback(() => {
    setValue('');
  }, []);

  return {
    value,
    setValue: updateValue,
    clear,
    currentLength,
    remaining,
    percentage,
    isValid,
  };
}
