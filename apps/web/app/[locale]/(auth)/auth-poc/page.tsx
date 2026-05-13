'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_API_URL ?? 'http://localhost:4001/graphql';

export default function AuthPocPage() {
  const session = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [gqlResult, setGqlResult] = useState<unknown>(null);

  const testGraphQL = async () => {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: /* GraphQL */ `
          query {
            currentUserViaBetterAuth {
              id
              username
              isSuperAdmin
            }
          }
        `,
      }),
    });
    setGqlResult(await res.json());
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: `${window.location.origin}/de/auth-poc`,
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">better-auth POC</h1>

      <section className="rounded-md border p-4">
        <h2 className="mb-2 font-semibold">Session state</h2>
        <pre className="overflow-auto rounded bg-muted p-3 text-xs">
          {JSON.stringify(session.data, null, 2)}
        </pre>
        {session.isPending && <p className="text-sm">Loading…</p>}
        {session.error && (
          <p className="text-sm text-destructive">
            Error: {session.error.message}
          </p>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        {session.data?.user ? (
          <>
            <Button onClick={handleSignOut} variant="outline">
              Sign out
            </Button>
            <Button onClick={testGraphQL} variant="secondary">
              Test GraphQL (currentUserViaBetterAuth)
            </Button>
          </>
        ) : (
          <Button onClick={handleGoogleSignIn} disabled={loading}>
            {loading ? 'Redirecting…' : 'Sign in with Google'}
          </Button>
        )}
      </section>

      {gqlResult !== null && (
        <section className="rounded-md border p-4">
          <h2 className="mb-2 font-semibold">GraphQL response</h2>
          <pre className="overflow-auto rounded bg-muted p-3 text-xs">
            {JSON.stringify(gqlResult, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
