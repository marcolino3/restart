'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Language, VoiceGender } from '@/gql/graphql';
import { generateContentAudioAction } from '@/actions/audio/generate-content-audio.action';
import { deleteContentAudioAction } from '@/actions/audio/delete-content-audio.action';
import { Loader2, Volume2, Trash2, Play, Pause, RotateCcw, RotateCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Backend URL for audio files (served from backend static folder)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_PUBLIC_URL || 'http://localhost:3001';

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface Props {
  contentTranslationId: string;
  language: Language;
  text: string;
  currentAudioUrl?: string | null;
  currentVoiceGender?: VoiceGender | null;
  onAudioGenerated: (url: string) => void;
  onAudioDeleted: () => void;
  onVoiceGenderChange?: (voiceGender: VoiceGender) => void;
}

export const AudioGeneratorField = ({
  contentTranslationId,
  language,
  text,
  currentAudioUrl,
  currentVoiceGender,
  onAudioGenerated,
  onAudioDeleted,
  onVoiceGenderChange,
}: Props) => {
  const t = useTranslations('Common');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(
    currentVoiceGender ?? VoiceGender.Male
  );
  const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
  const audioRef = useRef<HTMLAudioElement>(null);

  // Check if we have a valid audio URL (not empty string)
  const hasAudioUrl = Boolean(currentAudioUrl && currentAudioUrl.trim().length > 0);

  // Construct full audio URL with backend host and cache-busting parameter
  const fullAudioUrl = useMemo((): string | undefined => {
    if (!hasAudioUrl || !currentAudioUrl) return undefined;

    // If URL already has a host, use as-is; otherwise prepend backend URL
    let url: string;
    if (currentAudioUrl.startsWith('http://') || currentAudioUrl.startsWith('https://')) {
      url = currentAudioUrl;
    } else {
      url = `${BACKEND_URL}${currentAudioUrl}`;
    }

    // Add cache-busting query parameter to force browser to fetch fresh audio
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${cacheBuster}`;
  }, [currentAudioUrl, hasAudioUrl, cacheBuster]);

  // Reset playing state when URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);

    // Only set loading if we actually have an audio URL
    if (fullAudioUrl) {
      setIsLoading(true);

      // Timeout: if audio doesn't load within 5 seconds, stop loading
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setIsLoading(false);
    }
  }, [fullAudioUrl]);

  // Sync voiceGender with prop when it changes
  useEffect(() => {
    if (currentVoiceGender) {
      setVoiceGender(currentVoiceGender);
    }
  }, [currentVoiceGender]);

  const handleVoiceGenderChange = (value: VoiceGender) => {
    setVoiceGender(value);
    onVoiceGenderChange?.(value);
  };

  const handleGenerate = async () => {
    if (!text || text.trim().length === 0) {
      setError(t('noTextForAudio'));
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateContentAudioAction(
        text,
        language,
        contentTranslationId,
        voiceGender,
      );

      if (result.success && result.audioUrl) {
        // Bust cache so browser fetches the newly generated audio
        setCacheBuster(Date.now());
        onAudioGenerated(result.audioUrl);
        onVoiceGenderChange?.(voiceGender);
      } else {
        setError(result.error || t('audioGenerationFailed'));
      }
    } catch (err) {
      setError(t('audioGenerationFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Audio konnte nicht abgespielt werden');
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleAudioCanPlay = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleAudioError = () => {
    setIsLoading(false);
    setError('Audio konnte nicht geladen werden');
    console.error('Audio load error for URL:', fullAudioUrl);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(
      0,
      Math.min(duration || audioRef.current.duration || 0, currentTime + seconds)
    );
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDelete = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsDeleting(true);
    setError(null);

    try {
      // Delete the actual file from storage
      if (currentAudioUrl) {
        const result = await deleteContentAudioAction(currentAudioUrl);
        if (!result.success) {
          console.warn('Failed to delete audio file:', result.error);
          // Continue anyway - the file might already be deleted
        }
      }
      onAudioDeleted();
    } catch (err) {
      console.error('Error deleting audio:', err);
      setError(t('audioDeleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2">
        <Volume2 className="h-5 w-5 text-gray-600" />
        <span className="font-medium text-sm">{t('audio')}</span>
        {hasAudioUrl && (
          <Badge
            className={`ml-2 ${
              !currentVoiceGender
                ? 'bg-gray-400 hover:bg-gray-500 text-white'
                : currentVoiceGender === VoiceGender.Male
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-pink-500 hover:bg-pink-600 text-white'
            }`}
          >
            {!currentVoiceGender
              ? t('unknown')
              : currentVoiceGender === VoiceGender.Male
                ? t('male')
                : t('female')}
          </Badge>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      {/* Voice Gender Selection */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{t('voiceGender')}:</span>
        <Select
          value={voiceGender}
          onValueChange={(value) => handleVoiceGenderChange(value as VoiceGender)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={VoiceGender.Male}>{t('male')}</SelectItem>
            <SelectItem value={VoiceGender.Female}>{t('female')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {hasAudioUrl ? (
        <div className="flex flex-col gap-3">
          <audio
            ref={audioRef}
            src={fullAudioUrl}
            onEnded={handleAudioEnded}
            onCanPlay={handleAudioCanPlay}
            onError={handleAudioError}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
          />

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 min-w-[36px] font-mono">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
                trackClassName="bg-gray-200"
                rangeClassName="bg-gray-800"
                thumbClassName="bg-gray-800 border-white"
              />
            </div>
            <span className="text-xs text-gray-500 min-w-[36px] font-mono">
              {formatTime(duration)}
            </span>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => skip(-10)}
              className="h-8 px-2 gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="text-xs">10s</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePlayPause}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {isLoading ? t('loading') : isPlaying ? t('pause') : t('play')}
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => skip(10)}
              className="h-8 px-2 gap-1"
            >
              <span className="text-xs">10s</span>
              <RotateCw className="h-3.5 w-3.5" />
            </Button>

          </div>

          {/* Actions: Regenerate + Delete */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              {t('regenerateAudio')}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeleting ? t('deleting') : t('delete')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAudioTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteAudioDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>{t('delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={handleGenerate}
          disabled={isGenerating || !text}
          className="w-fit flex items-center gap-2"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          {isGenerating ? t('generatingAudio') : t('generateAudio')}
        </Button>
      )}
    </div>
  );
};
