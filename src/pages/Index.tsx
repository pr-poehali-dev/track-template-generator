import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface UploadedFile {
  id: string;
  name: string;
  type: 'audio' | 'image';
  file: File;
  preview?: string;
}

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');

      if (!isImage && !isAudio) {
        toast.error(`${file.name} - неподдерживаемый формат`);
        continue;
      }

      const uploadedFile: UploadedFile = {
        id: Date.now().toString() + i,
        name: file.name,
        type: isImage ? 'image' : 'audio',
        file: file,
      };

      if (isImage) {
        uploadedFile.preview = URL.createObjectURL(file);
      }

      newFiles.push(uploadedFile);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    toast.success(`Загружено: ${newFiles.length} файлов`);
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
    toast.success('Файл удален');
  };

  const startProcessing = () => {
    if (uploadedFiles.length === 0) {
      toast.error('Загрузите хотя бы один файл');
      return;
    }
    navigate('/process', { state: { files: uploadedFiles } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#16213E]/10 to-[#0a0a0a]">
      <div className="border-b border-[#FF6B00]/10 bg-[#16213E]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Icon name="Music" size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">TRACK STUDIO</h1>
              <p className="text-xs text-gray-400">Профессиональная подготовка релизов</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Загрузите файлы</h2>
            <p className="text-gray-400 text-lg">Аудио → WAV Stereo 44.1kHz | Изображения → JPEG 1500×1500px</p>
          </div>

          <div className="bg-[#16213E]/40 backdrop-blur-sm rounded-2xl border border-[#FF6B00]/20 p-10 mb-10 shadow-2xl">
            <label className="cursor-pointer block">
              <input
                type="file"
                multiple
                accept="audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-[#FF6B00]/40 rounded-2xl p-16 hover:border-[#FF6B00] hover:bg-[#FF6B00]/5 transition-all duration-300">
                <div className="text-center">
                  <div className="w-20 h-20 bg-[#FF6B00]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icon name="Upload" size={40} className="text-[#FF6B00]" />
                  </div>
                  <p className="text-white font-semibold text-lg mb-2">Нажмите для выбора файлов</p>
                  <p className="text-sm text-gray-400">MP3, WAV, FLAC, PNG, JPG и другие форматы</p>
                </div>
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <>
              <div className="bg-[#16213E]/40 backdrop-blur-sm rounded-2xl border border-[#FF6B00]/20 p-8 mb-8 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold text-lg">
                    Файлов загружено: {uploadedFiles.length}
                  </h3>
                  <Button
                    onClick={() => setUploadedFiles([])}
                    variant="ghost"
                    className="text-gray-400 hover:text-white"
                  >
                    <Icon name="Trash2" size={18} className="mr-2" />
                    Очистить все
                  </Button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 bg-[#0a0a0a]/60 rounded-xl p-4 border border-[#FF6B00]/10 hover:border-[#FF6B00]/30 transition-colors"
                    >
                      {file.type === 'image' && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-14 h-14 object-cover rounded-lg border border-[#FF6B00]/20"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 rounded-lg flex items-center justify-center">
                          <Icon
                            name={file.type === 'audio' ? 'Music' : 'Image'}
                            size={28}
                            className="text-[#FF6B00]"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{file.name}</p>
                        <p className="text-gray-400 text-sm">
                          {file.type === 'audio' ? '🎵 Аудио' : '🖼️ Изображение'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                      >
                        <Icon name="X" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={startProcessing}
                className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF6B00] text-white font-bold py-7 rounded-xl text-lg shadow-lg shadow-[#FF6B00]/30 hover:shadow-[#FF6B00]/50 transition-all"
              >
                <Icon name="Zap" size={22} className="mr-3" />
                Начать обработку {uploadedFiles.length} файлов
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
