import { registerEnumType } from '@nestjs/graphql';

export enum AdmissionAuditAction {
  CREATED = 'CREATED',
  STAGE_CHANGED = 'STAGE_CHANGED',
  FIELD_UPDATED = 'FIELD_UPDATED',
  CONTACT_ADDED = 'CONTACT_ADDED',
  CONTACT_REMOVED = 'CONTACT_REMOVED',
  NOTE_ADDED = 'NOTE_ADDED',
  FORM_SUBMITTED = 'FORM_SUBMITTED',
  ENROLLED = 'ENROLLED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
  RESTORED = 'RESTORED',
}

registerEnumType(AdmissionAuditAction, {
  name: 'AdmissionAuditAction',
});
