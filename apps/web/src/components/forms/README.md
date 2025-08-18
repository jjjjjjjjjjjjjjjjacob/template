# Advanced Form Components

A comprehensive collection of reusable form components and patterns for building complex, accessible, and user-friendly forms.

## Components

### MultiStepForm

A flexible multi-step form component with progress tracking and navigation controls.

**Features:**

- Progress visualization with percentage completion
- Step validation and navigation controls
- Optional step support
- Keyboard navigation and accessibility
- Customizable step content and styling

**Usage:**

```tsx
import { MultiStepForm, useMultiStepForm } from '@/components/forms';

const steps = [
  {
    id: 'personal',
    title: 'personal information',
    description: 'enter your basic details',
    isValid: true,
    content: <PersonalInfoForm />,
  },
  {
    id: 'preferences',
    title: 'preferences',
    isValid: false,
    content: <PreferencesForm />,
  },
];

function MyForm() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <MultiStepForm
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={() => console.log('form completed')}
      allowStepNavigation={true}
    />
  );
}

// Or use the hook for more control
function MyFormWithHook() {
  const {
    currentStep,
    goToNext,
    goToPrevious,
    isFirstStep,
    isLastStep,
    canProceed,
  } = useMultiStepForm(steps);

  return (
    <div>
      <div>
        step {currentStep + 1} of {steps.length}
      </div>
      {steps[currentStep].content}
      <button onClick={goToPrevious} disabled={isFirstStep}>
        previous
      </button>
      <button onClick={goToNext} disabled={!canProceed}>
        {isLastStep ? 'complete' : 'next'}
      </button>
    </div>
  );
}
```

### FileUpload

A drag-and-drop file upload component with progress tracking and validation.

**Features:**

- Drag and drop interface
- File validation (size, type, count)
- Upload progress tracking
- File status management
- Accessibility support

**Usage:**

```tsx
import { FileUpload, useFileUpload } from '@/components/forms';

function MyFileUpload() {
  const { files, setFiles, uploadFiles } = useFileUpload();

  const handleUpload = async (selectedFiles: File[]) => {
    await uploadFiles(async (file, onProgress) => {
      // Your upload logic here
      const url = await uploadToServer(file, onProgress);
      return url;
    });
  };

  return (
    <FileUpload
      files={files}
      onFilesChange={setFiles}
      onUpload={handleUpload}
      accept="image/*"
      maxFiles={5}
      maxFileSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

### CharacterCountInput

An input component with character counting and validation.

**Features:**

- Real-time character counting
- Visual progress indicator
- Warning thresholds
- Min/max length validation
- Multiline support

**Usage:**

```tsx
import { CharacterCountInput, useCharacterCount } from '@/components/forms';

function MyTextInput() {
  const [value, setValue] = useState('');

  return (
    <CharacterCountInput
      value={value}
      onChange={setValue}
      maxLength={280}
      minLength={10}
      label="description"
      description="describe your project"
      showCount={true}
      showRemaining={true}
      warningThreshold={90}
      multiline={true}
      rows={3}
    />
  );
}

// Or use the hook
function MyInputWithHook() {
  const { value, setValue, currentLength, remaining, percentage, isValid } =
    useCharacterCount(100);

  return (
    <div>
      <textarea value={value} onChange={(e) => setValue(e.target.value)} />
      <div>
        {currentLength}/100 characters ({remaining} remaining)
      </div>
    </div>
  );
}
```

### DynamicPlaceholderInput

An input with rotating placeholder text for enhanced UX.

**Features:**

- Automatic placeholder rotation
- Pause on focus/hover
- Custom rotation intervals
- Accessibility announcements
- Static placeholder support

**Usage:**

```tsx
import {
  DynamicPlaceholderInput,
  useDynamicPlaceholder,
} from '@/components/forms';

function MySearchInput() {
  const [query, setQuery] = useState('');

  return (
    <DynamicPlaceholderInput
      value={query}
      onChange={setQuery}
      placeholders={[
        'search for products...',
        'find what you need...',
        'discover new items...',
      ]}
      rotationInterval={3000}
      pauseOnFocus={true}
      label="search"
    />
  );
}

// Or use the hook for custom behavior
function MyCustomInput() {
  const { currentPlaceholder, start, stop, pause, resume } =
    useDynamicPlaceholder(['first', 'second', 'third']);

  return <input placeholder={currentPlaceholder} />;
}
```

### Form Validation

Comprehensive form validation utilities with built-in validators and patterns.

**Features:**

- Built-in validation rules
- Async validation support
- Field-level and form-level validation
- Accessibility integration
- Context-based validation state

**Usage:**

```tsx
import {
  useFormValidation,
  validators,
  ValidatedInput,
  ValidatedSubmitButton,
  FormValidationContext,
} from '@/components/forms';
import { Input } from '@/components/ui/input';

interface FormData {
  name: string;
  email: string;
  age: number;
}

const validationRules = {
  name: [
    validators.required('name is required'),
    validators.minLength(2, 'name must be at least 2 characters'),
  ],
  email: [
    validators.required('email is required'),
    validators.email('please enter a valid email'),
  ],
  age: [
    validators.required('age is required'),
    validators.min(18, 'must be 18 or older'),
  ],
};

function MyValidatedForm() {
  const { values, setValue, handleSubmit, formState, fieldStates } =
    useFormValidation<FormData>(
      { name: '', email: '', age: 0 },
      validationRules
    );

  const contextValue = {
    formState,
    fieldStates,
    touchField: (field) => {},
    validateField: async (field, value) => fieldStates[field],
  };

  return (
    <FormValidationContext.Provider value={contextValue}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(async (data) => {
            console.log('submitting:', data);
          });
        }}
      >
        <ValidatedInput name="name" label="full name">
          <Input
            value={values.name}
            onChange={(e) => setValue('name', e.target.value)}
          />
        </ValidatedInput>

        <ValidatedInput name="email" label="email address">
          <Input
            type="email"
            value={values.email}
            onChange={(e) => setValue('email', e.target.value)}
          />
        </ValidatedInput>

        <ValidatedInput name="age" label="age">
          <Input
            type="number"
            value={values.age}
            onChange={(e) => setValue('age', Number(e.target.value))}
          />
        </ValidatedInput>

        <ValidatedSubmitButton
          requireAllValid={true}
          showValidationSummary={true}
        >
          submit form
        </ValidatedSubmitButton>
      </form>
    </FormValidationContext.Provider>
  );
}
```

## Built-in Validators

The validation system includes these built-in validators:

- `validators.required(message?)` - Field is required
- `validators.minLength(min, message?)` - Minimum character length
- `validators.maxLength(max, message?)` - Maximum character length
- `validators.email(message?)` - Valid email format
- `validators.url(message?)` - Valid URL format
- `validators.pattern(regex, message)` - Regex pattern matching
- `validators.numeric(message?)` - Numeric values only
- `validators.min(min, message?)` - Minimum numeric value
- `validators.max(max, message?)` - Maximum numeric value
- `validators.custom(validator, message)` - Custom sync validation
- `validators.async(validator, message)` - Custom async validation

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader announcements
- Focus management
- Error state communication
- Progress indication

## Styling

Components use Tailwind CSS classes and integrate with the shadcn/ui design system. All text follows the lowercase convention as specified in the project guidelines.

## Testing

Comprehensive test coverage is provided for all components using Vitest and React Testing Library. Tests cover:

- User interactions
- Validation logic
- Accessibility features
- Edge cases and error states
- Hook functionality

Run tests with:

```bash
bun test src/components/forms
```
