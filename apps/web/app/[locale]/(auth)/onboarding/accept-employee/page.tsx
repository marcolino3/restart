"use client";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AcceptEmployeeInvitationPage() {
  const token = useSearchParams().get('token');
  const en = useLocale() === 'en';
  const { data: session, refetch } = authClient.useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newAccount, setNewAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>();
  useEffect(() => {
    let cancelled = false;
    void fetch('/api/employee-account/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json();
      if (!cancelled) setOrganizationName(result.organizationName);
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [token]);
  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await action(); } catch { setMessage(en ? 'Could not complete the request. Please try again.' : 'Die Anfrage konnte nicht abgeschlossen werden. Bitte erneut versuchen.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
    <h1 className="text-xl font-semibold">{en ? 'Accept employee invitation' : 'Mitarbeiter-Einladung annehmen'}</h1>
    <p>{en ? 'Sign in using the invited email address. Your account is linked to the organization only after you confirm below.' : 'Melde dich mit der eingeladenen E-Mail-Adresse an. Erst mit deiner ausdrücklichen Bestätigung wird dein Konto mit der Organisation verknüpft.'}</p>
    {organizationName && <p className="font-semibold">{organizationName}</p>}
    {!session ? <form className="flex flex-col gap-3" onSubmit={(event) => { event.preventDefault(); void run(async () => {
      const result = newAccount ? await authClient.signUp.email({ email, password, name: email }) : await authClient.signIn.email({ email, password });
      if (result.error) { setMessage(en ? 'Sign-in failed. Check your email and password.' : 'Anmeldung fehlgeschlagen. E-Mail und Passwort prüfen.'); return; }
      await refetch();
    }); }}>
      <label>{en ? 'Email' : 'E-Mail'}<Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <label>{en ? 'Password' : 'Passwort'}<Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={newAccount ? 'new-password' : 'current-password'} /></label>
      <label><input type="checkbox" checked={newAccount} onChange={(e) => setNewAccount(e.target.checked)} /> {en ? 'Create a new account' : 'Neues Konto erstellen'}</label>
      <Button disabled={busy || !token}>{en ? 'Sign in' : 'Anmelden'}</Button>
    </form> : <>
      <p>{session.user.email}</p>
      <Button disabled={busy || done || !token || !organizationName} onClick={() => void run(async () => {
        const response = await fetch('/api/employee-account/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
        if (!response.ok) { setMessage(en ? 'Invitation expired, already used, or addressed to a different account.' : 'Die Einladung ist abgelaufen, bereits verwendet oder für ein anderes Konto bestimmt.'); return; }
        setDone(true); setMessage(en ? 'Account linked successfully.' : 'Konto erfolgreich verknüpft.');
      })}>{en ? 'Confirm organization membership' : 'Organisationsmitgliedschaft bestätigen'}</Button>
      {!done && <Button variant="ghost" disabled={busy} onClick={() => void authClient.signOut()}>{en ? 'Use a different account' : 'Anderes Konto verwenden'}</Button>}
    </>}
    {message && <p role="status">{message}</p>}
  </main>;
}
