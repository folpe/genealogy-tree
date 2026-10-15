// tdd-cover: e2e src/app/(public)/request-access/request-access-form.test.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { requestAccessAction } from '@/actions/members.actions';
import { AuthShell } from '@/components/auth/auth-shell';
import { RequestAccessForm } from './request-access-form';

export const metadata: Metadata = { title: 'Demande d’accès' };

export default function RequestAccessPage() {
  return (
    <AuthShell>
      <Link
        href="/login"
        className="mb-[18px] inline-flex h-11 items-center gap-2 self-start rounded-full border border-line bg-card pr-4 pl-2.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Retour à la connexion
      </Link>
      <RequestAccessForm action={requestAccessAction} />
    </AuthShell>
  );
}
