import { FileSystemHandlePermissionDescriptor } from '../types';

export type WriteParams =
  | {
      type: 'write';
      position?: number | undefined;
      data: BufferSource | Blob | string;
    }
  | { type: 'seek'; position: number }
  | { type: 'truncate'; size: number };

export type FileSystemWriteChunkType = BufferSource | Blob | string | WriteParams;

export interface Sink {
  write(chunk: FileSystemWriteChunkType): void;
  close(): void;
}

export interface FileHandleOpts {
  keepExistingData?: boolean;
  size?: number;
}

export interface RemoveOpts {
  recursive: boolean;
}

export type RequestPermissionResult = 'granted' | 'denied';

export interface FileHandle {
  kind: 'file' | 'directory';
  name: string;
  writable: boolean;
  readable: boolean;

  getFile(): Promise<File>;

  remove(opts: RemoveOpts): Promise<void>;

  createWritable(opts: FileHandleOpts): Promise<Sink>;
  isSameEntry(other: FileHandle): Promise<boolean>;

  queryPermission?(opts: FileSystemHandlePermissionDescriptor): PermissionState;
  requestPermission?(opts: FileSystemHandlePermissionDescriptor): PermissionState;
}
