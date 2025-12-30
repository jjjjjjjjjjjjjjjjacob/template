export interface UploadProgressOptions {
  url: string;
  file: File;
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
}

export interface UploadResult {
  storageId: string;
}

export function uploadWithProgress(
  options: UploadProgressOptions
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && options.onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        options.onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response as UploadResult);
        } catch {
          reject(new Error('invalid response format'));
        }
      } else {
        reject(new Error(`upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('upload failed: network error'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('upload cancelled'));
    });

    xhr.open('POST', options.url);
    xhr.setRequestHeader('Content-Type', options.file.type);

    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
    }

    xhr.send(options.file);
  });
}
