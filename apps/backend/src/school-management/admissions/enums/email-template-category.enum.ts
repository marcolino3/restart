import { registerEnumType } from '@nestjs/graphql';

export enum EmailTemplateCategory {
  ADMISSION = 'ADMISSION',
  GENERAL = 'GENERAL',
}

registerEnumType(EmailTemplateCategory, {
  name: 'EmailTemplateCategory',
});
