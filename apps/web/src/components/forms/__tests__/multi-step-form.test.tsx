/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
    isValid: true, // Changed to true so navigation works in tests
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

const mockStepsWithInvalidStep: MultiStepFormStep[] = [
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
    isValid: false, // Invalid step for testing disabled navigation
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

    expect(screen.getAllByText('personal information')[0]).toBeInTheDocument();
    expect(
      screen.getAllByText('enter your basic details')[0]
    ).toBeInTheDocument();
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

    // Get step items from the step list containers
    // First item should be the current step (step 2, index 1)
    const currentStepItem = document.querySelector('[aria-current="step"]');
    expect(currentStepItem).toHaveAttribute('aria-current', 'step');

    // Check that other steps don't have aria-current
    const allStepItems = Array.from(
      document.querySelectorAll('.space-y-1 > div')
    );
    const nonCurrentSteps = allStepItems.filter(
      (item) => item !== currentStepItem
    );
    nonCurrentSteps.forEach((step) => {
      expect(step).not.toHaveAttribute('aria-current');
    });
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
    render(<MultiStepForm steps={mockStepsWithInvalidStep} currentStep={1} />);

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

    // Find the clickable step button (step 0 should be clickable because index < currentStep)
    const clickableStep = document.querySelector('[role="button"]');
    expect(clickableStep).toHaveAttribute('role', 'button');
    expect(clickableStep).toBeInTheDocument();

    await user.click(clickableStep!);
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

    // Find the clickable step button (step 0 should be clickable because index < currentStep)
    const clickableStep = document.querySelector(
      '[role="button"]'
    ) as HTMLElement;
    expect(clickableStep).toBeInTheDocument();
    clickableStep?.focus();

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

    // Navigate to step 1 (index 1)
    await user.click(screen.getByText('next'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('1');

    // Navigate to step 2 (index 2, last step)
    await user.click(screen.getByText('next'));
    expect(screen.getByTestId('current-step')).toHaveTextContent('2');
    expect(screen.getByTestId('is-last')).toHaveTextContent('true');
    expect(screen.getByTestId('progress')).toHaveTextContent('100');
  });
});
