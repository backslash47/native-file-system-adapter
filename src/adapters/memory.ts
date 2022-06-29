import { errors } from '../errors';
import { FileHandle, Sink, FileHandleOpts, FileSystemWriteChunkType, WriteParams } from './adapter-types';

const { INVALID, GONE, SYNTAX, DISALLOWED } = errors;

export class SinkMemory implements Sink {
  private fileHandle: FileHandleMemory;
  private file: File;
  private size: number;
  private position: number;

  constructor(fileHandle: FileHandleMemory, file: File) {
    this.fileHandle = fileHandle;
    this.file = file;
    this.size = file.size;
    this.position = 0;
  }

  write(chunk: FileSystemWriteChunkType) {
    let file = this.file;

    if (this.isWriteParams(chunk)) {
      if (chunk.type === 'write') {
        if (chunk.position !== undefined && Number.isInteger(chunk.position) && chunk.position >= 0) {
          this.position = chunk.position;
          if (this.size < chunk.position) {
            this.file = new File([this.file, new ArrayBuffer(chunk.position - this.size)], this.file.name, this.file);
          }
        }
        if (!('data' in chunk)) {
          throw new Error(...SYNTAX('write requires a data argument'));
        }
        chunk = chunk.data;
      } else if (chunk.type === 'seek') {
        if (Number.isInteger(chunk.position) && chunk.position >= 0) {
          if (this.size < chunk.position) {
            throw new Error(...INVALID);
          }
          this.position = chunk.position;
          return;
        } else {
          throw new Error(...SYNTAX('seek requires a position argument'));
        }
      } else if (chunk.type === 'truncate') {
        if (Number.isInteger(chunk.size) && chunk.size >= 0) {
          file =
            chunk.size < this.size
              ? new File([file.slice(0, chunk.size)], file.name, file)
              : new File([file, new Uint8Array(chunk.size - this.size)], file.name);

          this.size = file.size;
          if (this.position > file.size) {
            this.position = file.size;
          }
          this.file = file;
          return;
        } else {
          throw new Error(...SYNTAX('truncate requires a size argument'));
        }
      }
    }

    chunk = new Blob([chunk]);

    let blob = this.file;
    // Calc the head and tail fragments
    const head = blob.slice(0, this.position);
    const tail = blob.slice(this.position + chunk.size);

    // Calc the padding
    let padding = this.position - head.size;
    if (padding < 0) {
      padding = 0;
    }
    blob = new File([head, new Uint8Array(padding), chunk, tail], blob.name);

    this.size = blob.size;
    this.position += chunk.size;

    this.file = blob;
  }
  close() {
    if (this.fileHandle._deleted) throw new Error(...GONE);
    this.fileHandle._file = this.file;
    this.file = null as any;
    this.position = this.size = 0;
    if (this.fileHandle.onclose) {
      this.fileHandle.onclose(this.fileHandle);
    }
  }

  private isWriteParams(chunk: FileSystemWriteChunkType): chunk is WriteParams {
    return (chunk as any).type !== undefined;
  }
}

export class FileHandleMemory implements FileHandle {
  _file: File;
  _deleted: boolean;
  name: string;
  kind: 'file' | 'directory';
  writable: boolean;
  readable: boolean;
  onclose: ((handle: FileHandleMemory) => void) | null;

  constructor(name = '', file = new File([], name), writable = true) {
    this._file = file;
    this.name = name;
    this.kind = 'file';
    this._deleted = false;
    this.writable = writable;
    this.readable = true;
  }

  async getFile() {
    if (this._deleted) throw new Error(...GONE);
    return this._file;
  }

  async createWritable(opts: FileHandleOpts): Promise<Sink> {
    if (!this.writable) throw new Error(...DISALLOWED);
    if (this._deleted) throw new Error(...GONE);

    const file = opts.keepExistingData ? await this.getFile() : new File([], this.name);

    return new SinkMemory(this, file);
  }

  async isSameEntry(other: FileHandle): Promise<boolean> {
    return this === other;
  }

  async remove() {
    this._destroy();
  }

  async _destroy() {
    this._deleted = true;
    this._file = null as any;
  }
}
