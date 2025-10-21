import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { Track } from './types';

interface EditorTabProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audioRef: React.RefObject<HTMLAudioElement>;
  onTrackUpdate: (track: Track) => void;
  onTogglePlayPause: () => void;
  onCopyLyrics: () => void;
}

const EditorTab = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  audioRef,
  onTrackUpdate,
  onTogglePlayPause,
  onCopyLyrics,
}: EditorTabProps) => {
  if (!currentTrack) {
    return (
      <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
        <div className="text-center py-12">
          <Icon name="FileMusic" size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Загрузите трек для редактирования</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
      <div className="space-y-6">
        <div className="flex items-start gap-6">
          <img
            src={currentTrack.cover}
            alt={currentTrack.name}
            className="w-32 h-32 rounded-lg object-cover border-2 border-[#FF6B00]/30"
          />
          <div className="flex-1">
            <Input
              value={currentTrack.name}
              className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white text-lg font-medium mb-3"
              onChange={(e) => {
                onTrackUpdate({ ...currentTrack, name: e.target.value });
              }}
            />
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Icon name="Clock" size={14} />
                {currentTrack.duration}
              </span>
              <span className="flex items-center gap-1">
                <Icon name="Music" size={14} />
                WAV Stereo
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#0a0a0a] rounded-lg p-6 border border-[#EAEAEA]/10">
          <audio ref={audioRef} src={currentTrack.audio} className="hidden" />
          
          <div className="flex items-center justify-between mb-4">
            <Label className="text-gray-300">Аудио плеер</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </span>
              <Button 
                onClick={onTogglePlayPause}
                variant="outline" 
                size="sm" 
                className="border-[#EAEAEA]/10 text-gray-300"
              >
                <Icon name={isPlaying ? "Pause" : "Play"} size={14} className="mr-1" />
                {isPlaying ? 'Пауза' : 'Играть'}
              </Button>
            </div>
          </div>
          
          <div className="h-24 flex items-center justify-center gap-1 px-4 relative">
            {Array.from({ length: 80 }).map((_, i) => {
              const progress = duration > 0 ? currentTime / duration : 0;
              const barProgress = i / 80;
              const isActive = barProgress <= progress;
              
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${
                    isActive ? 'bg-[#FF6B00]' : 'bg-[#FF6B00]/30'
                  }`}
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    opacity: isActive ? 0.8 + Math.random() * 0.2 : 0.3 + Math.random() * 0.3
                  }}
                />
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-gray-300">Текст трека</Label>
            <Button
              onClick={onCopyLyrics}
              variant="outline"
              size="sm"
              className="border-[#EAEAEA]/10 text-gray-300"
            >
              <Icon name="Copy" size={14} className="mr-1" />
              Скопировать моно-текст
            </Button>
          </div>
          <Textarea
            value={currentTrack.lyrics}
            onChange={(e) => onTrackUpdate({ ...currentTrack, lyrics: e.target.value })}
            rows={6}
            className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white font-mono text-sm"
          />
        </div>
      </div>
    </Card>
  );
};

export default EditorTab;
