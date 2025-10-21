import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Track } from './types';

interface LibraryTabProps {
  tracks: Track[];
  onSelectTrack: (track: Track) => void;
  onDownloadTrack: (track: Track) => void;
}

const LibraryTab = ({ tracks, onSelectTrack, onDownloadTrack }: LibraryTabProps) => {
  if (tracks.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <Card className="bg-[#16213E] border-[#EAEAEA]/10 p-12 text-center">
          <Icon name="Library" size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Библиотека пуста</p>
          <p className="text-sm text-gray-600 mt-2">Обработанные треки появятся здесь</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tracks.map((track) => (
          <Card
            key={track.id}
            className="bg-[#16213E] border-[#EAEAEA]/10 p-4 hover:border-[#FF6B00]/30 transition-all cursor-pointer group"
            onClick={() => onSelectTrack(track)}
          >
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={track.cover}
                  alt={track.name}
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="absolute inset-0 bg-[#FF6B00]/0 group-hover:bg-[#FF6B00]/20 rounded-lg transition-all flex items-center justify-center">
                  <Icon name="Play" size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-white truncate mb-1">{track.name}</h3>
                <p className="text-sm text-gray-400 mb-3">{track.duration}</p>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadTrack(track);
                  }}
                  size="sm"
                  className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white"
                >
                  <Icon name="Download" size={14} className="mr-1" />
                  Экспорт
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LibraryTab;
