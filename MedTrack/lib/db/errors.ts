export class DbError extends Error {
  code: string;

  constructor (code: string, message ?:
string) {
  super(message ?? code);
  this.code = code;
  }
}

export const Errors = {
  NOT_FOUND: () => new
  DbError('NOT_FOUND'),
  VALIDATION: (message: string) => new
  DbError('VALIDATION_ERROR',
  message),
    DB_NOT_INITIALIZED: () => new
    DbError('DB_NOT_INITIALIZED')
};

