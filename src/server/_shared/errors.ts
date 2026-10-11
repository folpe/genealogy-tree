// Repris de void-starter (packages/core/src/errors.ts) pour faciliter la phase 3.

type AppErrorOptions = {
  message: string;
  code?: string;
  status?: number;
  cause?: unknown;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  override readonly cause: unknown;

  constructor({ message, code = 'APP_ERROR', status = 500, cause }: AppErrorOptions) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.cause = cause;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super({ message, code: 'VALIDATION', status: 400, cause });
    this.name = 'ValidationError';
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
