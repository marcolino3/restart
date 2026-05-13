'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface FormActionsProps {
  cancelHref: string;
  isSaving: boolean;
}

export const FormActions = ({ cancelHref, isSaving }: FormActionsProps) => {
  const t = useTranslations('Common');

  return (
    <div className="space-x-4 text-right">
      <Button variant="outline" asChild>
        <Link href={cancelHref}>{t('cancel')}</Link>
      </Button>

      <Button type="submit" disabled={isSaving}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {t('save')}
      </Button>
    </div>
  );
};
