import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/tailwind-utils';

export type ValidationRule<T = unknown> = {
  name: string;
  validator: (value: T) => boolean | Promise<boolean>;
  message: string;
  level?: 'error' | 'warning';
};

export type FieldValidationState = {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  errors: string[];
  warnings: string[];
};

export type FormValidationState = {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  fields: Record<string, FieldValidationState>;
};

// Validation utilities
export const validators = {
  required: (message = 'this field is required'): ValidationRule => ({
    name: 'required',
    validator: (value: unknown) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value != null && value !== '';
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      return !stringValue || stringValue.length >= min;
    },
    message: message || `minimum ${min} characters required`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      return !stringValue || stringValue.length <= max;
    },
    message: message || `maximum ${max} characters allowed`,
  }),

  email: (message = 'please enter a valid email address'): ValidationRule => ({
    name: 'email',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      if (!stringValue) return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(stringValue);
    },
    message,
  }),

  url: (message = 'please enter a valid url'): ValidationRule => ({
    name: 'url',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      if (!stringValue) return true;
      try {
        new URL(stringValue);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule => ({
    name: 'pattern',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      return !stringValue || regex.test(stringValue);
    },
    message,
  }),

  numeric: (message = 'please enter a valid number'): ValidationRule => ({
    name: 'numeric',
    validator: (value: unknown) => {
      const stringValue = String(value || '');
      return !stringValue || !isNaN(Number(stringValue));
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    validator: (value: unknown) => {
      const num = Number(value);
      return isNaN(num) || num >= min;
    },
    message: message || `minimum value is ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    validator: (value: unknown) => {
      const num = Number(value);
      return isNaN(num) || num <= max;
    },
    message: message || `maximum value is ${max}`,
  }),

  custom: (
    validator: (value: unknown) => boolean | Promise<boolean>,
    message: string
  ): ValidationRule => ({
    name: 'custom',
    validator,
    message,
  }),

  async: (
    validator: (value: unknown) => Promise<boolean>,
    message: string
  ): ValidationRule => ({
    name: 'async',
    validator,
    message,
  }),
};

// Form validation hook
export function useFormValidation<T extends Record<string, unknown>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, ValidationRule[]>> = {}
) {
  const [values, setValues] = React.useState<T>(initialValues);
  const [fieldStates, setFieldStates] = React.useState<
    Record<string, FieldValidationState>
  >({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateField = React.useCallback(
    async (
      fieldName: keyof T,
      value: unknown,
      touch = false
    ): Promise<FieldValidationState> => {
      const rules = validationRules[fieldName] || [];
      const currentState = fieldStates[fieldName as string] || {
        isValid: true,
        isDirty: false,
        isTouched: false,
        isValidating: false,
        errors: [],
        warnings: [],
      };

      const newState: FieldValidationState = {
        ...currentState,
        isValidating: true,
        isTouched: touch || currentState.isTouched,
        isDirty: value !== initialValues[fieldName],
      };

      const errors: string[] = [];
      const warnings: string[] = [];

      for (const rule of rules) {
        try {
          const isValid = await rule.validator(value);
          if (!isValid) {
            if (rule.level === 'warning') {
              warnings.push(rule.message);
            } else {
              errors.push(rule.message);
            }
          }
        } catch {
          errors.push('validation error occurred');
        }
      }

      newState.errors = errors;
      newState.warnings = warnings;
      newState.isValid = errors.length === 0;
      newState.isValidating = false;

      setFieldStates((prev) => ({
        ...prev,
        [fieldName as string]: newState,
      }));

      return newState;
    },
    [validationRules, fieldStates, initialValues]
  );

  const setValue = React.useCallback(
    async (fieldName: keyof T, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      await validateField(fieldName, value);
    },
    [validateField]
  );

  const updateValues = React.useCallback(
    (newValues: Partial<T>) => {
      setValues((prev) => ({ ...prev, ...newValues }));
      // Validate all changed fields
      Object.entries(newValues).forEach(([fieldName, value]) => {
        validateField(fieldName as keyof T, value);
      });
    },
    [validateField]
  );

  const touchField = React.useCallback(
    async (fieldName: keyof T) => {
      const value = values[fieldName];
      await validateField(fieldName, value, true);
    },
    [values, validateField]
  );

  const validateForm = React.useCallback(async (): Promise<boolean> => {
    const validationPromises = Object.keys(values).map(async (fieldName) => {
      const value = values[fieldName as keyof T];
      return validateField(fieldName as keyof T, value, true);
    });

    const results = await Promise.all(validationPromises);
    return results.every((state) => state.isValid);
  }, [values, validateField]);

  const reset = React.useCallback(() => {
    setValues(initialValues);
    setFieldStates({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = React.useCallback(
    async (onSubmit: (values: T) => Promise<void> | void) => {
      setIsSubmitting(true);

      try {
        const isValid = await validateForm();
        if (isValid) {
          await onSubmit(values);
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validateForm]
  );

  const formState: FormValidationState = React.useMemo(() => {
    const fieldValues = Object.values(fieldStates);
    return {
      isValid: fieldValues.every((field) => field.isValid),
      isDirty: fieldValues.some((field) => field.isDirty),
      isSubmitting,
      fields: fieldStates,
    };
  }, [fieldStates, isSubmitting]);

  return {
    values,
    setValue,
    setValues: updateValues,
    touchField,
    validateField,
    validateForm,
    reset,
    handleSubmit,
    formState,
    fieldStates,
  };
}

// Validation context for form-wide state
export const FormValidationContext = React.createContext<{
  formState: FormValidationState;
  fieldStates: Record<string, FieldValidationState>;
  touchField: (fieldName: string) => void;
  validateField: (
    fieldName: string,
    value: unknown
  ) => Promise<FieldValidationState>;
} | null>(null);

export function useFormValidationContext() {
  const context = React.useContext(FormValidationContext);
  if (!context) {
    throw new Error(
      'useFormValidationContext must be used within FormValidationProvider'
    );
  }
  return context;
}

// Validated input wrapper component
export interface ValidatedInputProps {
  name: string;
  label?: string;
  children: React.ReactElement;
  className?: string;
  showErrors?: boolean;
  showWarnings?: boolean;
}

export function ValidatedInput({
  name,
  label,
  children,
  className,
  showErrors = true,
  showWarnings = true,
}: ValidatedInputProps) {
  const context = React.useContext(FormValidationContext);
  const fieldState = context?.fieldStates[name];

  const hasErrors = fieldState?.errors && fieldState.errors.length > 0;
  const hasWarnings = fieldState?.warnings && fieldState.warnings.length > 0;
  const shouldShowErrors = showErrors && fieldState?.isTouched && hasErrors;
  const shouldShowWarnings =
    showWarnings && fieldState?.isTouched && hasWarnings && !hasErrors;

  const inputId = `validated-input-${name}`;
  const errorId = `${inputId}-error`;
  const warningId = `${inputId}-warning`;

  const enhancedChild = React.cloneElement(
    children as React.ReactElement<Record<string, unknown>>,
    {
      id: inputId,
      name,
      'aria-invalid': hasErrors ? 'true' : ('false' as const),
      'aria-describedby':
        [
          (children.props as { 'aria-describedby'?: string })[
            'aria-describedby'
          ],
          shouldShowErrors ? errorId : undefined,
          shouldShowWarnings ? warningId : undefined,
        ]
          .filter(Boolean)
          .join(' ') || undefined,
      className: cn(
        (children.props as { className?: string }).className,
        hasErrors && 'border-destructive focus-visible:ring-destructive',
        hasWarnings &&
          !hasErrors &&
          'border-orange-500 focus-visible:ring-orange-500'
      ),
      onBlur: (e: React.FocusEvent) => {
        (children.props as { onBlur?: (e: React.FocusEvent) => void }).onBlur?.(
          e
        );
        context?.touchField(name);
      },
    }
  );

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={inputId} className="text-sm font-medium">
          {label}
        </Label>
      )}

      {enhancedChild}

      {shouldShowErrors && (
        <div id={errorId} className="space-y-1" role="alert">
          {fieldState.errors.map((error, index) => (
            <p key={index} className="text-destructive text-xs">
              {error}
            </p>
          ))}
        </div>
      )}

      {shouldShowWarnings && (
        <div id={warningId} className="space-y-1">
          {fieldState.warnings.map((warning, index) => (
            <p key={index} className="text-xs text-orange-600">
              {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Submit button with validation state
export interface ValidatedSubmitButtonProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  requireAllValid?: boolean;
  showValidationSummary?: boolean;
}

export function ValidatedSubmitButton({
  children,
  className,
  disabled = false,
  requireAllValid = true,
  showValidationSummary = false,
}: ValidatedSubmitButtonProps) {
  const context = React.useContext(FormValidationContext);
  const isFormDisabled =
    disabled ||
    (requireAllValid && !context?.formState.isValid) ||
    context?.formState.isSubmitting;

  const errorCount = Object.values(context?.fieldStates || {}).reduce(
    (count, field) => count + field.errors.length,
    0
  );

  return (
    <div className="space-y-2">
      <Button type="submit" disabled={isFormDisabled} className={className}>
        {context?.formState.isSubmitting ? 'submitting...' : children}
      </Button>

      {showValidationSummary && errorCount > 0 && (
        <p className="text-destructive text-xs">
          {errorCount} validation error{errorCount !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
}
