import { NotFoundException } from '@nestjs/common';
import {
  DeepPartial,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';

/**
 * Applies a scalar / foreign-key-id patch to an entity and persists it, without
 * ever loading the colliding relation objects first.
 *
 * ## Why this exists (the bug class it prevents)
 *
 * A common update pattern loads an entity WITH its relations
 * (`findOne({ where, relations: [...] })`), then `Object.assign`s a new
 * foreign-key id (e.g. `countryId`, `teamId`, `assigneeMembershipId`) and calls
 * `save()`. On save, TypeORM lets the already-loaded relation OBJECT win over the
 * freshly assigned FK id: the id change is silently dropped, no error is thrown,
 * and the DB keeps the old value.
 *
 * By loading the entity WITHOUT relations before assigning, only scalar/FK
 * columns are present, so the assigned FK id is the single source of truth and
 * the update is honest.
 *
 * The `where` MUST stay org-scoped (e.g. `{ id, organizationId }`) to preserve
 * multi-tenant isolation — a cross-org id must still resolve to NotFound.
 *
 * @param repo  Repository for the entity being updated.
 * @param where Org-scoped lookup (`{ id, organizationId, ... }`).
 * @param patch Only the fields to change (scalars + FK ids).
 * @returns The saved entity (without relations loaded).
 * @throws NotFoundException when no entity matches `where`.
 */
export async function applyScalarUpdate<T extends ObjectLiteral>(
  repo: Repository<T>,
  where: FindOptionsWhere<T>,
  patch: DeepPartial<T>,
): Promise<T> {
  const entity = await repo.findOne({ where });
  if (!entity) {
    throw new NotFoundException(`${repo.metadata.name} not found`);
  }
  Object.assign(entity, patch);
  return repo.save(entity);
}
