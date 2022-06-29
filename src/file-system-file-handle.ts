import { FileSystemHandleImpl } from './file-system-handle';
import { FileSystemWritableFileStreamImpl } from './file-system-writable-file-stream';
import { FileHandle, FileHandleOpts } from './adapters/adapter-types';
import { FileSystemFileHandle } from './types';

const kAdapter = Symbol('adapter');

export class FileSystemFileHandleImpl extends FileSystemHandleImpl implements FileSystemFileHandle {
  kind: 'file';
  isFile: true;
  isDirectory: false;
  [kAdapter]: FileHandle;

  constructor(adapter: FileHandle) {
    super(adapter);
    this[kAdapter] = adapter;
  }

  async createWritable(options: FileHandleOpts = {}) {
    return new FileSystemWritableFileStreamImpl(await this[kAdapter].createWritable(options));
  }

  async getFile(): Promise<File> {
    return this[kAdapter].getFile();
  }
}

Object.defineProperty(FileSystemFileHandleImpl.prototype, Symbol.toStringTag, {
  value: 'FileSystemFileHandle',
  writable: false,
  enumerable: false,
  configurable: true,
});

Object.defineProperties(FileSystemFileHandleImpl.prototype, {
  createWritable: { enumerable: true },
  getFile: { enumerable: true },
});
