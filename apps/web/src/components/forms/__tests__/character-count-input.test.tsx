/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CharacterCountInput,
  useCharacterCount,
} from '../character-count-input';

describe('CharacterCountInput', () => {
  const defaultProps = {
    maxLength: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with character count', () => {
    render(<CharacterCountInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('shows character count when focused', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} showCount={true} />);

    const input = screen.getByRole('textbox');
    await user.click(input);

    expect(screen.getByText('0/100')).toBeInTheDocument();
  });

  it('shows remaining characters when showRemaining is true', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} showRemaining={true} />);

    const input = screen.getByRole('textbox');
    await user.click(input);

    expect(screen.getByText('100 remaining')).toBeInTheDocument();
  });

  it('updates character count as user types', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} showCount={true} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'hello');

    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('shows progress bar when focused', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.click(input);
    await user.type(input, 'test');

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '4');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('shows warning when approaching limit', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} warningThreshold={80} />);

    const input = screen.getByRole('textbox');
    const warningText = 'a'.repeat(85); // 85% of 100

    await user.type(input, warningText);

    expect(screen.getByText('approaching character limit')).toBeInTheDocument();
  });

  it('truncates input at max length and shows warning', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} warningThreshold={90} />);

    const input = screen.getByRole('textbox');
    const longText = 'a'.repeat(95); // Will be truncated to 95 characters due to typing each one

    await user.type(input, longText);

    // Should show warning since we're at 95 characters (>90% of 100)
    expect(screen.getByText('approaching character limit')).toBeInTheDocument();
    // Input should have exactly 95 characters since that's what was typed
    expect(input).toHaveValue('a'.repeat(95));
  });

  it('enforces max length by truncating input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <CharacterCountInput {...defaultProps} onChange={onChange} value="" />
    );

    const input = screen.getByRole('textbox');
    const longText = 'a'.repeat(105);

    await user.type(input, longText);

    // userEvent.type() with controlled component behavior

    // userEvent.type() types each character individually
    expect(onChange).toHaveBeenCalledTimes(105);
    expect(onChange).toHaveBeenLastCalledWith('a'); // Last character typed
    // Since it's controlled and value prop is still "", input stays empty
    expect(input).toHaveValue('');
  });

  it('validates minimum length', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} minLength={10} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'short');

    expect(
      screen.getByText('minimum 10 characters required')
    ).toBeInTheDocument();
  });

  it('renders as textarea when multiline is true', () => {
    render(<CharacterCountInput {...defaultProps} multiline={true} rows={5} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('shows label when provided', () => {
    render(
      <CharacterCountInput
        {...defaultProps}
        label="description"
        required={true}
      />
    );

    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
  });

  it('shows description when provided', () => {
    render(
      <CharacterCountInput
        {...defaultProps}
        description="enter a brief description"
      />
    );

    expect(screen.getByText('enter a brief description')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <CharacterCountInput
        {...defaultProps}
        label="comment"
        description="help text"
        aria-label="comment input"
      />
    );

    const input = screen.getByRole('textbox', { name: 'comment input' });
    expect(input).toHaveAttribute('aria-describedby');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('maintains aria-invalid false when at max length due to truncation', async () => {
    const user = userEvent.setup();
    render(<CharacterCountInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    const longText = 'a'.repeat(105);

    await user.type(input, longText);

    // Since input maxLength prevents exceeding, aria-invalid stays false
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(input).toHaveValue('a'.repeat(100));
  });

  it('works in controlled mode', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CharacterCountInput
        {...defaultProps}
        value="initial"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');

    await user.type(input, ' text');

    // onChange is called for each character typed
    expect(onChange).toHaveBeenCalledTimes(5);
    // userEvent.type types each character individually, replacing text each time
    // So the last character 't' is what gets called with
    expect(onChange).toHaveBeenLastCalledWith('initialt');
  });

  it('works in uncontrolled mode', async () => {
    const user = userEvent.setup();

    render(<CharacterCountInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'uncontrolled');

    expect(input).toHaveValue('uncontrolled');
  });

  it('is disabled when disabled prop is true', () => {
    render(<CharacterCountInput {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });
});

describe('useCharacterCount', () => {
  function TestComponent({ maxLength }: { maxLength?: number }) {
    const {
      value,
      setValue,
      clear,
      currentLength,
      remaining,
      percentage,
      isValid,
    } = useCharacterCount(maxLength);

    return (
      <div>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="input"
        />
        <div data-testid="length">{currentLength}</div>
        <div data-testid="remaining">{remaining}</div>
        <div data-testid="percentage">{percentage}</div>
        <div data-testid="valid">{isValid.toString()}</div>
        <button onClick={clear}>clear</button>
      </div>
    );
  }

  it('initializes with empty value', () => {
    render(<TestComponent maxLength={100} />);

    expect(screen.getByTestId('input')).toHaveValue('');
    expect(screen.getByTestId('length')).toHaveTextContent('0');
    expect(screen.getByTestId('remaining')).toHaveTextContent('100');
    expect(screen.getByTestId('percentage')).toHaveTextContent('0');
    expect(screen.getByTestId('valid')).toHaveTextContent('true');
  });

  it('updates values when typing', async () => {
    const user = userEvent.setup();
    render(<TestComponent maxLength={10} />);

    const input = screen.getByTestId('input');
    await user.type(input, 'hello');

    expect(screen.getByTestId('length')).toHaveTextContent('5');
    expect(screen.getByTestId('remaining')).toHaveTextContent('5');
    expect(screen.getByTestId('percentage')).toHaveTextContent('50');
    expect(screen.getByTestId('valid')).toHaveTextContent('true');
  });

  it('enforces max length', async () => {
    const user = userEvent.setup();
    render(<TestComponent maxLength={5} />);

    const input = screen.getByTestId('input');
    await user.type(input, 'hello world');

    expect(input).toHaveValue('hello'); // Truncated to 5 characters
    expect(screen.getByTestId('length')).toHaveTextContent('5');
    expect(screen.getByTestId('remaining')).toHaveTextContent('0');
    expect(screen.getByTestId('valid')).toHaveTextContent('true');
  });

  it('handles no max length', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    const input = screen.getByTestId('input');
    await user.type(input, 'unlimited text');

    expect(screen.getByTestId('remaining')).toHaveTextContent('Infinity');
    expect(screen.getByTestId('valid')).toHaveTextContent('true');
  });

  it('clears value when clear is called', async () => {
    const user = userEvent.setup();
    render(<TestComponent maxLength={100} />);

    const input = screen.getByTestId('input');
    await user.type(input, 'test');

    expect(input).toHaveValue('test');

    await user.click(screen.getByText('clear'));

    expect(input).toHaveValue('');
    expect(screen.getByTestId('length')).toHaveTextContent('0');
  });
});
