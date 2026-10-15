import type { RightsNotice } from '@/server/access/access.rights';

/**
 * Encart de droits de la fiche (DESIGN.md, RightsNotice) : composant pur, le texte vient
 * de la policy côté serveur. Puce à l'encre quand on modifie directement, en accent
 * quand il faut suggérer.
 */
export function RightsNoticeBox({ notice }: { notice: RightsNotice | undefined }) {
  if (!notice) return undefined;
  return (
    <p
      data-tone={notice.tone}
      className="flex items-start gap-2.5 rounded-2xl bg-paper px-4 py-3 text-[13px] leading-relaxed text-ink-2"
    >
      <span
        aria-hidden="true"
        className={`mt-1.5 size-2 shrink-0 rounded-full ${notice.tone === 'direct' ? 'bg-ink' : 'bg-accent'}`}
      />
      {notice.text}
    </p>
  );
}
