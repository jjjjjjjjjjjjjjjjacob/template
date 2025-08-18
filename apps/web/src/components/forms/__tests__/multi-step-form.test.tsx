/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MultiStepForm,
  useMultiStepForm,
  type MultiStepFormStep,
} from '../multi-step-form';

const mockSteps: MultiStepFormStep[] = [
  {
    id: 'step1',
    title: 'personal information',
    description: 'enter your basic details',
    isValid: true,
    content: <div>step 1 content</div>,
  },
  {
    id: 'step2',
    title: 'preferences',
    description: 'choose your preferences',
    isValid: false,
    content: <div>step 2 content</div>,
  },
  {
    id: 'step3',
    title: 'review',
    description: 'review and confirm',
    isOptional: true,
    content: <div>step 3 content</div>,
  },
];

describe('MultiStepForm', () => {
  const defaultProps = {
    steps: mockSteps,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders first step by default', () => {
    render(<MultiStepForm {...defaultProps} />);

    expect(screen.getByText('personal information')).toBeInTheDocument();
    expect(screen.getByText('enter your basic details')).toBeInTheDocument();
    expect(screen.getByText('step 1 content')).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', () => {
    render(<MultiStepForm {...defaultProps} currentStep={1} />);

    const progressText = screen.getByText('step 2 of 3');
    expect(progressText).toBeInTheDocument();

    const percentageText = screen.getByText('67% complete');
    expect(percentageText).toBeInTheDocument();
  });

  it('hides progress bar when showProgress is false', () => {
    render(<MultiStepForm {...defaultProps} showProgress={false} />);

    expect(screen.queryByText('step 1 of 3')).not.toBeInTheDocument();
  });

  it('shows step list with correct statuses', () => {
    render(<MultiStepForm {...defaultProps} currentStep={1} />);

    const step1 = screen.getByText('personal information').closest('div');
    const step2 = screen.getByText('preferences').closest('div');
    const step3 = screen.getByText('review').closest('div');

    expect(step1).toHaveAttribute('aria-current', null);
    expect(step2).toHaveAttribute('aria-current', 'step');
    expect(step3).toHaveAttribute('aria-current', null);
  });

  it('shows optional badge for optional steps', () => {
    render(<MultiStepForm {...defaultProps} />);

    const optionalBadge = screen.getByText('optional');
    expect(optionalBadge).toBeInTheDocument();
  });

  it('navigates to next step when next button is clicked', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <MultiStepForm
        {...defaultProps}
        currentStep={0}
        onStepChange={onStepChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /next/ });
    await user.click(nextButton);

    expect(onStepChange).toHaveBeenCalledWith(1);
  });

  it('navigates to previous step when previous button is clicked', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <MultiStepForm
        {...defaultProps}
        currentStep={1}
        onStepChange={onStepChange}
      />
    );

    const previousButton = screen.getByRole('button', { name: /previous/ });
    await user.click(previousButton);

    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it('calls onComplete when complete button is clicked on last step', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(
      <MultiStepForm
        {...defaultProps}
        currentStep={2}
        onComplete={onComplete}
      />
    );

    const completeButton = screen.getByRole('button', { name: /complete/ });
    await user.click(completeButton);

    expect(onComplete).toHaveBeenCalled();
  });

  it('shows cancel button on first step when onCancel is provided', () => {
    const onCancel = vi.fn();

    render(
      <MultiStepForm {...defaultProps} currentStep={0} onCancel={onCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/ });
    expect(cancelButton).toBeInTheDocument();
  });

  it('disables next button when current step is invalid', () => {
    render(<MultiStepForm {...defaultProps} currentStep={1} />);

    const nextButton = screen.getByRole('button', { name: /next/ });
    expect(nextButton).toBeDisabled();
  });

  it('allows step navigation when allowStepNavigation is true', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <MultiStepForm
        {...defaultProps}
        currentStep={1}
        allowStepNavigation={true}
        onStepChange={onStepChange}
      />
    );

    const step1Button = screen.getByText('personal information').closest('div');
    expect(step1Button).toHaveAttribute('role', 'button');

    await user.click(step1Button!);
    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it('supports keyboard navigation for step clicking', async () => {
    const user = userEvent.setup();
    const onStepChange = vi.fn();

    render(
      <MultiStepForm
        {...defaultProps}
        currentStep={1}
        allowStepNavigation={true}
        onStepChange={onStepChange}
      />
    );

    const step1Button = screen.getByText('personal information').closest('div');
    step1Button?.focus();

    await user.keyboard('{Enter}');
    expect(onStepChange).toHaveBeenCalledWith(0);
  });

  it('renders custom children in card content', () => {
    render(
      <MultiStepForm {...defaultProps}>
        <div data-testid="custom-content">custom form content</div>
      </MultiStepForm>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<MultiStepForm {...defaultProps} aria-label="registration form" />);

    const form = screen.getByRole('form', { name: 'registration form' });
    expect(form).toBeInTheDocument();

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'progress: 33% complete');
  });
});

describe('useMultiStepForm', () => {
  function TestComponent() {
    const {
      currentStep,
      stepData,
      updateStepData,
      goToNext,
      goToPrevious,
      isFirstStep,
      isLastStep,
      canProceed,
      progress,
    } = useMultiStepForm(mockSteps);

    return (
      <div>
        <div data-testid="current-step">{currentStep}</div>
        <div data-testid="progress">{progress}</div>
        <div data-testid="is-first">{isFirstStep.toString()}</div>
        <div data-testid="is-last">{isLastStep.toString()}</div>
        <div data-testid="can-proceed">{canProceed.toString()}</div>
        <button onClick={() => updateStepData('step1', { name: 'test' })}>
          update data
        </button>
        <button onClick={goToNext}>next</button>
        <button onClick={goToPrevious}>previous</button>
      </div>
    );
  }

  it('initializes with correct default values', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    expect(screen.getByTestId('progress')).toHaveTextContent('33.33');
    expect(screen.getByTestId('is-first')).toHaveTextContent('true');
    expect(screen.getByTestId('is-last')).toHaveTextContent('false');
    expect(screen.getByTestId('can-proceed')).toHaveTextContent('true');
  });

  it('updates step data correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('update data'));

    // This test would need additional assertion if we exposed stepData in the test component
  });

  it('navigates steps correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('next'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');
    expect(screen.getByTestId('is-first')).toHaveTextContent('false');

    await user.click(screen.getByText('previous'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('0');
    expect(screen.getByTestId('is-first')).toHaveTextContent('true');
  });

  it('handles last step correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    // Navigate to last step
    await user.click(screen.getByText('next'));
    await user.click(screen.getByText('next'));

    expect(screen.getByTestId('current-step')).toHaveTextContent('2');
    expect(screen.getByTestId('is-last')).toHaveTextContent('true');
    expect(screen.getByTestId('progress')).toHaveTextContent('100');
  });
});
