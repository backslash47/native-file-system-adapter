// Type definitions for non-npm package File System Access API 2020.09
// Project: https://github.com/WICG/file-system-access
// Definitions by: Ingvar Stepanyan <https://github.com/RReverser>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// Minimum TypeScript Version: 4.6

export {};

export interface FileSystemHandle {
  readonly kind: 'file' | 'directory';
  readonly name: string;

  isSameEntry(other: FileSystemHandle): Promise<boolean>;
  queryPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  requestPermission(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
}

export type FileSystemHandleUnion = FileSystemFileHandle | FileSystemDirectoryHandle;

export interface FilePickerAcceptType {
  description?: string | undefined;
  accept: Record<string, string | string[]>;
}

export interface FilePickerOptions {
  types?: FilePickerAcceptType[] | undefined;
  excludeAcceptAllOption?: boolean | undefined;
}

export interface OpenFilePickerOptions extends FilePickerOptions {
  multiple?: boolean | undefined;
}

export interface SaveFilePickerOptions extends FilePickerOptions {
  suggestedName?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DirectoryPickerOptions {}

export type FileSystemPermissionMode = 'read' | 'readwrite';

export interface FileSystemPermissionDescriptor extends PermissionDescriptor {
  handle: FileSystemHandle;
  mode?: FileSystemPermissionMode | undefined;
}

export interface FileSystemHandlePermissionDescriptor {
  mode?: FileSystemPermissionMode | undefined;
}

export interface FileSystemCreateWritableOptions {
  keepExistingData?: boolean | undefined;
}

export interface FileSystemGetFileOptions {
  create?: boolean | undefined;
}

export interface FileSystemGetDirectoryOptions {
  create?: boolean | undefined;
}

export interface FileSystemRemoveOptions {
  recursive?: boolean | undefined;
}

export type WriteParams =
  | { type: 'write'; position?: number | undefined; data: BufferSource | Blob | string }
  | { type: 'seek'; position: number }
  | { type: 'truncate'; size: number };

export type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams;

// TODO: remove this once https://github.com/microsoft/TSJS-lib-generator/issues/881 is fixed.
// Native File System API especially needs this method.
export interface WritableStream {
  close(): Promise<void>;
}

export interface FileSystemWritableFileStream extends WritableStream {
  write(data: FileSystemWriteChunkType): Promise<void>;
  seek(position: number): Promise<void>;
  truncate(size: number): Promise<void>;
}

export interface FileSystemFileHandle extends FileSystemHandle {
  readonly kind: 'file';
  getFile(): Promise<File>;
  createWritable(options?: FileSystemCreateWritableOptions): Promise<FileSystemWritableFileStream>;
}

export interface FileSystemDirectoryHandle extends FileSystemHandle {
  readonly kind: 'directory';
  getDirectoryHandle(name: string, options?: FileSystemGetDirectoryOptions): Promise<FileSystemDirectoryHandle>;
  getFileHandle(name: string, options?: FileSystemGetFileOptions): Promise<FileSystemFileHandle>;
  removeEntry(name: string, options?: FileSystemRemoveOptions): Promise<void>;
  resolve(possibleDescendant: FileSystemHandle): Promise<string[] | null>;
  keys(): AsyncIterableIterator<string>;
  values(): AsyncIterableIterator<FileSystemDirectoryHandle | FileSystemFileHandle>;
  entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>;
  [Symbol.asyncIterator]: FileSystemDirectoryHandle['entries'];
}

export interface DataTransferItem {
  getAsFileSystemHandle(): Promise<FileSystemHandle | null>;
}

export interface StorageManager {
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}
export declare function showOpenFilePicker(
  options?: OpenFilePickerOptions & { multiple?: false | undefined },
): Promise<[FileSystemFileHandle]>;
export declare function showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
export declare function showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
export declare function showDirectoryPicker(options?: DirectoryPickerOptions): Promise<FileSystemDirectoryHandle>;

export interface ChooseFileSystemEntriesOptionsAccepts {
  description?: string | undefined;
  mimeTypes?: string[] | undefined;
  extensions?: string[] | undefined;
}

export interface ChooseFileSystemEntriesFileOptions {
  accepts?: ChooseFileSystemEntriesOptionsAccepts[] | undefined;
  excludeAcceptAllOption?: boolean | undefined;
}

export interface GetSystemDirectoryOptions {
  type: 'sandbox';
}

export interface FileSystemHandlePermissionDescriptor {
  /**
   * @deprecated Old property just for Chromium <=85. Use `mode: ...` in the new API.
   */
  writable?: boolean | undefined;
}
