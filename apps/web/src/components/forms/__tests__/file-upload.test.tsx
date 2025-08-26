/// <reference lib="dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload, useFileUpload, type FileUploadFile } from '../file-upload';

const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
    configurable: true,
  });
  return file;
};

// Create mock files lazily to avoid potential circular reference issues
const getMockFiles = (): FileUploadFile[] => [
  {
    id: '1',
    file: createMockFile('test.txt', 1024, 'text/plain'),
    progress: 0,
    status: 'pending',
  },
  {
    id: '2',
    file: createMockFile('image.jpg', 2048, 'image/jpeg'),
    progress: 50,
    status: 'uploading',
  },
  {
    id: '3',
    file: createMockFile('complete.pdf', 512, 'application/pdf'),
    progress: 100,
    status: 'completed',
  },
];

describe('FileUpload', () => {
  const defaultProps = {
    files: [],
    onFilesChange: vi.fn(),
    onUpload: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock console methods to avoid circular reference issues with File objects
    const consoleMethods = ['warn', 'error', 'log', 'info', 'debug'] as const;
    consoleMethods.forEach((method) => {
      vi.spyOn(global.console, method).mockImplementation(() => {});
    });

    // Mock the file input functionality
    Object.defineProperty(globalThis, 'URL', {
      value: {
        createObjectURL: vi.fn(() => 'mock-url'),
        revokeObjectURL: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    // Mock FileReader to prevent issues
    Object.defineProperty(globalThis, 'FileReader', {
      value: vi.fn(() => ({
        readAsDataURL: vi.fn(),
        readAsText: vi.fn(),
        result: 'mock-result',
        onload: null,
        onerror: null,
      })),
      writable: true,
      configurable: true,
    });
  });

  it('renders upload area with correct text', () => {
    render(<FileUpload {...defaultProps} />);

    expect(
      screen.getByText('click to upload or drag and drop')
    ).toBeInTheDocument();
    expect(screen.getByText(/all file types accepted/)).toBeInTheDocument();
  });

  it('shows file type restrictions when accept prop is provided', () => {
    render(<FileUpload {...defaultProps} accept="image/*" />);

    expect(screen.getByText(/accepted: image\/\*/)).toBeInTheDocument();
  });

  it('shows file size limit', () => {
    render(<FileUpload {...defaultProps} maxFileSize={5 * 1024 * 1024} />);

    expect(screen.getByText(/max 5 mb/)).toBeInTheDocument();
  });

  it('handles file selection through input', async () => {
    const user = userEvent.setup();
    const onFilesChange = vi.fn();

    render(<FileUpload {...defaultProps} onFilesChange={onFilesChange} />);

    const file = createMockFile('test.txt', 1024, 'text/plain');
    const input = screen.getByRole('button', { name: /file upload/ });

    await user.click(input);

    // Find the hidden file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Simulate file selection
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalled();
    });
  });

  it('handles drag and drop', async () => {
    const onFilesChange = vi.fn();

    render(<FileUpload {...defaultProps} onFilesChange={onFilesChange} />);

    const dropZone = screen.getByRole('button', { name: /file upload/ });
    const file = createMockFile('test.txt', 1024, 'text/plain');

    // Simulate drag enter first to trigger drag state
    fireEvent.dragEnter(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    // Then drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(screen.getByText('drop files here')).toBeInTheDocument();

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(onFilesChange).toHaveBeenCalled();
    });
  });

  it('displays uploaded files correctly', () => {
    render(<FileUpload {...defaultProps} files={getMockFiles()} />);

    expect(screen.getByText('files (3/10)')).toBeInTheDocument();
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('complete.pdf')).toBeInTheDocument();
  });

  it('shows correct file status badges', () => {
    render(<FileUpload {...defaultProps} files={getMockFiles()} />);

    expect(screen.getByText('pending')).toBeInTheDocument();
    expect(screen.getByText('uploading')).toBeInTheDocument();
    expect(screen.getByText('completed')).toBeInTheDocument();
  });

  it('shows upload progress for uploading files', () => {
    render(<FileUpload {...defaultProps} files={getMockFiles()} />);

    // Should show progress for files that are uploading or have progress > 0
    // getMockFiles() has one uploading file (50% progress) and one with 100% progress but completed status
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });

  it('allows file removal', async () => {
    const user = userEvent.setup();
    const onFilesChange = vi.fn();

    render(
      <FileUpload
        {...defaultProps}
        files={getMockFiles()}
        onFilesChange={onFilesChange}
      />
    );

    const removeButtons = screen.getAllByLabelText(/remove/);
    await user.click(removeButtons[0]);

    expect(onFilesChange).toHaveBeenCalled();
  });

  it('shows upload button for pending files', () => {
    const pendingFiles = getMockFiles().filter((f) => f.status === 'pending');

    render(<FileUpload {...defaultProps} files={pendingFiles} />);

    expect(screen.getByText('upload 1 file')).toBeInTheDocument();
  });

  it('validates file size', async () => {
    const onFilesChange = vi.fn();

    render(
      <FileUpload
        {...defaultProps}
        onFilesChange={onFilesChange}
        maxFileSize={500} // 500 bytes
      />
    );

    const dropZone = screen.getByRole('button', { name: /file upload/ });
    const largeFile = createMockFile('large.txt', 1024, 'text/plain'); // 1024 bytes

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [largeFile],
      },
    });

    // Should not call onFilesChange with invalid file
    await waitFor(() => {
      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  it('respects max files limit', async () => {
    const onFilesChange = vi.fn();

    render(
      <FileUpload
        {...defaultProps}
        onFilesChange={onFilesChange}
        maxFiles={2}
        files={getMockFiles().slice(0, 2)} // Already have 2 files
      />
    );

    const dropZone = screen.getByRole('button', { name: /file upload/ });
    const newFile = createMockFile('new.txt', 1024, 'text/plain');

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [newFile],
      },
    });

    // Should not add more files beyond the limit
    await waitFor(() => {
      expect(onFilesChange).not.toHaveBeenCalled();
    });
  });

  it('is disabled when disabled prop is true', () => {
    render(<FileUpload {...defaultProps} disabled={true} />);

    const dropZone = screen.getByRole('button', { name: /file upload/ });
    expect(dropZone).toHaveAttribute('tabindex', '-1');

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeDisabled();
  });

  it('has proper accessibility attributes', () => {
    render(
      <FileUpload
        {...defaultProps}
        aria-label="document upload"
        aria-describedby="upload-help"
      />
    );

    const dropZone = screen.getByRole('button', { name: 'document upload' });
    expect(dropZone).toHaveAttribute('aria-describedby', 'upload-help');

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toHaveAttribute('aria-describedby', 'upload-help');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(<FileUpload {...defaultProps} />);

    const dropZone = screen.getByRole('button', { name: /file upload/ });

    dropZone.focus();
    await user.keyboard('{Enter}');

    // Should trigger file input click (can't easily test the actual click)
    expect(dropZone).toHaveFocus();
  });
});

describe('useFileUpload', () => {
  function TestComponent() {
    const {
      files,
      setFiles,
      updateFileProgress,
      updateFileStatus,
      removeFile,
      clearFiles,
    } = useFileUpload();

    return (
      <div>
        <div data-testid="file-count">{files.length}</div>
        <button onClick={() => setFiles(getMockFiles())}>set files</button>
        <button onClick={() => updateFileProgress('1', 75)}>
          update progress
        </button>
        <button onClick={() => updateFileStatus('1', 'completed')}>
          update status
        </button>
        <button onClick={() => removeFile('1')}>remove file</button>
        <button onClick={clearFiles}>clear all</button>
      </div>
    );
  }

  it('initializes with empty files array', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
  });

  it('sets files correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('set files'));
    expect(screen.getByTestId('file-count')).toHaveTextContent('3');
  });

  it('updates file progress', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('set files'));
    await user.click(screen.getByText('update progress'));

    // Progress update would be reflected in the internal state
    // This test verifies the function doesn't throw errors
  });

  it('updates file status', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('set files'));
    await user.click(screen.getByText('update status'));

    // Status update would be reflected in the internal state
  });

  it('removes files correctly', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('set files'));
    expect(screen.getByTestId('file-count')).toHaveTextContent('3');

    await user.click(screen.getByText('remove file'));
    expect(screen.getByTestId('file-count')).toHaveTextContent('2');
  });

  it('clears all files', async () => {
    const user = userEvent.setup();
    render(<TestComponent />);

    await user.click(screen.getByText('set files'));
    expect(screen.getByTestId('file-count')).toHaveTextContent('3');

    await user.click(screen.getByText('clear all'));
    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
  });
});
