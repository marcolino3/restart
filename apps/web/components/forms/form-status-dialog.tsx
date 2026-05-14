'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle, X, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

type FormStatus = 'success' | 'error';

interface FormStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: FormStatus;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function FormStatusDialog({
  open,
  onOpenChange,
  status,
  title,
  description,
  actionLabel,
  onAction,
}: FormStatusDialogProps) {
  const t = useTranslations('FormStatusDialog');

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    onOpenChange(false);
  };

  const isSuccess = status === 'success';
  const isError = status === 'error';

  const getIcon = () => {
    if (isSuccess) {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    }
    if (isError) {
      return <XCircle className="w-8 h-8 text-red-600" />;
    }
    return null;
  };

  const getIconBgClass = () => {
    if (isSuccess) return 'bg-green-100';
    if (isError) return 'bg-red-100';
    return '';
  };

  const getButtonClass = () => {
    if (isSuccess) {
      return 'bg-periparto-green-900 hover:bg-periparto-green-950 text-white';
    }
    if (isError) {
      return 'bg-red-600 hover:bg-red-700 text-white';
    }
    return '';
  };

  const getDefaultTitle = () => {
    if (isSuccess) return t('success.defaultTitle');
    if (isError) return t('error.defaultTitle');
    return '';
  };

  const getDefaultDescription = () => {
    if (isSuccess) return t('success.defaultDescription');
    if (isError) return t('error.defaultDescription');
    return '';
  };

  const getDefaultActionLabel = () => {
    if (isSuccess) return t('success.defaultActionLabel');
    if (isError) return t('error.defaultActionLabel');
    return t('defaultActionLabel');
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className={cn("w-16 h-16 rounded-full flex items-center justify-center", getIconBgClass())}>
              {getIcon()}
            </div>
          </div>
          <AlertDialogTitle className="text-center text-xl">
            {title || getDefaultTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-base mt-2">
            {description || getDefaultDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center">
          <Button
            onClick={handleAction}
            className={cn("px-8", getButtonClass())}
          >
            {actionLabel || getDefaultActionLabel()}
            <X className="size-5" />
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}