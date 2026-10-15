import type { CSSProperties, Ref } from 'react';

/**
 * Titre révélé mot à mot (spec 9, Connexion) : chaque mot monte de sous sa ligne, en CSS
 * (`.reveal-word`), découpé au rendu serveur. Le titre est complet dès le HTML : rien
 * n'attend un script, et le mouvement réduit le montre en fondu.
 */
export function RevealTitle({
  text,
  className = '',
  ref,
}: {
  text: string;
  className?: string;
  ref?: Ref<HTMLHeadingElement>;
}) {
  const words = text.split(' ');
  return (
    <h1
      ref={ref}
      tabIndex={-1}
      className={`font-display text-[34px] leading-[1.1] tracking-[-0.01em] outline-none sm:text-[40px] ${className}`}
    >
      {/* Les mots en blocs se liraient collés : le titre se dit d'un seul tenant. */}
      <span className="sr-only">{text}</span>
      {words.map((word, index) => (
        // Un même mot peut revenir dans un titre : sa place le distingue.
        // biome-ignore lint/suspicious/noArrayIndexKey: liste figée, rendue une fois.
        <span key={index} aria-hidden="true">
          <span className="reveal-mask">
            <span data-word className="reveal-word" style={wordStyle(index)}>
              {word}
            </span>
          </span>
          {index < words.length - 1 ? ' ' : undefined}
        </span>
      ))}
    </h1>
  );
}

type WordStyle = CSSProperties & { '--word': number };

/** Rang du mot, qui décale son entrée (`--word` dans globals.css). */
const wordStyle = (index: number): WordStyle => ({ '--word': index });
