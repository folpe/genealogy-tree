// Comment installer l'app, selon le navigateur. Chrome, Edge et Android ont leur
// propre invite (`beforeinstallprompt`) ; Safari n'en a pas : sur iPhone et iPad,
// on passe par le bouton Partager, sur Mac par « Ajouter au Dock ».

export type InstallMode = 'installed' | 'prompt' | 'ios' | 'mac-safari' | 'unavailable';

export type InstallEnv = {
  userAgent: string;
  /** `navigator.maxTouchPoints` : un iPad en mode bureau se dit Mac, mais il est tactile. */
  touchPoints: number;
  /** L'app tourne déjà installée (`display-mode: standalone`). */
  standalone: boolean;
  /** Le navigateur a proposé son invite d'installation. */
  canPrompt: boolean;
};

const isAppleMobile = ({ userAgent, touchPoints }: InstallEnv) =>
  /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && touchPoints > 1);

const isMacSafari = ({ userAgent }: InstallEnv) =>
  /Macintosh/.test(userAgent) &&
  /Version\/[\d.]+ Safari/.test(userAgent) &&
  !/Chrome|Chromium|Edg|Firefox/.test(userAgent);

export function installMode(env: InstallEnv): InstallMode {
  if (env.standalone) return 'installed';
  if (env.canPrompt) return 'prompt';
  if (isAppleMobile(env)) return 'ios';
  if (isMacSafari(env)) return 'mac-safari';
  return 'unavailable';
}
