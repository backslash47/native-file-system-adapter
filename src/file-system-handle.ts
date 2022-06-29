import { FileHandle, RemoveOpts } from './adapters/adapter-types';
import { FileSystemHandle, FileSystemHandlePermissionDescriptor } from './types';

const kAdapter = Symbol('adapter');

export abstract class FileSystemHandleImpl implements FileSystemHandle {
  name: string;
  [kAdapter]: FileHandle;

  constructor(adapter: FileHandle) {
    this.name = adapter.name;
    this[kAdapter] = adapter;
  }

  abstract get kind(): 'file' | 'directory';

  abstract get isFile(): boolean;

  abstract get isDirectory(): boolean;

  async queryPermission({ mode }: FileSystemHandlePermissionDescriptor = { mode: 'read' }) {
    const handle = this[kAdapter];

    if (handle.queryPermission) {
      return handle.queryPermission({ mode });
    }

    if (mode === 'read') {
      return 'granted';
    } else if (mode === 'readwrite') {
      return handle.writable ? 'granted' : 'denied';
    } else {
      throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`);
    }
  }

  async requestPermission({ mode }: FileSystemHandlePermissionDescriptor = { mode: 'read' }) {
    const handle = this[kAdapter];
    if (handle.requestPermission) {
      return handle.requestPermission({ mode });
    }

    if (mode === 'read') {
      return 'granted';
    } else if (mode === 'readwrite') {
      return handle.writable ? 'granted' : 'denied';
    } else {
      throw new TypeError(`Mode ${mode} must be 'read' or 'readwrite'`);
    }
  }

  async remove(options: RemoveOpts = { recursive: false }) {
    await this[kAdapter].remove(options);
  }

  async isSameEntry(other: FileSystemHandle): Promise<boolean> {
    if (this === other) return true;
    if (!(other instanceof FileSystemHandleImpl)) {
      return false;
    }
    if (this.kind !== other.kind || !other[kAdapter]) return false;
    return this[kAdapter].isSameEntry(other[kAdapter]);
  }
}

Object.defineProperty(FileSystemHandleImpl.prototype, Symbol.toStringTag, {
  value: 'FileSystemHandle',
  writable: false,
  enumerable: false,
  configurable: true,
});
