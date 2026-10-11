import { describe, expect, it } from 'vitest';
import { assertSeedTarget } from './seed-guard';

describe('assertSeedTarget', () => {
  it('accepte une base locale', () => {
    expect(() => assertSeedTarget('postgres://u:p@localhost:54329/db', '')).not.toThrow();
    expect(() => assertSeedTarget('postgres://u:p@127.0.0.1/db', '')).not.toThrow();
  });

  it('accepte une branche Neon explicitement autorisée', () => {
    expect(() =>
      assertSeedTarget(
        'postgres://u:p@ep-dev-123.eu-central-1.aws.neon.tech/db',
        'ep-dev-123.eu-central-1.aws.neon.tech, ep-preview-456.eu-central-1.aws.neon.tech',
      ),
    ).not.toThrow();
  });

  it('refuse tout autre hôte, à commencer par la production', () => {
    expect(() =>
      assertSeedTarget('postgres://u:p@ep-main-789.eu-central-1.aws.neon.tech/db', 'ep-dev-123'),
    ).toThrow('Seed refusé sur ep-main-789.eu-central-1.aws.neon.tech');
  });

  it('refuse une URL illisible', () => {
    expect(() => assertSeedTarget('pas une url', '')).toThrow('DATABASE_URL illisible');
  });
});
