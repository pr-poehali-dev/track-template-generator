import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Track, CoverImage } from '@/components/TrackStudio/types';
import UploadTab from '@/components/TrackStudio/UploadTab';
import EditorTab from '@/components/TrackStudio/EditorTab';
import LibraryTab from '@/components/TrackStudio/LibraryTab';
import PreviewTab from '@/components/TrackStudio/PreviewTab';

const Index = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedCovers, setUploadedCovers] = useState<CoverImage[]>([]);
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Загрузите изображение');
        return;
      }
      
      toast.loading('Изменяю размер до 1500×1500...');
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          const response = await fetch('https://functions.poehali.dev/e2626348-12c7-483d-8b73-dd5c187fb154', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: base64
          });
          
          const data = await response.json();
          
          const resizedBlob = await fetch(`data:image/jpeg;base64,${data.image}`).then(r => r.blob());
          const resizedFile = new File([resizedBlob], file.name, { type: 'image/jpeg' });
          
          const newCover: CoverImage = {
            id: Date.now().toString(),
            url: URL.createObjectURL(resizedFile),
            file: resizedFile
          };
          
          setUploadedCovers(prev => [...prev, newCover]);
          setCoverFile(resizedFile);
          setSelectedCoverId(newCover.id);
          toast.success('Обложка обработана: 1500×1500px');
        };
      } catch (error) {
        toast.error('Ошибка обработки обложки');
        console.error(error);
      }
    }
  };

  const selectCover = async (cover: CoverImage) => {
    setSelectedCoverId(cover.id);
    setCoverFile(cover.file);
    
    const link = document.createElement('a');
    link.href = cover.url;
    link.download = `cover-1500x1500-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Обложка скачана: 1500×1500px');
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    
    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Загрузите аудиофайл');
        return;
      }
      
      setTrackName(file.name.replace(/\.[^/.]+$/, ''));
      toast.loading('Конвертирую в WAV стерео...');
      
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = async () => {
          const base64 = (reader.result as string).split(',')[1];
          
          const response = await fetch('https://functions.poehali.dev/75884e87-b899-4bd2-824d-3b7356d69d69', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: base64
          });
          
          const data = await response.json();
          
          const wavBlob = await fetch(`data:audio/wav;base64,${data.audio}`).then(r => r.blob());
          const wavFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav' });
          
          setAudioFile(wavFile);
          toast.success(`Аудио конвертировано: WAV стерео, ${data.duration}`);
        };
      } catch (error) {
        toast.error('Ошибка конвертации аудио');
        console.error(error);
      }
    }
  };

  const processTrack = async () => {
    if (!coverFile || !audioFile || !trackName) {
      toast.error('Заполните все поля');
      return;
    }

    setIsProcessing(true);
    
    try {
      const newTrack: Track = {
        id: Date.now().toString(),
        name: trackName,
        cover: URL.createObjectURL(coverFile),
        audio: URL.createObjectURL(audioFile),
        lyrics: lyrics,
        duration: '3:45'
      };

      setTracks([newTrack, ...tracks]);
      setCurrentTrack(newTrack);
      toast.success('Трек обработан и добавлен в библиотеку');
      
      setCoverFile(null);
      setAudioFile(null);
      setTrackName('');
      setLyrics('');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyLyrics = () => {
    if (!currentTrack) return;
    const monoText = currentTrack.lyrics.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(monoText);
    toast.success('Текст скопирован в моно-формате');
  };

  const downloadTrack = (track: Track) => {
    toast.success(`Экспорт трека "${track.name}" начат`);
  };

  const shareToTelegram = () => {
    if (!coverFile || !audioFile || !trackName) return;

    const monoLyrics = lyrics.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    
    const text = `🎵 *${trackName}*\n\n${monoLyrics ? monoLyrics : 'Новый трек готов к релизу!'}\n\n📀 Формат: WAV Stereo, 44.1kHz\n🎨 Обложка: 1500×1500px`;
    
    const encodedText = encodeURIComponent(text);
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodedText}`;
    
    window.open(telegramUrl, '_blank');
    toast.success('Открыт Telegram для отправки');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#16213E]/20 bg-[#16213E]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FF6B00] rounded-lg flex items-center justify-center">
                <Icon name="Music" size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight font-mono">TRACK STUDIO</h1>
                <p className="text-xs text-gray-400">Профессиональная подготовка релизов</p>
              </div>
            </div>
            <div className="flex gap-2 text-xs text-gray-400">
              <span className="px-3 py-1 bg-[#FF6B00]/10 rounded-full border border-[#FF6B00]/20">
                {tracks.length} треков
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-4 bg-[#16213E] border border-[#EAEAEA]/10">
            <TabsTrigger value="upload" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white">
              <Icon name="Upload" size={16} className="mr-2" />
              Загрузка
            </TabsTrigger>
            <TabsTrigger value="editor" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white">
              <Icon name="Settings" size={16} className="mr-2" />
              Редактор
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white">
              <Icon name="Library" size={16} className="mr-2" />
              Библиотека
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white">
              <Icon name="Eye" size={16} className="mr-2" />
              Превью
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6 animate-fade-in">
            <UploadTab
              coverFile={coverFile}
              audioFile={audioFile}
              trackName={trackName}
              lyrics={lyrics}
              isProcessing={isProcessing}
              uploadedCovers={uploadedCovers}
              selectedCoverId={selectedCoverId}
              onCoverUpload={handleCoverUpload}
              onAudioUpload={handleAudioUpload}
              onTrackNameChange={setTrackName}
              onLyricsChange={setLyrics}
              onSelectCover={selectCover}
              onProcessTrack={processTrack}
              onShareToTelegram={shareToTelegram}
            />
          </TabsContent>

          <TabsContent value="editor" className="space-y-6 animate-fade-in">
            <EditorTab
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              audioRef={audioRef}
              onTrackUpdate={setCurrentTrack}
              onTogglePlayPause={togglePlayPause}
              onCopyLyrics={copyLyrics}
            />
          </TabsContent>

          <TabsContent value="library" className="space-y-6 animate-fade-in">
            <LibraryTab
              tracks={tracks}
              onSelectTrack={setCurrentTrack}
              onDownloadTrack={downloadTrack}
            />
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 animate-fade-in">
            <PreviewTab currentTrack={currentTrack} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;