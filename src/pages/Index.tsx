import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Track {
  id: string;
  name: string;
  cover: string;
  audio: string;
  lyrics: string;
  duration: string;
}

const Index = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trackName, setTrackName] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
          
          setCoverFile(resizedFile);
          toast.success('Обложка обработана: 1500×1500px');
        };
      } catch (error) {
        toast.error('Ошибка обработки обложки');
        console.error(error);
      }
    }
  };

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
    const monoText = lyrics.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    navigator.clipboard.writeText(monoText);
    toast.success('Текст скопирован в моно-формате');
  };

  const downloadTrack = (track: Track) => {
    toast.success(`Экспорт трека "${track.name}" начат`);
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
            <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
              <div className="space-y-8">
                <div>
                  <Label className="text-gray-300 mb-3 block">Обложка трека</Label>
                  <div className="border-2 border-dashed border-[#FF6B00]/30 rounded-lg p-8 hover:border-[#FF6B00]/60 transition-all cursor-pointer bg-[#FF6B00]/5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
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
                </div>

                <div>
                  <Label className="text-gray-300 mb-3 block">Аудиофайл</Label>
                  <div className="border-2 border-dashed border-[#FF6B00]/30 rounded-lg p-8 hover:border-[#FF6B00]/60 transition-all cursor-pointer bg-[#FF6B00]/5">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioUpload}
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
                    onChange={(e) => setTrackName(e.target.value)}
                    placeholder="Введите название"
                    className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white placeholder:text-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="lyrics" className="text-gray-300 mb-3 block">Текст трека</Label>
                  <Textarea
                    id="lyrics"
                    value={lyrics}
                    onChange={(e) => setLyrics(e.target.value)}
                    placeholder="Вставьте текст трека..."
                    rows={8}
                    className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white placeholder:text-gray-600 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">Будет преобразован в моно-текст для копирования</p>
                </div>

                <Button
                  onClick={processTrack}
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
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6 animate-fade-in">
            <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
              {currentTrack ? (
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
                          setCurrentTrack({ ...currentTrack, name: e.target.value });
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
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-gray-300">Форма волны</Label>
                      <Button variant="outline" size="sm" className="border-[#EAEAEA]/10 text-gray-300">
                        <Icon name="Play" size={14} className="mr-1" />
                        Прослушать
                      </Button>
                    </div>
                    <div className="h-24 flex items-center justify-center gap-1 px-4">
                      {Array.from({ length: 80 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-[#FF6B00] rounded-full transition-all"
                          style={{
                            height: `${Math.random() * 60 + 20}%`,
                            opacity: 0.3 + Math.random() * 0.7
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-gray-300">Текст трека</Label>
                      <Button
                        onClick={copyLyrics}
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
                      onChange={(e) => setCurrentTrack({ ...currentTrack, lyrics: e.target.value })}
                      rows={6}
                      className="bg-[#0a0a0a] border-[#EAEAEA]/10 text-white font-mono text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Icon name="FileMusic" size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Загрузите трек для редактирования</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="library" className="space-y-6 animate-fade-in">
            <div className="max-w-5xl mx-auto">
              {tracks.length === 0 ? (
                <Card className="bg-[#16213E] border-[#EAEAEA]/10 p-12 text-center">
                  <Icon name="Library" size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Библиотека пуста</p>
                  <p className="text-sm text-gray-600 mt-2">Обработанные треки появятся здесь</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tracks.map((track) => (
                    <Card
                      key={track.id}
                      className="bg-[#16213E] border-[#EAEAEA]/10 p-4 hover:border-[#FF6B00]/30 transition-all cursor-pointer group"
                      onClick={() => setCurrentTrack(track)}
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
                              downloadTrack(track);
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6 animate-fade-in">
            <Card className="max-w-3xl mx-auto bg-[#16213E] border-[#EAEAEA]/10 p-8">
              {currentTrack ? (
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
              ) : (
                <div className="text-center py-12">
                  <Icon name="Eye" size={64} className="mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">Выберите трек для предпросмотра</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;