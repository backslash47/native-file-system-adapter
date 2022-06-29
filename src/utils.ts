import { FileHandleMemory } from './adapters/memory';
import { FileSystemFileHandleImpl } from './file-system-file-handle';

export async function getFileHandlesFromInput(input: HTMLInputElement) {
  return Array.from(input.files!).map(
    (file) => new FileSystemFileHandleImpl(new FileHandleMemory(file.name, file, false)),
  );
}
