import { useRef, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';
import { cn } from '@/utils/tailwind-utils';

interface EditableTextProps {
  fieldName: string;
  value: string;
  inputClassName?: string;
  inputLabel: string;
  buttonClassName?: string;
  buttonLabel: string;
  onChange: (value: string) => void;
  editState?: [boolean, (value: boolean) => void];
  // Enhanced props
  placeholder?: string;
  maxLength?: number;
  validateValue?: (value: string) => string | null; // Returns error message or null if valid
  multiline?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
  confirmOnBlur?: boolean;
  // Styling
  variant?: 'default' | 'subtle' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  // Accessibility
  'aria-describedby'?: string;
  // Callbacks
  onEditStart?: () => void;
  onEditEnd?: (value: string, cancelled: boolean) => void;
}

export function EditableText({
  fieldName,
  value,
  inputClassName,
  inputLabel,
  buttonClassName,
  buttonLabel,
  onChange,
  editState,
  placeholder,
  maxLength,
  validateValue,
  multiline = false,
  disabled = false,
  autoFocus = true,
  selectAllOnFocus = true,
  confirmOnBlur = true,
  variant = 'default',
  size = 'md',
  'aria-describedby': ariaDescribedBy,
  onEditStart,
  onEditEnd,
}: EditableTextProps) {
  const localEditState = useState(false);
  const [edit, setEdit] = editState || localEditState;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [originalValue, setOriginalValue] = useState(value);

  // Handle auto-focus and selection when entering edit mode
  useEffect(() => {
    if (edit && inputRef.current && autoFocus) {
      inputRef.current.focus();
      if (selectAllOnFocus) {
        inputRef.current.select();
      }
    }
  }, [edit, autoFocus, selectAllOnFocus]);

  // Store original value when entering edit mode
  useEffect(() => {
    if (edit) {
      setOriginalValue(value);
      setError(null);
      onEditStart?.();
    }
  }, [edit, value, onEditStart]);

  const handleSave = (newValue: string, cancelled = false) => {
    // Validate if not cancelled
    if (!cancelled && validateValue) {
      const validationError = validateValue(newValue);
      if (validationError) {
        setError(validationError);
        return false; // Don't close edit mode
      }
    }

    setError(null);

    // Only call onChange if value actually changed and not cancelled
    if (!cancelled && newValue !== originalValue) {
      onChange(newValue);
    }

    flushSync(() => {
      setEdit(false);
    });

    onEditEnd?.(newValue, cancelled);
    buttonRef.current?.focus();
    return true;
  };

  const handleCancel = () => {
    handleSave(originalValue, true);
  };

  const getDefaultClasses = () => {
    const baseClasses =
      'rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-3 text-base',
    };

    return cn(baseClasses, sizeClasses[size]);
  };

  const getButtonClasses = () => {
    const baseClasses =
      'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

    const variantClasses = {
      default:
        'hover:bg-accent hover:text-accent-foreground rounded-md border border-transparent px-3 py-2',
      subtle: 'hover:bg-muted rounded-md px-2 py-1',
      ghost: 'hover:bg-accent hover:text-accent-foreground rounded-md px-1',
    };

    const sizeClasses = {
      sm: 'text-xs min-h-[1.5rem]',
      md: 'text-sm min-h-[2rem]',
      lg: 'text-base min-h-[2.5rem]',
    };

    return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
  };

  return edit ? (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const newValue = inputRef.current!.value;
        handleSave(newValue);
      }}
      className="space-y-2"
    >
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          aria-label={inputLabel}
          aria-describedby={ariaDescribedBy}
          name={fieldName}
          defaultValue={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            inputClassName || getDefaultClasses(),
            'resize-vertical min-h-[80px]',
            error && 'border-destructive'
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              handleCancel();
            } else if (
              event.key === 'Enter' &&
              (event.metaKey || event.ctrlKey)
            ) {
              event.preventDefault();
              const newValue = inputRef.current!.value;
              handleSave(newValue);
            }
          }}
          onBlur={(event) => {
            if (confirmOnBlur) {
              const newValue = event.target.value.trim();
              if (newValue || !value) {
                handleSave(newValue);
              } else {
                handleCancel();
              }
            }
          }}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          aria-label={inputLabel}
          aria-describedby={ariaDescribedBy}
          name={fieldName}
          defaultValue={value}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          className={cn(
            inputClassName || getDefaultClasses(),
            error && 'border-destructive'
          )}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              handleCancel();
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const newValue = inputRef.current!.value;
              handleSave(newValue);
            }
          }}
          onBlur={(event) => {
            if (confirmOnBlur) {
              const newValue = event.target.value.trim();
              if (newValue || !value) {
                handleSave(newValue);
              } else {
                handleCancel();
              }
            }
          }}
        />
      )}

      {error && (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}

      <div className="text-muted-foreground flex gap-2 text-xs">
        <span>
          press {multiline ? 'cmd+enter' : 'enter'} to save, esc to cancel
        </span>
        {maxLength && (
          <span className="ml-auto">
            {inputRef.current?.value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </form>
  ) : (
    <button
      aria-label={buttonLabel}
      type="button"
      ref={buttonRef}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          flushSync(() => {
            setEdit(true);
          });
        }
      }}
      className={cn(
        buttonClassName || getButtonClasses(),
        disabled && 'cursor-not-allowed opacity-50',
        'block w-full text-left'
      )}
    >
      <span
        className={cn(
          'block truncate',
          !value && 'text-muted-foreground italic'
        )}
      >
        {value || placeholder || 'click to edit'}
      </span>
    </button>
  );
}

// Helper hook for managing editable text state
export function useEditableText(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const editState: [boolean, (value: boolean) => void] = [
    isEditing,
    setIsEditing,
  ];

  return {
    value,
    setValue,
    isEditing,
    editState,
  };
}
