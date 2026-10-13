import { describe, expect, it } from 'vitest';
import { installMode } from './install.helper';

const IPHONE_SAFARI =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Mobile/15E148 Safari/604.1';
const IPAD_DESKTOP_MODE =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15';
const MAC_SAFARI = IPAD_DESKTOP_MODE;
const MAC_CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const IPHONE_CHROME =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/141.0.0.0 Mobile/15E148 Safari/604.1';
const FIREFOX =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 15.6; rv:143.0) Gecko/20100101 Firefox/143.0';

const env = (userAgent: string, extra: Partial<Parameters<typeof installMode>[0]> = {}) => ({
  userAgent,
  touchPoints: 0,
  standalone: false,
  canPrompt: false,
  ...extra,
});

describe('installMode', () => {
  it('rien à proposer une fois l’app installée', () => {
    expect(installMode(env(IPHONE_SAFARI, { standalone: true }))).toBe('installed');
    expect(installMode(env(MAC_CHROME, { standalone: true, canPrompt: true }))).toBe('installed');
  });

  it('le navigateur sait installer lui-même : on lui passe la main', () => {
    expect(installMode(env(MAC_CHROME, { canPrompt: true }))).toBe('prompt');
  });

  it('iPhone et iPad (même en mode bureau) : passer par le bouton Partager', () => {
    expect(installMode(env(IPHONE_SAFARI))).toBe('ios');
    expect(installMode(env(IPHONE_CHROME))).toBe('ios');
    expect(installMode(env(IPAD_DESKTOP_MODE, { touchPoints: 5 }))).toBe('ios');
  });

  it('Safari sur Mac : Ajouter au Dock', () => {
    expect(installMode(env(MAC_SAFARI))).toBe('mac-safari');
  });

  it('ailleurs, sans invite du navigateur : rien à proposer', () => {
    expect(installMode(env(FIREFOX))).toBe('unavailable');
    expect(installMode(env(MAC_CHROME))).toBe('unavailable');
  });
});
