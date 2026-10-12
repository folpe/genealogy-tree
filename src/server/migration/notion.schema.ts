// tdd-cover: e2e src/server/migration/notion.transform.test.ts
import { z } from 'zod';

// Frontière de confiance de la reprise : la forme des pages de l'ancienne base
// Notion, réduite aux propriétés reprises. Le reste de la page est ignoré.

const richText = z.object({ rich_text: z.array(z.object({ plain_text: z.string() })) });
const dateProperty = z.object({ date: z.object({ start: z.string() }).nullish() });
const relation = z.object({ relation: z.array(z.object({ id: z.string().min(1) })) });
const fileUrl = z.object({ url: z.string() });

export const notionPageSchema = z.object({
  id: z.string().min(1),
  url: z.string(),
  properties: z.object({
    firstName: richText,
    lastName: richText,
    maidenName: richText.optional(),
    nickName: richText.optional(),
    gender: z.object({ select: z.object({ name: z.string() }).nullish() }).optional(),
    birthDate: dateProperty.optional(),
    birthLocation: richText.optional(),
    deathDate: dateProperty.optional(),
    city: richText.optional(),
    country: richText.optional(),
    photo: z
      .object({
        files: z.array(
          z.object({ name: z.string(), file: fileUrl.optional(), external: fileUrl.optional() }),
        ),
      })
      .optional(),
    parentsIds: relation.optional(),
    childrenIds: relation.optional(),
    partnerId: relation.optional(),
  }),
});
export type NotionPage = z.infer<typeof notionPageSchema>;

/** Texte d'une propriété riche, morceaux recollés et espaces superflus retirés. */
export function plainText(property: { rich_text: { plain_text: string }[] } | undefined): string {
  return (property?.rich_text ?? [])
    .map((part) => part.plain_text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** URLs des photos d'une page : fichier hébergé par Notion (signé) ou lien externe. */
export function photoFiles(page: NotionPage): { name: string; url: string }[] {
  return (page.properties.photo?.files ?? []).flatMap((f) => {
    const url = f.file?.url ?? f.external?.url;
    return url ? [{ name: f.name, url }] : [];
  });
}
