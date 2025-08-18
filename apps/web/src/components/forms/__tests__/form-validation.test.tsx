/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  validators,
  useFormValidation,
  ValidatedInput,
  ValidatedSubmitButton,
  FormValidationContext,
  type ValidationRule,
} from '../form-validation';
import { Input } from '@/components/ui/input';

describe('validators', () => {
  describe('required', () => {
    it('validates required fields', async () => {
      const rule = validators.required();

      expect(await rule.validator('')).toBe(false);
      expect(await rule.validator('   ')).toBe(false);
      expect(await rule.validator('value')).toBe(true);
      expect(await rule.validator([])).toBe(false);
      expect(await rule.validator(['item'])).toBe(true);
      expect(await rule.validator(null)).toBe(false);
      expect(await rule.validator(undefined)).toBe(false);
    });
  });

  describe('minLength', () => {
    it('validates minimum length', async () => {
      const rule = validators.minLength(5);

      expect(await rule.validator('')).toBe(true); // Empty is valid
      expect(await rule.validator('abc')).toBe(false);
      expect(await rule.validator('hello')).toBe(true);
      expect(await rule.validator('hello world')).toBe(true);
    });
  });

  describe('maxLength', () => {
    it('validates maximum length', async () => {
      const rule = validators.maxLength(5);

      expect(await rule.validator('')).toBe(true);
      expect(await rule.validator('hello')).toBe(true);
      expect(await rule.validator('hello world')).toBe(false);
    });
  });

  describe('email', () => {
    it('validates email format', async () => {
      const rule = validators.email();

      expect(await rule.validator('')).toBe(true); // Empty is valid
      expect(await rule.validator('invalid')).toBe(false);
      expect(await rule.validator('user@example.com')).toBe(true);
      expect(await rule.validator('user.name+tag@example.co.uk')).toBe(true);
    });
  });

  describe('url', () => {
    it('validates URL format', async () => {
      const rule = validators.url();

      expect(await rule.validator('')).toBe(true);
      expect(await rule.validator('invalid')).toBe(false);
      expect(await rule.validator('https://example.com')).toBe(true);
      expect(await rule.validator('http://localhost:3000')).toBe(true);
    });
  });

  describe('pattern', () => {
    it('validates against regex pattern', async () => {
      const rule = validators.pattern(/^\d+$/, 'only numbers');

      expect(await rule.validator('')).toBe(true);
      expect(await rule.validator('abc')).toBe(false);
      expect(await rule.validator('123')).toBe(true);
    });
  });

  describe('numeric', () => {
    it('validates numeric values', async () => {
      const rule = validators.numeric();

      expect(await rule.validator('')).toBe(true);
      expect(await rule.validator('abc')).toBe(false);
      expect(await rule.validator('123')).toBe(true);
      expect(await rule.validator('12.34')).toBe(true);
      expect(await rule.validator('-5')).toBe(true);
    });
  });

  describe('min and max', () => {
    it('validates minimum value', async () => {
      const rule = validators.min(10);

      expect(await rule.validator('5')).toBe(false);
      expect(await rule.validator('10')).toBe(true);
      expect(await rule.validator('15')).toBe(true);
      expect(await rule.validator(15)).toBe(true);
    });

    it('validates maximum value', async () => {
      const rule = validators.max(10);

      expect(await rule.validator('5')).toBe(true);
      expect(await rule.validator('10')).toBe(true);
      expect(await rule.validator('15')).toBe(false);
      expect(await rule.validator(15)).toBe(false);
    });
  });

  describe('custom', () => {
    it('validates with custom function', async () => {
      const rule = validators.custom(
        (value: string) => value.includes('test'),
        'must contain test'
      );

      expect(await rule.validator('hello')).toBe(false);
      expect(await rule.validator('test case')).toBe(true);
    });
  });

  describe('async', () => {
    it('validates with async function', async () => {
      const rule = validators.async(async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return value === 'valid';
      }, 'async validation failed');

      expect(await rule.validator('invalid')).toBe(false);
      expect(await rule.validator('valid')).toBe(true);
    });
  });
});

describe('useFormValidation', () => {
  interface TestForm {
    name: string;
    email: string;
    age: number;
  }

  const initialValues: TestForm = {
    name: '',
    email: '',
    age: 0,
  };

  const validationRules: Partial<Record<keyof TestForm, ValidationRule[]>> = {
    name: [validators.required('name is required'), validators.minLength(2)],
    email: [validators.required('email is required'), validators.email()],
    age: [validators.min(18, 'must be 18 or older')],
  };

  function TestComponent() {
    const { values, setValue, formState, fieldStates, handleSubmit, reset } =
      useFormValidation(initialValues, validationRules);

    return (
      <div>
        <input
          data-testid="name-input"
          value={values.name}
          onChange={(e) => setValue('name', e.target.value)}
        />
        <input
          data-testid="email-input"
          value={values.email}
          onChange={(e) => setValue('email', e.target.value)}
        />
        <input
          data-testid="age-input"
          type="number"
          value={values.age}
          onChange={(e) => setValue('age', Number(e.target.value))}
        />

        <div data-testid="form-valid">{formState.isValid.toString()}</div>
        <div data-testid="form-dirty">{formState.isDirty.toString()}</div>
        <div data-testid="name-errors">
          {fieldStates.name?.errors.join(', ')}
        </div>
        <div data-testid="email-errors">
          {fieldStates.email?.errors.join(', ')}
        </div>

        <button onClick={() => handleSubmit(async () => {})}>submit</button>
        <button onClick={reset}>reset</button>
      </div>
    );
  }

  it('initializes with default values', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
    expect(screen.getByTestId('age-input')).toHaveValue(0);
    expect(screen.getByTestId('form-valid')).toHaveTextContent('true');
    expect(screen.getByTestId('form-dirty')).toHaveTextContent('false');
  });

  it('updates values and validates fields', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const nameInput = screen.getByTestId('name-input');
    await user.type(nameInput, 'john');

    await waitFor(() => {
      expect(nameInput).toHaveValue('john');
      expect(screen.getByTestId('form-dirty')).toHaveTextContent('true');
    });
  });

  it('shows validation errors', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const emailInput = screen.getByTestId('email-input');
    await user.type(emailInput, 'invalid-email');

    await waitFor(() => {
      expect(screen.getByTestId('email-errors')).toHaveTextContent(
        'please enter a valid email address'
      );
    });
  });

  it('validates form before submission', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    function TestSubmitComponent() {
      const { handleSubmit } = useFormValidation(
        initialValues,
        validationRules
      );

      return <button onClick={() => handleSubmit(onSubmit)}>submit</button>;
    }

    render(<TestSubmitComponent />);

    await user.click(screen.getByText('submit'));

    // Should not call onSubmit with invalid form
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('resets form to initial values', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Change values
    await user.type(screen.getByTestId('name-input'), 'john');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');

    await waitFor(() => {
      expect(screen.getByTestId('form-dirty')).toHaveTextContent('true');
    });

    // Reset form
    await user.click(screen.getByText('reset'));

    await waitFor(() => {
      expect(screen.getByTestId('name-input')).toHaveValue('');
      expect(screen.getByTestId('email-input')).toHaveValue('');
      expect(screen.getByTestId('form-dirty')).toHaveTextContent('false');
    });
  });
});

describe('ValidatedInput', () => {
  const mockFieldState = {
    isValid: false,
    isDirty: true,
    isTouched: true,
    isValidating: false,
    errors: ['field is required'],
    warnings: [],
  };

  const mockContext = {
    formState: {
      isValid: false,
      isDirty: true,
      isSubmitting: false,
      fields: {
        testField: mockFieldState,
      },
    },
    fieldStates: {
      testField: mockFieldState,
    },
    touchField: vi.fn(),
    validateField: vi.fn(),
  };

  it('renders input with validation styling', () => {
    render(
      <FormValidationContext.Provider value={mockContext}>
        <ValidatedInput name="testField" label="test field">
          <Input />
        </ValidatedInput>
      </FormValidationContext.Provider>
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveClass('border-destructive');
  });

  it('shows validation errors when field is touched', () => {
    render(
      <FormValidationContext.Provider value={mockContext}>
        <ValidatedInput name="testField" label="test field">
          <Input />
        </ValidatedInput>
      </FormValidationContext.Provider>
    );

    expect(screen.getByText('field is required')).toBeInTheDocument();
    expect(screen.getByText('field is required')).toHaveAttribute(
      'role',
      'alert'
    );
  });

  it('shows warnings when present and no errors', () => {
    const warningContext = {
      ...mockContext,
      fieldStates: {
        testField: {
          ...mockFieldState,
          errors: [],
          warnings: ['this is a warning'],
          isValid: true,
        },
      },
    };

    render(
      <FormValidationContext.Provider value={warningContext}>
        <ValidatedInput name="testField" label="test field">
          <Input />
        </ValidatedInput>
      </FormValidationContext.Provider>
    );

    expect(screen.getByText('this is a warning')).toBeInTheDocument();
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-orange-500');
  });

  it('calls touchField on blur', async () => {
    const user = userEvent.setup();

    render(
      <FormValidationContext.Provider value={mockContext}>
        <ValidatedInput name="testField">
          <Input />
        </ValidatedInput>
      </FormValidationContext.Provider>
    );

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.tab(); // Blur the input

    expect(mockContext.touchField).toHaveBeenCalledWith('testField');
  });
});

describe('ValidatedSubmitButton', () => {
  const validContext = {
    formState: {
      isValid: true,
      isDirty: false,
      isSubmitting: false,
      fields: {},
    },
    fieldStates: {},
    touchField: vi.fn(),
    validateField: vi.fn(),
  };

  const invalidContext = {
    formState: {
      isValid: false,
      isDirty: true,
      isSubmitting: false,
      fields: {},
    },
    fieldStates: {
      testField: {
        isValid: false,
        isDirty: true,
        isTouched: true,
        isValidating: false,
        errors: ['error 1', 'error 2'],
        warnings: [],
      },
    },
    touchField: vi.fn(),
    validateField: vi.fn(),
  };

  it('is enabled when form is valid', () => {
    render(
      <FormValidationContext.Provider value={validContext}>
        <ValidatedSubmitButton>submit</ValidatedSubmitButton>
      </FormValidationContext.Provider>
    );

    const button = screen.getByRole('button', { name: 'submit' });
    expect(button).not.toBeDisabled();
  });

  it('is disabled when form is invalid and requireAllValid is true', () => {
    render(
      <FormValidationContext.Provider value={invalidContext}>
        <ValidatedSubmitButton requireAllValid={true}>
          submit
        </ValidatedSubmitButton>
      </FormValidationContext.Provider>
    );

    const button = screen.getByRole('button', { name: 'submit' });
    expect(button).toBeDisabled();
  });

  it('shows validation summary when requested', () => {
    render(
      <FormValidationContext.Provider value={invalidContext}>
        <ValidatedSubmitButton showValidationSummary={true}>
          submit
        </ValidatedSubmitButton>
      </FormValidationContext.Provider>
    );

    expect(screen.getByText('2 validation errors found')).toBeInTheDocument();
  });

  it('shows submitting state', () => {
    const submittingContext = {
      ...validContext,
      formState: {
        ...validContext.formState,
        isSubmitting: true,
      },
    };

    render(
      <FormValidationContext.Provider value={submittingContext}>
        <ValidatedSubmitButton>submit</ValidatedSubmitButton>
      </FormValidationContext.Provider>
    );

    expect(screen.getByText('submitting...')).toBeInTheDocument();
  });
});
