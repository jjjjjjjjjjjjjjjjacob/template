/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import {
  DynamicPlaceholderInput,
  useDynamicPlaceholder,
} from '../dynamic-placeholder-input';

describe('DynamicPlaceholderInput', () => {
  const defaultPlaceholders = [
    'start typing...',
    "what's on your mind?",
    'share your thoughts...',
  ];

  const defaultProps = {
    placeholders: defaultPlaceholders,
    rotationInterval: 1000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('renders input with first placeholder initially', () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'start typing...');
  });

  it('rotates placeholders automatically', async () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'start typing...');

    // Advance timer to trigger rotation (1000ms + animation duration)
    act(() => {
      vi.advanceTimersByTime(1250); // 1000ms interval + 250ms animation
    });

    expect(input).toHaveAttribute('placeholder', "what's on your mind?");
  });

  it('shows visual indicators for multiple placeholders', () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    // Should show 3 dots for 3 placeholders
    const indicators = document.querySelectorAll('.w-1\\.5');
    expect(indicators).toHaveLength(3);
  });

  it('uses static placeholder when provided', () => {
    render(
      <DynamicPlaceholderInput
        placeholder="static placeholder"
        placeholders={defaultPlaceholders}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'static placeholder');

    // Should not show rotation indicators
    const indicators = document.querySelectorAll('.w-1\\.5');
    expect(indicators).toHaveLength(0);
  });

  it('pauses rotation on focus when pauseOnFocus is true', () => {
    render(<DynamicPlaceholderInput {...defaultProps} pauseOnFocus={true} />);

    const input = screen.getByRole('textbox');

    // Focus the input using fireEvent instead of userEvent
    act(() => {
      input.focus();
    });

    // Advance timer - should not rotate while focused
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(input).toHaveAttribute('placeholder', 'start typing...');
  });

  it('pauses rotation on hover when pauseOnHover is true', () => {
    render(<DynamicPlaceholderInput {...defaultProps} pauseOnHover={true} />);

    const input = screen.getByRole('textbox');

    // Hover the input using fireEvent
    act(() => {
      fireEvent.mouseEnter(input);
    });

    // Advance timer - should not rotate while hovered
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(input).toHaveAttribute('placeholder', 'start typing...');
  });

  it('stops rotation when user starts typing', () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    const input = screen.getByRole('textbox');

    // Type some text using fireEvent
    act(() => {
      fireEvent.change(input, { target: { value: 'hello' } });
    });

    // Advance timer - should not rotate when there's text
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(input).toHaveAttribute('placeholder', 'start typing...');
  });

  it('renders as textarea when multiline is true', () => {
    render(
      <DynamicPlaceholderInput {...defaultProps} multiline={true} rows={4} />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName.toLowerCase()).toBe('textarea');
    expect(textarea).toHaveAttribute('rows', '4');
  });

  it('shows label and description when provided', () => {
    render(
      <DynamicPlaceholderInput
        {...defaultProps}
        label="message"
        description="enter your message here"
        required={true}
      />
    );

    expect(screen.getByText('message')).toBeInTheDocument();
    expect(screen.getByText('enter your message here')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
  });

  it('works in controlled mode', () => {
    const onChange = vi.fn();

    render(
      <DynamicPlaceholderInput
        {...defaultProps}
        value="controlled"
        onChange={onChange}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('controlled');

    // Type text using fireEvent
    act(() => {
      fireEvent.change(input, { target: { value: 'controlled value' } });
    });

    expect(onChange).toHaveBeenCalledWith('controlled value');
  });

  it('works in uncontrolled mode', () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    const input = screen.getByRole('textbox');

    // Type text using fireEvent
    act(() => {
      fireEvent.change(input, { target: { value: 'uncontrolled' } });
    });

    expect(input).toHaveValue('uncontrolled');
  });

  it('is disabled when disabled prop is true', () => {
    render(<DynamicPlaceholderInput {...defaultProps} disabled={true} />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <DynamicPlaceholderInput
        {...defaultProps}
        label="search"
        description="search for items"
        aria-label="search input"
      />
    );

    const input = screen.getByRole('textbox', { name: 'search input' });
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('announces placeholder changes to screen readers', async () => {
    render(<DynamicPlaceholderInput {...defaultProps} />);

    // Advance timer to trigger rotation and complete animation
    act(() => {
      vi.advanceTimersByTime(1250);
    });

    const announcement = screen.getByText(
      "placeholder changed to: what's on your mind?"
    );
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveClass('sr-only');
  });
});

describe('useDynamicPlaceholder', () => {
  const placeholders = ['first', 'second', 'third'];

  function TestComponent({
    placeholders,
    rotationInterval = 1000,
    autoStart = true,
  }: {
    placeholders: string[];
    rotationInterval?: number;
    autoStart?: boolean;
  }) {
    const {
      currentPlaceholder,
      currentIndex,
      isRunning,
      isPaused,
      start,
      stop,
      pause,
      resume,
      reset,
      rotate,
    } = useDynamicPlaceholder(placeholders, { rotationInterval, autoStart });

    return (
      <div>
        <div data-testid="placeholder">{currentPlaceholder}</div>
        <div data-testid="index">{currentIndex}</div>
        <div data-testid="running">{isRunning.toString()}</div>
        <div data-testid="paused">{isPaused.toString()}</div>
        <button onClick={start}>start</button>
        <button onClick={stop}>stop</button>
        <button onClick={pause}>pause</button>
        <button onClick={resume}>resume</button>
        <button onClick={reset}>reset</button>
        <button onClick={rotate}>rotate</button>
      </div>
    );
  }

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('initializes with first placeholder', () => {
    render(<TestComponent placeholders={placeholders} autoStart={false} />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('first');
    expect(screen.getByTestId('index')).toHaveTextContent('0');
    expect(screen.getByTestId('running')).toHaveTextContent('false');
    expect(screen.getByTestId('paused')).toHaveTextContent('false');
  });

  it('auto-starts when autoStart is true', () => {
    render(<TestComponent placeholders={placeholders} autoStart={true} />);

    expect(screen.getByTestId('running')).toHaveTextContent('true');
  });

  it('rotates placeholders automatically when running', async () => {
    render(<TestComponent placeholders={placeholders} />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('first');

    // Advance timer beyond interval + animation
    act(() => {
      vi.advanceTimersByTime(1250);
    });

    expect(screen.getByTestId('placeholder')).toHaveTextContent('second');
    expect(screen.getByTestId('index')).toHaveTextContent('1');
  });

  it('cycles back to first placeholder after reaching the end', async () => {
    render(<TestComponent placeholders={placeholders} />);

    // Advance through all placeholders (3 placeholders * 1250ms each)
    act(() => {
      vi.advanceTimersByTime(3750); // 3 full rotations
    });

    expect(screen.getByTestId('placeholder')).toHaveTextContent('first');
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('can be manually controlled', () => {
    render(<TestComponent placeholders={placeholders} autoStart={false} />);

    // Start rotation
    act(() => {
      fireEvent.click(screen.getByText('start'));
    });
    expect(screen.getByTestId('running')).toHaveTextContent('true');

    // Pause rotation
    act(() => {
      fireEvent.click(screen.getByText('pause'));
    });
    expect(screen.getByTestId('paused')).toHaveTextContent('true');

    // Resume rotation
    act(() => {
      fireEvent.click(screen.getByText('resume'));
    });
    expect(screen.getByTestId('paused')).toHaveTextContent('false');

    // Stop rotation
    act(() => {
      fireEvent.click(screen.getByText('stop'));
    });
    expect(screen.getByTestId('running')).toHaveTextContent('false');
  });

  it('can be manually rotated', () => {
    render(<TestComponent placeholders={placeholders} autoStart={false} />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('first');

    act(() => {
      fireEvent.click(screen.getByText('rotate'));
    });
    expect(screen.getByTestId('placeholder')).toHaveTextContent('second');

    act(() => {
      fireEvent.click(screen.getByText('rotate'));
    });
    expect(screen.getByTestId('placeholder')).toHaveTextContent('third');
  });

  it('can be reset to first placeholder', () => {
    render(<TestComponent placeholders={placeholders} autoStart={false} />);

    // Rotate to third placeholder
    act(() => {
      fireEvent.click(screen.getByText('rotate'));
      fireEvent.click(screen.getByText('rotate'));
    });
    expect(screen.getByTestId('placeholder')).toHaveTextContent('third');

    // Reset to first
    act(() => {
      fireEvent.click(screen.getByText('reset'));
    });
    expect(screen.getByTestId('placeholder')).toHaveTextContent('first');
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });

  it('handles single placeholder gracefully', () => {
    render(<TestComponent placeholders={['only']} />);

    expect(screen.getByTestId('placeholder')).toHaveTextContent('only');

    // Should not advance with only one placeholder
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByTestId('placeholder')).toHaveTextContent('only');
    expect(screen.getByTestId('index')).toHaveTextContent('0');
  });
});
