import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Track } from './types';

interface PreviewTabProps {
  currentTrack: Track | null;
}

const PreviewTab = ({ currentTrack }: PreviewTabProps) => {
  if (!currentTrack) {
    return (
      <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
        <div className="text-center py-12">
          <Icon name="Eye" size={64} className="mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">Выберите трек для предпросмотра</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-sm text-gray-400 mb-4">Предпросмотр релиза</h3>
          <div className="inline-block bg-gradient-to-br from-[#FF6B00] to-[#FF6B00]/60 p-1 rounded-2xl shadow-2xl">
            <img
              src={currentTrack.cover}
              alt={currentTrack.name}
              className="w-80 h-80 rounded-xl object-cover"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mt-6 mb-2">{currentTrack.name}</h2>
          <p className="text-gray-400">WAV Stereo · {currentTrack.duration}</p>
        </div>

        <div className="bg-[#0a0a0a] rounded-lg p-6 border border-[#EAEAEA]/10">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Параметры экспорта</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Обложка:</span>
              <span className="text-white">1500×1500px, JPG</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Аудио:</span>
              <span className="text-white">WAV Stereo, 44.1kHz</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Текст:</span>
              <span className="text-white">Моно-формат, UTF-8</span>
            </div>
          </div>
        </div>

        <Button className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white h-12 text-base font-medium">
          <Icon name="Download" size={20} className="mr-2" />
          Экспортировать релиз
        </Button>
      </div>
    </Card>
  );
};

export default PreviewTab;
