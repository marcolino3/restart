'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { authClient } from '@/lib/auth-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ChangeAccountEmailPage() {
  const locale=useLocale(), en=locale==='en';
  const token=useSearchParams().get('token');
  const { data:session,refetch }=authClient.useSession();
  const [email,setEmail]=useState(''), [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false), [message,setMessage]=useState(''), [completed,setCompleted]=useState(false);
  const run=async (operation:()=>Promise<void>) => {
    if (busy) return;
    setBusy(true); setMessage('');
    try { await operation(); }
    catch { setMessage(en?'Request failed. Sign in again or request new confirmation links.':'Anfrage fehlgeschlagen. Melde dich erneut an oder fordere neue Bestätigungslinks an.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto flex max-w-md flex-col gap-4 p-8">
    <h1 className="text-xl font-semibold">{en?'Change your login email':'Eigene Login-E-Mail ändern'}</h1>
    <p>{en?'Only your own account can be changed here. Confirm the links sent to both your current and your new mailbox within 24 hours. Organization contact details remain unchanged.':'Hier kannst du nur dein eigenes Konto ändern. Bestätige innerhalb von 24 Stunden die Links in deinem bisherigen und deinem neuen Postfach. Organisationsbezogene Kontaktdaten bleiben unverändert.'}</p>
    {completed ? <Link href={`/${locale}/sign-in`}>{en?'Sign in with your new email':'Mit der neuen E-Mail anmelden'}</Link> : !session ? <form className="flex flex-col gap-3" onSubmit={(event)=>{event.preventDefault(); void run(async()=>{
      const result=await authClient.signIn.email({email,password});
      if(result.error) throw new Error('Sign-in failed');
      await refetch(); setEmail('');
    });}}>
      <label>{en?'Current email':'Bisherige E-Mail'}<Input type="email" required value={email} onChange={(event)=>setEmail(event.target.value)} /></label>
      <label>{en?'Password':'Passwort'}<Input type="password" required value={password} onChange={(event)=>setPassword(event.target.value)} autoComplete="current-password" /></label>
      <Button disabled={busy}>{en?'Sign in':'Anmelden'}</Button>
    </form> : <>
      <p>{session.user.email}</p>
      {token ? <Button disabled={busy} onClick={()=>void run(async()=>{
        const response=await fetch('/api/account-email/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});
        if(!response.ok) throw new Error('Confirmation failed');
        const result=await response.json();
        setCompleted(result.completed);
        setMessage(result.completed ? (en?'Email changed. All previous sessions have been signed out.':'E-Mail geändert. Alle bisherigen Sitzungen wurden abgemeldet.') : (en?'Mailbox confirmed. Confirm the link in the other mailbox to finish.':'Postfach bestätigt. Bestätige zum Abschluss den Link im anderen Postfach.'));
      })}>{en?'Confirm this mailbox':'Dieses Postfach bestätigen'}</Button> : <form className="flex flex-col gap-3" onSubmit={(event)=>{event.preventDefault(); void run(async()=>{
        const response=await fetch('/api/account-email/request',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        if(!response.ok) throw new Error('Request failed');
        setMessage(en?'Confirmation links sent to both mailboxes.':'Bestätigungslinks an beide Postfächer gesendet.');
      });}}>
        <label>{en?'New email':'Neue E-Mail'}<Input type="email" maxLength={320} required value={email} onChange={(event)=>setEmail(event.target.value)} /></label>
        <Button disabled={busy}>{en?'Request email change':'E-Mail-Wechsel anfordern'}</Button>
      </form>}
    </>}
    {message && <p role="status">{message}</p>}
  </main>;
}
