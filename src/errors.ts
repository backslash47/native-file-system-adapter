export const errors = {
  INVALID: ['seeking position failed.', 'InvalidStateError'],
  GONE: ['A requested file or directory could not be found at the time an operation was processed.', 'NotFoundError'],
  MISMATCH: ['The path supplied exists, but was not an entry of requested type.', 'TypeMismatchError'],
  MOD_ERR: ['The object can not be modified in this way.', 'InvalidModificationError'],
  SYNTAX: (m: string) => [
    `Failed to execute 'write' on 'UnderlyingSinkBase': Invalid params passed. ${m}`,
    'SyntaxError',
  ],
  SECURITY: [
    'It was determined that certain files are unsafe for access within a Web application, or that too many calls are being made on file resources.',
    'SecurityError',
  ],
  DISALLOWED: [
    'The request is not allowed by the user agent or the platform in the current context.',
    'NotAllowedError',
  ],
};
