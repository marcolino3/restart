'use client';

import { useState } from 'react';
import { useFormContext, useController } from 'react-hook-form';
import {
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { FieldActionButtons } from '@/components/common/buttons/field-buttons';
import { useTranslations } from 'next-intl';
import { hasText } from '@/lib/utils/has-text';
import { CheckCircle } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { TextareaSkeleton } from '../common/skeletons.tsx/textarea-skeleton';
import { generateAutoCorrectionAction } from '@/actions/common/generate-auto-correct.action';
import { generateImprovedTextAction } from '@/actions/common/generate-improved-text.input';
import { generateTranslations } from '@/actions/common/generate-translations.action';

interface Props {
  name: string;
  label: string;
  index: number;
  /** If true, label is already translated and won't be passed through t() */
  rawLabel?: boolean;
  /** If true, shows a checkmark indicator next to the label */
  isTranslated?: boolean;
  /** @deprecated - No longer needed, actions are handled internally */
  isLoading?: boolean;
  /** @deprecated - No longer needed, actions are handled internally */
  onAutocorrection?: (index: number, value: string, fieldName: string) => void;
  /** @deprecated - No longer needed, actions are handled internally */
  onImproveText?: (index: number, value: string, fieldName: string) => void;
  /** @deprecated - No longer needed, actions are handled internally */
  onTranslate?: (index: number, value: string, fieldName: string) => void;
}

export const FormTextareaWithActions = ({
  name,
  label,
  index,
  rawLabel = false,
  isTranslated = false,
  // Deprecated props - ignored but accepted for backwards compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isLoading: _isLoading,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAutocorrection: _onAutocorrection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onImproveText: _onImproveText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTranslate: _onTranslate,
}: Props) => {
  const form = useFormContext();
  const { control } = useFormContext();
  const { field } = useController({ name, control });
  const t = useTranslations('Common');
  const [isLoading, setIsLoading] = useState(false);

  // Extract the field key from name (e.g., "translations.0.keywords" -> "keywords")
  const getFieldKey = () => {
    const parts = name.split('.');
    return parts[parts.length - 1];
  };

  const handleAutocorrection = async (value: string) => {
    try {
      setIsLoading(true);
      const res = await generateAutoCorrectionAction(value);
      if (res.success && res.data) {
        form.setValue(name, res.data);
      }
    } catch (error) {
      console.error('Autocorrection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImproveText = async (value: string) => {
    try {
      setIsLoading(true);
      const res = await generateImprovedTextAction(value);
      if (res.success && res.data) {
        form.setValue(name, res.data);
      }
    } catch (error) {
      console.error('Improve text failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (value: string) => {
    try {
      setIsLoading(true);
      const res = await generateTranslations({ index, text: value });
      if (res.success && res.data) {
        const fieldKey = getFieldKey();
        // Apply translations to all language fields
        res.data.forEach(({ index: langIndex, translatedText }) => {
          form.setValue(`translations.${langIndex}.${fieldKey}`, translatedText);
        });
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormItem>
      <div className="flex items-center gap-2">
        <FormLabel>{rawLabel ? label : t(label)}</FormLabel>
        {isTranslated && (
          <CheckCircle size={14} className="text-green-600" />
        )}
      </div>
      <div className="relative">
        <FormControl>
          {isLoading ? <TextareaSkeleton /> : <Textarea {...field} />}
        </FormControl>

        {hasText(field.value) && !isLoading && (
          <div className="absolute right-0 -top-10">
            <FieldActionButtons
              onAutocorrection={() => handleAutocorrection(field.value ?? '')}
              onImproveText={() => handleImproveText(field.value ?? '')}
              onTranslate={() => handleTranslate(field.value ?? '')}
            />
          </div>
        )}
      </div>
      <FormMessage />
    </FormItem>
  );
};
