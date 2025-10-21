import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadedFile {
  id: string;
  name: string;
  type: 'audio' | 'image';
  file: File;
  preview?: string;
}

interface ProcessedFile {
  id: string;
  originalName: string;
  type: 'audio' | 'image';
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedUrl?: string;
  processedFile?: File;
  info?: any;
  error?: string;
  uploadProgress?: number;
  processingProgress?: number;
}

const Process = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const uploadedFiles = location.state?.files as UploadedFile[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      navigate('/');
      return;
    }

    const processedFiles: ProcessedFile[] = uploadedFiles.map(f => ({
      id: f.id,
      originalName: f.name,
      type: f.type,
      status: 'pending',
    }));

    setFiles(processedFiles);
  }, [location.state, navigate]);

  const processFile = async (file: UploadedFile): Promise<ProcessedFile> => {
    const processedFile: ProcessedFile = {
      id: file.id,
      originalName: file.name,
      type: file.type,
      status: 'processing',
      uploadProgress: 0,
      processingProgress: 0,
    };

    setFiles(prev => prev.map(f => f.id === file.id ? processedFile : f));

    try {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, uploadProgress: 20 } : f
      ));

      if (file.type === 'audio') {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 40 } : f
        ));
        
        const arrayBuffer = await file.file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 60 } : f
        ));
        
        const response = await fetch('https://functions.poehali.dev/75884e87-b899-4bd2-824d-3b7356d69d69', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: base64
        });

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 80 } : f
        ));
        
        const data = await response.json();
        const wavBlob = await fetch(`data:audio/wav;base64,${data.audio}`).then(r => r.blob());
        const wavFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav' });
        
        processedFile.status = 'completed';
        processedFile.processedUrl = URL.createObjectURL(wavFile);
        processedFile.processedFile = wavFile;
        processedFile.info = data;
      } else {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 40 } : f
        ));
        
        const arrayBuffer = await file.file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 60 } : f
        ));
        
        const response = await fetch('https://functions.poehali.dev/e2626348-12c7-483d-8b73-dd5c187fb154', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: base64
        });

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, processingProgress: 80 } : f
        ));
        
        const data = await response.json();
        const imgBlob = await fetch(`data:image/jpeg;base64,${data.image}`).then(r => r.blob());
        const imgFile = new File([imgBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
        
        processedFile.status = 'completed';
        processedFile.processedUrl = URL.createObjectURL(imgFile);
        processedFile.processedFile = imgFile;
        processedFile.info = data;
      }
    } catch (error) {
      processedFile.status = 'error';
      processedFile.error = error instanceof Error ? error.message : 'Ошибка обработки';
    }

    return processedFile;
  };

  const startProcessing = async () => {
    const uploadedFiles = location.state?.files as UploadedFile[];
    if (!uploadedFiles) return;

    setIsProcessing(true);

    for (const file of uploadedFiles) {
      const processed = await processFile(file);
      setFiles(prev => prev.map(f => f.id === processed.id ? processed : f));
    }

    setIsProcessing(false);
    toast.success('Все файлы обработаны!');
  };

  const downloadFile = (file: ProcessedFile) => {
    if (!file.processedFile) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.processedFile);
    link.download = file.processedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Файл скачан: ${file.processedFile.name}`);
  };

  const downloadAll = () => {
    files.filter(f => f.status === 'completed').forEach(file => {
      downloadFile(file);
    });
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const progressPercent = files.length > 0 ? (completedCount / files.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#16213E]/20 bg-[#16213E]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="w-10 h-10 bg-[#FF6B00]/10 rounded-lg flex items-center justify-center hover:bg-[#FF6B00]/20 transition-colors"
              >
                <Icon name="ArrowLeft" size={24} className="text-[#FF6B00]" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight font-mono">ОБРАБОТКА ФАЙЛОВ</h1>
                <p className="text-xs text-gray-400">Конвертация в профессиональные форматы</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {!isProcessing && files.every(f => f.status === 'pending') && (
            <div className="text-center mb-8">
              <Button
                onClick={startProcessing}
                className="bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-semibold px-8 py-6 rounded-xl"
              >
                <Icon name="Play" size={20} className="mr-2" />
                Начать обработку {files.length} файлов
              </Button>
            </div>
          )}

          {(isProcessing || files.some(f => f.status !== 'pending')) && (
            <div className="bg-[#16213E] rounded-2xl border border-[#FF6B00]/20 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">
                  Прогресс: {completedCount} / {files.length}
                </h3>
                <span className="text-[#FF6B00] font-mono">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          <div className="space-y-4 mb-8">
            {files.map(file => (
              <div
                key={file.id}
                className="bg-[#16213E] rounded-xl border border-[#FF6B00]/20 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#FF6B00]/10 rounded flex items-center justify-center flex-shrink-0">
                    <Icon
                      name={file.type === 'audio' ? 'Music' : 'Image'}
                      size={24}
                      className="text-[#FF6B00]"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium mb-1">{file.originalName}</h4>
                    
                    {file.status === 'pending' && (
                      <p className="text-gray-400 text-sm">Ожидает обработки...</p>
                    )}
                    
                    {file.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin">
                            <Icon name="Loader2" size={16} className="text-[#FF6B00]" />
                          </div>
                          <p className="text-[#FF6B00] text-sm font-medium">
                            {file.uploadProgress !== undefined && file.uploadProgress < 100
                              ? `Загрузка: ${file.uploadProgress}%`
                              : file.processingProgress !== undefined
                              ? `Обработка: ${file.processingProgress}%`
                              : 'Обрабатывается...'}
                          </p>
                        </div>
                        {file.processingProgress !== undefined && (
                          <Progress value={file.processingProgress} className="h-1.5" />
                        )}
                      </div>
                    )}
                    
                    {file.status === 'completed' && file.info && (
                      <div className="space-y-1">
                        <p className="text-green-400 text-sm">✅ Готово!</p>
                        {file.type === 'audio' ? (
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Формат: WAV Stereo | Частота: 44.1kHz | 16-bit</p>
                            <p>Длительность: {file.info.duration} | Размер: {file.info.fileSizeMB} MB</p>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 space-y-1">
                            <p>Формат: JPEG | Размер: 1500×1500px</p>
                            <p>Качество: 95% | {file.info.fileSizeKB} KB</p>
                          </div>
                        )}
                        {file.processedUrl && file.type === 'image' && (
                          <img
                            src={file.processedUrl}
                            alt="Preview"
                            className="w-32 h-32 object-cover rounded-lg mt-2"
                          />
                        )}
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <p className="text-red-400 text-sm">❌ Ошибка: {file.error}</p>
                    )}
                  </div>
                  
                  {file.status === 'completed' && (
                    <Button
                      onClick={() => downloadFile(file)}
                      variant="outline"
                      className="border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00]/10"
                    >
                      <Icon name="Download" size={16} className="mr-2" />
                      Скачать
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {files.some(f => f.status === 'completed') && (
            <Button
              onClick={downloadAll}
              className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-semibold py-6 rounded-xl"
            >
              <Icon name="Download" size={20} className="mr-2" />
              Скачать все файлы ({completedCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Process;