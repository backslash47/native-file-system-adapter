import { errors } from '../errors';
import { FileHandle, FileHandleOpts, Sink, FileSystemWriteChunkType } from './adapter-types';

const { GONE } = errors;

const isSafari =
  /constructor/i.test(window.HTMLElement as any) || (window as any).safari || (window as any).WebKitPoint;

export class FileHandleDownloader implements FileHandle {
  name: string;
  kind: 'file';
  writable: boolean;
  readable: boolean;
  _deleted: boolean;

  constructor(name = 'unkown') {
    this.name = name;
    this.kind = 'file';
    this.writable = true;
    this.readable = false;
    this._deleted = false;
  }

  async getFile(): Promise<File> {
    throw new Error(...GONE);
  }

  async isSameEntry(other: FileHandle): Promise<boolean> {
    return this === other;
  }

  async remove() {
    this._deleted = true;
  }

  async createWritable(options: FileHandleOpts = {}) {
    if (this._deleted) throw new Error(...GONE);

    const sw = await navigator.serviceWorker.getRegistration();
    const link = document.createElement('a');
    const ts = new TransformStream();
    const sink = ts.writable;

    link.download = this.name;

    if (isSafari || !sw) {
      /** @type {Blob[]} */
      let chunks: BlobPart[] = [];
      ts.readable.pipeTo(
        new WritableStream({
          write(chunk) {
            chunks.push(new Blob([chunk]));
          },
          close() {
            const blob = new Blob(chunks, {
              type: 'application/octet-stream; charset=utf-8',
            });
            chunks = [];
            link.href = URL.createObjectURL(blob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 10000);
          },
        }),
      );
    } else {
      const { writable, readablePort } = new RemoteWritableStream();
      // Make filename RFC5987 compatible
      const fileName = encodeURIComponent(this.name).replace(/['()]/g, escape).replace(/\*/g, '%2A');
      const headers = {
        'content-disposition': "attachment; filename*=UTF-8''" + fileName,
        'content-type': 'application/octet-stream; charset=utf-8',
        ...(options.size ? { 'content-length': options.size } : {}),
      };

      const keepAlive = setTimeout(() => sw.active?.postMessage(0), 10000);

      ts.readable
        .pipeThrough(
          new TransformStream({
            transform(chunk, ctrl) {
              if (chunk instanceof Uint8Array) return ctrl.enqueue(chunk);
              const reader = new Response(chunk).body?.getReader();

              const pump: (_?: any) => void = () =>
                reader?.read().then((e) => (e.done ? 0 : pump(ctrl.enqueue(e.value))));
              return pump();
            },
          }),
        )
        .pipeTo(writable)
        .finally(() => {
          clearInterval(keepAlive);
        });

      // Transfer the stream to service worker
      sw.active?.postMessage(
        {
          url: sw.scope + fileName,
          headers,
          readablePort,
        },
        [readablePort],
      );

      // Trigger the download with a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.hidden = true;
      iframe.src = sw.scope + fileName;
      document.body.appendChild(iframe);
    }

    return sink.getWriter();
  }
}

const WRITE = 0;
const PULL = 0;
const ERROR = 1;
const ABORT = 1;
const CLOSE = 2;

class MessagePortSink implements Sink, UnderlyingSink {
  _port: MessagePort;
  _controller: WritableStreamDefaultController;
  _readyPromise: Promise<any>;
  _readyResolve: any;
  _readyReject: any;
  _readyPending: boolean;

  constructor(port: MessagePort) {
    port.onmessage = (event) => this._onMessage(event.data);
    this._port = port;
    this._resetReady();
  }

  start(controller: WritableStreamDefaultController) {
    this._controller = controller;
    // Apply initial backpressure
    return this._readyPromise;
  }

  write(chunk: FileSystemWriteChunkType) {
    const message = { type: WRITE, chunk };

    // Send chunk
    this._port.postMessage(message, [(chunk as any).buffer]);

    // Assume backpressure after every write, until sender pulls
    this._resetReady();

    // Apply backpressure
    return this._readyPromise;
  }

  close() {
    this._port.postMessage({ type: CLOSE });
    this._port.close();
  }

  abort(reason: string) {
    this._port.postMessage({ type: ABORT, reason });
    this._port.close();
  }

  _onMessage(message: any) {
    if (message.type === PULL) this._resolveReady();
    if (message.type === ERROR) this._onError(message.reason);
  }

  _onError(reason: string) {
    this._controller.error(reason);
    this._rejectReady(reason);
    this._port.close();
  }

  _resetReady() {
    this._readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });
    this._readyPending = true;
  }

  _resolveReady() {
    this._readyResolve();
    this._readyPending = false;
  }

  _rejectReady(reason: string) {
    if (!this._readyPending) this._resetReady();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    this._readyPromise.catch(() => {});
    this._readyReject(reason);
    this._readyPending = false;
  }
}

class RemoteWritableStream {
  readablePort: MessagePort;
  writable: WritableStream;

  constructor() {
    const channel = new MessageChannel();
    this.readablePort = channel.port1;
    this.writable = new WritableStream(new MessagePortSink(channel.port2));
  }
}
