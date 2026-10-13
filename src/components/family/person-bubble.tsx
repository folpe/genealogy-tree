// tdd-cover: e2e src/components/family/family-views.test.tsx
import type { PersonPhoto } from '@/server/media/media.url';

const BUBBLES = {
  chip: { box: 'size-[30px] border-2 text-[11px]', sizes: '30px' },
  result: { box: 'size-[42px] border-2 text-[15px]', sizes: '42px' },
  tree: { box: 'size-[76px] border-4 text-[24px]', sizes: '76px' },
  sheet: { box: 'size-[120px] border-[5px] text-[42px]', sizes: '120px' },
} as const;

/**
 * `ink-2` sur une bulle ne se lit qu'en grand (contraste, globals.test.ts) : les petites
 * bulles d'une personne décédée gardent l'encre.
 */
const LARGE = new Set<keyof typeof BUBBLES>(['tree', 'sheet']);

/**
 * Bulle de la maquette (DESIGN.md) : la photo si le service en a signé une, sinon
 * les initiales. L'aperçu flou occupe la bulle pendant le chargement. `name` vide :
 * la photo est décorative, le nom suit déjà dans le même élément.
 */
export function PersonBubble({
  initials,
  deceased,
  photo,
  size,
  name,
}: {
  initials: string;
  deceased: boolean;
  photo: PersonPhoto | undefined;
  size: keyof typeof BUBBLES;
  name: string;
}) {
  const { box, sizes } = BUBBLES[size];
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-card bg-cover bg-center font-display shadow-bubble ${box} ${deceased ? `bg-bubble-past ${LARGE.has(size) ? 'text-ink-2' : 'text-ink'}` : 'bg-bubble'}`}
      style={photo?.blurDataUrl ? { backgroundImage: `url("${photo.blurDataUrl}")` } : undefined}
    >
      {photo ? (
        // biome-ignore lint/performance/noImgElement: dérivées déjà produites et signées par le serveur ; l'optimiseur de Next les retéléchargerait.
        <img
          src={photo.src}
          srcSet={photo.srcSet}
          sizes={sizes}
          width={photo.width}
          height={photo.height}
          alt={name}
          loading="lazy"
          decoding="async"
          draggable={false}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
