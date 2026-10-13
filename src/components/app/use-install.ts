// tdd-cover: e2e src/components/app/account-menu.test.tsx
'use client';

import { useEffect, useState } from 'react';
import { type InstallMode, installMode } from './install.helper';

// Invite d'installation de Chrome, Edge et Android, absente des types du DOM.
type InstallPrompt = Event & { prompt: () => Promise<unknown> };

const isInstallPrompt = (event: Event): event is InstallPrompt =>
  'prompt' in event && typeof event.prompt === 'function';

/** iOS signale l'app installée par `navigator.standalone`, les autres par la media query. */
const runsStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Reflect.get(navigator, 'standalone') === true;

/**
 * Mode d'installation de cet appareil. Calculé après le montage seulement : le
 * serveur ne connaît pas le navigateur, et le rendu doit rester le même des deux côtés.
 */
export function useInstall(): { mode: InstallMode; prompt: () => Promise<void> } {
  const [deferred, setDeferred] = useState<InstallPrompt>();
  const [mode, setMode] = useState<InstallMode>('unavailable');

  useEffect(() => {
    const update = (canPrompt: boolean) =>
      setMode(
        installMode({
          userAgent: navigator.userAgent,
          touchPoints: navigator.maxTouchPoints,
          standalone: runsStandalone(),
          canPrompt,
        }),
      );
    const onPrompt = (event: Event) => {
      if (!isInstallPrompt(event)) return;
      // Le navigateur garde son invite pour le moment où on la demande.
      event.preventDefault();
      setDeferred(event);
      update(true);
    };
    const onInstalled = () => {
      setDeferred(undefined);
      setMode('installed');
    };
    update(false);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return {
    mode,
    prompt: async () => {
      await deferred?.prompt();
      // Une invite ne sert qu'une fois ; le navigateur en reproposera une plus tard.
      setDeferred(undefined);
      setMode('unavailable');
    },
  };
}
