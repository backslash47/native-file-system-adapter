import { getFileHandlesFromInput } from './utils';
import { OpenFilePickerOptions, FileSystemFileHandle } from './types';

export async function showOpenFilePicker(options: OpenFilePickerOptions = {}): Promise<FileSystemFileHandle[]> {
  const opts = { multiple: false, ...options };

  const input = document.createElement('input');
  input.type = 'file';
  input.multiple = opts.multiple;
  input.accept = (opts.types || [])
    .map((type) => Object.values(type.accept))
    .flat()
    .join(',');

  // See https://stackoverflow.com/questions/47664777/javascript-file-input-onchange-not-working-ios-safari-only
  input.style.position = 'fixed';
  input.style.top = '-100000px';
  input.style.left = '-100000px';
  document.body.appendChild(input);

  await new Promise((resolve) => {
    input.addEventListener('change', resolve);
    input.click();
  });

  try {
    return getFileHandlesFromInput(input);
  } finally {
    input.remove();
  }
}
