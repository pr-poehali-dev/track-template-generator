import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { CoverImage } from './types';

interface UploadTabProps {
  coverFile: File | null;
  audioFile: File | null;
  trackName: string;
  lyrics: string;
  isProcessing: boolean;
  uploadedCovers: CoverImage[];
  selectedCoverId: string | null;
  onCoverUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTrackNameChange: (value: string) => void;
  onLyricsChange: (value: string) => void;
  onSelectCover: (cover: CoverImage) => void;
  onProcessTrack: () => void;
  onShareToTelegram: () => void;
}

const UploadTab = ({
  coverFile,
  audioFile,
  trackName,
  lyrics,
  isProcessing,
  uploadedCovers,
  selectedCoverId,
  onCoverUpload,
  onAudioUpload,
  onTrackNameChange,
  onLyricsChange,
  onSelectCover,
  onProcessTrack,
  onShareToTelegram,
}: UploadTabProps) => {
  const isFormComplete = coverFile && audioFile && trackName;
  return (
    <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
      <div className="space-y-8">
        <div>
          <Label className="text-gray-300 mb-3 block">Обложка трека</Label>
          <div className="border-2 border-dashed border-[#FF6B00]/30 rounded-lg p-8 hover:border-[#FF6B00]/60 transition-all cursor-pointer bg-[#FF6B00]/5">
            <input
              type="file"
              accept="image/*"
              onChange={onCoverUpload}
              className="hidden"
              id="cover-upload"
            />
            <label htmlFor="cover-upload" className="cursor-pointer block text-center">
              <Icon name="Image" size={48} className="mx-auto mb-3 text-[#FF6B00]" />
              <p className="text-sm text-gray-300 mb-1">
                {coverFile ? coverFile.name : 'Загрузить обложку'}
              </p>
              <p className="text-xs text-gray-500">Автоматически изменится до 1500×1500px</p>
            </label>
          </div>
          
          {uploadedCovers.length > 0 && (
            <div className="mt-4">
              <Label className="text-gray-300 mb-3 block text-sm">Загруженные обложки (клик = скачать)</Label>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {uploadedCovers.map((cover) => (
                  <div
                    key={cover.id}
                    onClick={() => onSelectCover(cover)}
                    className={`flex-shrink-0 w-24 h-24 rounded-lg cursor-pointer transition-all hover:scale-105 ${
                      selectedCoverId === cover.id
                        ? 'ring-2 ring-[#FF6B00] ring-offset-2 ring-offset-[#16213E]'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={cover.url}
                      alt="Cover"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <Label className="text-gray-300 mb-3 block">Аудиофайл</Label>
          <div className="border-2 border-dashed border-[#FF6B00]/30 rounded-lg p-8 hover:border-[#FF6B00]/60 transition-all cursor-pointer bg-[#FF6B00]/5">
            <input
              type="file"
              accept="audio/*"
              onChange={onAudioUpload}
              className="hidden"
              id="audio-upload"
            />
            <label htmlFor="audio-upload" className="cursor-pointer block text-center">
              <Icon name="Music" size={48} className="mx-auto mb-3 text-[#FF6B00]" />
              <p className="text-sm text-gray-300 mb-1">
                {audioFile ? audioFile.name : 'Загрузить аудио'}
              </p>
              <p className="text-xs text-gray-500">Конвертируется в WAV стерео</p>
            </label>
          </div>
        </div>

        <div>
          <Label htmlFor="track-name" className="text-gray-300 mb-3 block">Название трека</Label>
          <Input
            id="track-name"
            value={trackName}
            onChange={(e) => onTrackNameChange(e.target.value)}
            placeholder="Введите название"
            className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white placeholder:text-gray-600"
          />
        </div>

        <div>
          <Label htmlFor="lyrics" className="text-gray-300 mb-3 block">Текст трека</Label>
          <Textarea
            id="lyrics"
            value={lyrics}
            onChange={(e) => onLyricsChange(e.target.value)}
            placeholder="Вставьте текст трека..."
            rows={8}
            className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white placeholder:text-gray-600 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-2">Будет преобразован в моно-текст для копирования</p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={onProcessTrack}
            disabled={isProcessing || !coverFile || !audioFile || !trackName}
            className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 text-base font-medium disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <Icon name="Check" size={20} className="mr-2" />
                Обработать трек
              </>
            )}
          </Button>

          {isFormComplete && (
            <Button
              onClick={onShareToTelegram}
              variant="outline"
              className="w-full border-[#0088cc] text-[#0088cc] hover:bg-[#0088cc]/10 h-12 text-base font-medium"
            >
              <Icon name="Send" size={20} className="mr-2" />
              Поделиться в Telegram
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UploadTab;