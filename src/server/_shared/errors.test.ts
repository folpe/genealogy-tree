import { describe, expect, it } from 'vitest';
import { AppError, isAppError, ValidationError } from './errors';

describe('AppError', () => {
  it('porte un code et un statut stables', () => {
    const error = new AppError({ message: 'boom', code: 'BOOM', status: 418 });
    expect(error.code).toBe('BOOM');
    expect(error.status).toBe(418);
    expect(error.message).toBe('boom');
  });

  it('a des valeurs par défaut', () => {
    const error = new AppError({ message: 'boom' });
    expect(error.code).toBe('APP_ERROR');
    expect(error.status).toBe(500);
  });

  it('conserve la cause', () => {
    const cause = new Error('origine');
    expect(new ValidationError('invalide', cause).cause).toBe(cause);
  });
});

describe('isAppError', () => {
  it('reconnaît les sous-classes', () => {
    expect(isAppError(new ValidationError('invalide'))).toBe(true);
  });

  it('rejette les erreurs natives et les valeurs quelconques', () => {
    expect(isAppError(new Error('x'))).toBe(false);
    expect(isAppError('x')).toBe(false);
  });
});
