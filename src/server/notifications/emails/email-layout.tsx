// tdd-cover: e2e src/server/notifications/email.test.ts
import type { CSSProperties, ReactNode } from 'react';
import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from 'react-email';
import { APP_NAME } from '@/lib/brand';

// Mise en page commune des emails, style Album (DESIGN.md, maquette EmailVeille).
// Styles en ligne et thème clair uniquement : les clients mail sombres inversent
// mal les couleurs. Les polices web ne chargent que dans Apple Mail et iOS ;
// ailleurs, Georgia et la police système prennent le relais.

/** Tokens du thème Album, en hex : les clients mail ne lisent pas OKLCH. */
const album = {
  paper: '#F6F2EA',
  surface: '#FBF9F5',
  card: '#FFFFFF',
  ink: '#1F1C19',
  ink2: '#6F675D',
  ink3: '#8A8278',
  ink4: '#9A9186',
  line: '#E4DCCF',
  rule: '#EFE9DF',
  bubblePast: '#E3DED6',
  accent: '#A4532F',
  onInk: '#F6F2EA',
} as const;

const display = "Fraunces, Georgia, 'Times New Roman', serif";
const sans = "Figtree, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500' +
  '&family=Figtree:wght@400;600&display=swap';

const smallCaps: CSSProperties = {
  margin: 0,
  fontFamily: sans,
  fontSize: '12px',
  lineHeight: '16px',
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

export function EmailLayout({
  origin,
  preview,
  kicker,
  title,
  footer,
  children,
}: {
  /** Origine de l'app (`https://famille.folpe.me`), qui sert le logo. */
  origin: string;
  /** Aperçu affiché par les boîtes mail à côté de l'objet. */
  preview: string;
  kicker: string;
  title: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <Html lang="fr" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <link rel="stylesheet" href={FONTS_URL} />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, padding: '28px 12px', backgroundColor: album.paper }}>
        <Container style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
          <Section style={{ padding: '0 12px 16px' }}>
            <Row>
              <Column style={{ width: '42px' }}>
                <Img
                  src={`${origin}/email/logo.png`}
                  width="32"
                  height="32"
                  alt=""
                  style={{ display: 'block', borderRadius: '50%' }}
                />
              </Column>
              <Column>
                <Text
                  style={{
                    margin: 0,
                    fontFamily: display,
                    fontSize: '19px',
                    fontWeight: 500,
                    color: album.ink,
                  }}
                >
                  {APP_NAME}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section
            style={{
              backgroundColor: album.card,
              border: `1px solid ${album.line}`,
              borderRadius: '28px',
              padding: '32px 32px 30px',
            }}
          >
            <Text style={{ ...smallCaps, color: album.accent }}>{kicker}</Text>
            <Heading
              as="h1"
              style={{
                margin: '14px 0 0',
                fontFamily: display,
                fontSize: '30px',
                lineHeight: '35px',
                fontWeight: 400,
                letterSpacing: '-0.01em',
                color: album.ink,
              }}
            >
              {title}
            </Heading>
            {children}
          </Section>

          <Text
            style={{
              margin: '20px 0 0',
              padding: '0 12px',
              fontFamily: sans,
              fontSize: '12px',
              lineHeight: '19px',
              color: album.ink3,
              textAlign: 'center',
            }}
          >
            {footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: '14px 0 0',
        fontFamily: sans,
        fontSize: '15px',
        lineHeight: '23px',
        color: album.ink2,
      }}
    >
      {children}
    </Text>
  );
}

/** Bouton principal : pilule d'encre, 50 px de haut, comme dans l'app. */
export function PrimaryButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ marginTop: '24px' }}>
      <Button
        href={href}
        style={{
          display: 'block',
          boxSizing: 'border-box',
          width: '100%',
          padding: '15px 24px',
          borderRadius: '999px',
          backgroundColor: album.ink,
          color: album.onInk,
          fontFamily: sans,
          fontSize: '15px',
          lineHeight: '20px',
          fontWeight: 600,
          textAlign: 'center',
          textDecoration: 'none',
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

/** Bulle d'initiales et nom, comme une fiche de l'arbre. */
export function PersonCard({
  initials,
  name,
  detail,
}: {
  initials: string;
  name: string;
  detail: string;
}) {
  return (
    <Section
      style={{
        marginTop: '20px',
        padding: '16px 18px',
        borderRadius: '20px',
        backgroundColor: album.paper,
      }}
    >
      <Row>
        <Column style={{ width: '70px', verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              width: '56px',
              height: '56px',
              lineHeight: '56px',
              borderRadius: '50%',
              backgroundColor: album.bubblePast,
              border: `3px solid ${album.card}`,
              textAlign: 'center',
              fontFamily: display,
              fontSize: '19px',
              color: album.ink3,
            }}
          >
            {initials}
          </Text>
        </Column>
        <Column style={{ verticalAlign: 'middle' }}>
          <Text
            style={{
              margin: 0,
              fontFamily: display,
              fontSize: '19px',
              lineHeight: '24px',
              color: album.ink,
            }}
          >
            {name}
          </Text>
          <Text
            style={{
              margin: '2px 0 0',
              fontFamily: sans,
              fontSize: '13px',
              lineHeight: '18px',
              color: album.ink3,
            }}
          >
            {detail}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}

/** Note discrète sous le bouton, centrée. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: '14px 0 0',
        fontFamily: sans,
        fontSize: '13px',
        lineHeight: '20px',
        color: album.ink3,
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );
}

/** Lien en clair pour les clients qui bloquent les boutons ; absent du texte brut. */
export function FallbackLink({ href }: { href: string }) {
  return (
    <Section
      data-skip-in-text="true"
      style={{ marginTop: '22px', paddingTop: '18px', borderTop: `1px solid ${album.rule}` }}
    >
      <Text style={{ ...smallCaps, color: album.ink4 }}>Le bouton ne marche pas ?</Text>
      <Text
        style={{
          margin: '6px 0 0',
          fontFamily: sans,
          fontSize: '13px',
          lineHeight: '19px',
          color: album.ink2,
        }}
      >
        Copie ce lien dans ton navigateur :{' '}
        <Link href={href} style={{ color: album.accent, wordBreak: 'break-all' }}>
          {href}
        </Link>
      </Text>
    </Section>
  );
}

/** Encadré de citation (lien de parenté déclaré, message). */
export function Quote({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Section
      style={{
        marginTop: '12px',
        padding: '14px 16px',
        borderRadius: '18px',
        border: `1px solid ${album.line}`,
        backgroundColor: album.surface,
      }}
    >
      <Text style={{ ...smallCaps, color: album.accent }}>{label}</Text>
      <Text
        style={{
          margin: '6px 0 0',
          fontFamily: display,
          fontSize: '19px',
          lineHeight: '26px',
          color: album.ink,
        }}
      >
        {children}
      </Text>
    </Section>
  );
}
