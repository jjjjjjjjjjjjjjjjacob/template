// Multi-step form components

// Character counting input
export {
  CharacterCountInput,
  type CharacterCountInputProps,
  useCharacterCount,
} from './character-count-input';
// Dynamic placeholder input
export {
  DynamicPlaceholderInput,
  type DynamicPlaceholderInputProps,
  useDynamicPlaceholder,
} from './dynamic-placeholder-input';
// File upload components
export {
  FileUpload,
  type FileUploadFile,
  type FileUploadProps,
  useFileUpload,
} from './file-upload';
// Form validation utilities
export {
  type FieldValidationState,
  FormValidationContext,
  type FormValidationState,
  useFormValidation,
  useFormValidationContext,
  ValidatedInput,
  type ValidatedInputProps,
  ValidatedSubmitButton,
  type ValidatedSubmitButtonProps,
  type ValidationRule,
  validators,
} from './form-validation';
export {
  MultiStepForm,
  type MultiStepFormProps,
  type MultiStepFormStep,
  useMultiStepForm,
} from './multi-step-form';
