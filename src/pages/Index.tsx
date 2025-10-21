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
    toast.success(`Загружено файлов: ${newFiles.length}`);
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
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Загрузите файлы</h2>
            <p className="text-gray-400">Добавьте аудио и изображения для обработки</p>
          </div>

          <div className="bg-[#16213E] rounded-2xl border border-[#FF6B00]/20 p-8 mb-8">
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="audio/*,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="border-2 border-dashed border-[#FF6B00]/30 rounded-xl p-12 hover:border-[#FF6B00]/50 transition-colors">
                <div className="text-center">
                  <Icon name="Upload" size={48} className="text-[#FF6B00] mx-auto mb-4" />
                  <p className="text-white font-semibold mb-2">Нажмите для выбора файлов</p>
                  <p className="text-sm text-gray-400">Аудио и изображения любых форматов</p>
                </div>
              </div>
            </label>
          </div>

          {uploadedFiles.length > 0 && (
            <>
              <div className="bg-[#16213E] rounded-2xl border border-[#FF6B00]/20 p-6 mb-8">
                <h3 className="text-white font-semibold mb-4">
                  Загружено файлов: {uploadedFiles.length}
                </h3>
                <div className="space-y-3">
                  {uploadedFiles.map(file => (
                    <div
                      key={file.id}
                      className="flex items-center gap-4 bg-[#0a0a0a] rounded-lg p-4"
                    >
                      {file.type === 'image' && file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-[#FF6B00]/10 rounded flex items-center justify-center">
                          <Icon
                            name={file.type === 'audio' ? 'Music' : 'Image'}
                            size={24}
                            className="text-[#FF6B00]"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{file.name}</p>
                        <p className="text-gray-400 text-xs">
                          {file.type === 'audio' ? 'Аудиофайл' : 'Изображение'}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Icon name="X" size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={startProcessing}
                className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-semibold py-6 rounded-xl"
              >
                <Icon name="ArrowRight" size={20} className="mr-2" />
                Перейти к обработке
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
