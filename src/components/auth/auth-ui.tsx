// tdd-cover: e2e tests/e2e/auth.spec.ts
import type { ReactNode } from 'react';

// Pièces communes aux étapes de la maquette Connexion : champs et boutons en pilule,
// surtitre, médaillon d'étape. Partagées par la connexion, l'invitation et la demande d'accès.

const focus = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink';

export const pillField = `h-[54px] w-full rounded-full border border-line bg-surface px-[22px] text-base text-ink outline-none placeholder:text-ink-4 focus-visible:ring-2 focus-visible:ring-ink`;

export const pillPrimary = `inline-flex h-[54px] w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-on-ink disabled:opacity-60 ${focus}`;

export const pillSecondary = `inline-flex h-[50px] w-full items-center justify-center gap-2.5 rounded-full border border-line bg-card text-[15px] font-semibold text-ink disabled:opacity-60 ${focus}`;

export const fieldLabel = 'text-sm font-semibold';

export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">{children}</p>
  );
}

/** Médaillon rond qui ouvre une étape centrée (lien envoyé, passkey, demande envoyée). */
export function StepBadge({ tone, children }: { tone: 'accent' | 'neutral'; children: ReactNode }) {
  const colors =
    tone === 'accent'
      ? 'bg-accent-soft text-accent shadow-[0_0_0_1px_var(--color-line),0_14px_30px_oklch(from_var(--color-accent)_l_c_h/0.16)]'
      : 'bg-bubble text-ink shadow-[0_0_0_1px_var(--color-line),0_14px_30px_var(--color-shadow-strong)]';
  return (
    <span
      className={`grid size-24 place-items-center rounded-full border-[5px] border-card ${colors}`}
    >
      {children}
    </span>
  );
}

const icon = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function MailIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.6" {...icon} aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

export function FaceIcon() {
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" strokeWidth="1.6" {...icon} aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
      <path d="M9 9v1M15 9v1M12 9v4h-1M9.5 16c1.5 1 3.5 1 5 0" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" strokeWidth="1.8" {...icon} aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="2" {...icon} aria-hidden="true">
      <circle cx="8" cy="15" r="4" />
      <path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2" />
    </svg>
  );
}

/** Logo Google officiel (« G » multicolore), pour le bouton « Continuer avec Google ». */
export function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
