/**
 * Entscheidet fail-closed, ob TypeORM `synchronize` aktiviert werden darf.
 *
 * `synchronize` ist destruktiv (kann Spalten/Tabellen ohne Vorwarnung ändern)
 * und darf NIE in einer geteilten Umgebung laufen — dort wird das Schema
 * ausschliesslich über Migrationen verwaltet. In production/staging ist es
 * deshalb hart gesperrt: eine Fehlkonfiguration (`DB_SYNCHRONIZE=true`) bricht
 * den Boot laut ab, statt still ignoriert zu werden.
 */
const SCHEMA_LOCKED_ENVS = new Set(['production', 'staging']);

export function resolveSynchronize(
  nodeEnv: string | undefined,
  dbSynchronize: string | undefined,
): boolean {
  const wantSynchronize = dbSynchronize === 'true';
  const synchronizeAllowed = !SCHEMA_LOCKED_ENVS.has(nodeEnv ?? '');

  if (wantSynchronize && !synchronizeAllowed) {
    throw new Error(
      `DB_SYNCHRONIZE=true ist in NODE_ENV='${nodeEnv}' nicht erlaubt — ` +
        'Schema-Änderungen laufen hier nur über Migrationen. ' +
        'Setze DB_SYNCHRONIZE=false.',
    );
  }

  return wantSynchronize && synchronizeAllowed;
}
