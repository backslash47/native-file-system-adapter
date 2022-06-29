import { FileSystemFileHandleImpl } from './file-system-file-handle';
import { FileHandleDownloader } from './adapters/downloader';
import { SaveFilePickerOptions, FileSystemFileHandle } from './types';

export async function showSaveFilePicker(options: SaveFilePickerOptions = {}): Promise<FileSystemFileHandle> {
  return new FileSystemFileHandleImpl(new FileHandleDownloader(options.suggestedName));
}
