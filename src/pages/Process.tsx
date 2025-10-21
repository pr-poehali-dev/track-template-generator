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
  progress?: number;
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
      progress: 0,
    }));

    setFiles(processedFiles);
  }, [location.state, navigate]);

  const processFile = async (file: UploadedFile): Promise<ProcessedFile> => {
    const processedFile: ProcessedFile = {
      id: file.id,
      originalName: file.name,
      type: file.type,
      status: 'processing',
      progress: 0,
    };

    setFiles(prev => prev.map(f => f.id === file.id ? processedFile : f));

    try {
      const maxSizeMB = file.type === 'audio' ? 50 : 10;
      const fileSizeMB = file.file.size / (1024 * 1024);
      
      if (fileSizeMB > maxSizeMB) {
        throw new Error(`Файл слишком большой (${fileSizeMB.toFixed(1)} МБ). Максимум: ${maxSizeMB} МБ`);
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 10 } : f
      ));

      const arrayBuffer = await file.file.arrayBuffer();
      
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 30 } : f
      ));

      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      const base64 = btoa(binary);

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 50 } : f
      ));

      const url = file.type === 'audio' 
        ? 'https://functions.poehali.dev/75884e87-b899-4bd2-824d-3b7356d69d69'
        : 'https://functions.poehali.dev/e2626348-12c7-483d-8b73-dd5c187fb154';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: base64
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Неизвестная ошибка');
        if (response.status === 413) {
          throw new Error('Файл слишком большой для обработки');
        } else if (response.status === 400) {
          throw new Error('Неверный формат файла');
        } else {
          throw new Error(`Ошибка сервера (${response.status})`);
        }
      }

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, progress: 80 } : f
      ));

      const data = await response.json();

      if (file.type === 'audio') {
        const wavBlob = await fetch(`data:audio/wav;base64,${data.audio}`).then(r => r.blob());
        const wavFile = new File([wavBlob], file.name.replace(/\.[^/.]+$/, '.wav'), { type: 'audio/wav' });
        
        processedFile.status = 'completed';
        processedFile.processedUrl = URL.createObjectURL(wavFile);
        processedFile.processedFile = wavFile;
        processedFile.info = data;
        processedFile.progress = 100;
      } else {
        const imgBlob = await fetch(`data:image/jpeg;base64,${data.image}`).then(r => r.blob());
        const imgFile = new File([imgBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' });
        
        processedFile.status = 'completed';
        processedFile.processedUrl = URL.createObjectURL(imgFile);
        processedFile.processedFile = imgFile;
        processedFile.info = data;
        processedFile.progress = 100;
      }
    } catch (error) {
      processedFile.status = 'error';
      processedFile.error = error instanceof Error ? error.message : 'Ошибка обработки';
      console.error('Processing error:', error);
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
    const successCount = files.filter(f => f.status === 'completed').length;
    toast.success(`Обработано файлов: ${successCount}/${files.length}`);
  };

  const downloadFile = (file: ProcessedFile) => {
    if (!file.processedFile) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file.processedFile);
    link.download = file.processedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Скачан: ${file.processedFile.name}`);
  };

  const downloadAll = () => {
    const completed = files.filter(f => f.status === 'completed');
    completed.forEach(file => {
      setTimeout(() => downloadFile(file), 100);
    });
    toast.success(`Скачивается ${completed.length} файлов`);
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const progressPercent = files.length > 0 ? (completedCount / files.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#16213E]/10 to-[#0a0a0a]">
      <div className="border-b border-[#FF6B00]/10 bg-[#16213E]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="w-11 h-11 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center hover:bg-[#FF6B00]/20 transition-colors border border-[#FF6B00]/20"
            >
              <Icon name="ArrowLeft" size={22} className="text-[#FF6B00]" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B00] to-[#FF8C00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF6B00]/20">
              <Icon name="Cpu" size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">ОБРАБОТКА</h1>
              <p className="text-xs text-gray-400">Конвертация в профессиональные форматы</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {!isProcessing && files.every(f => f.status === 'pending') && (
            <div className="text-center mb-10">
              <Button
                onClick={startProcessing}
                className="bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF6B00] text-white font-bold px-12 py-7 rounded-xl text-lg shadow-lg shadow-[#FF6B00]/30"
              >
                <Icon name="Play" size={22} className="mr-3" />
                Начать обработку {files.length} файлов
              </Button>
            </div>
          )}

          {(isProcessing || files.some(f => f.status !== 'pending')) && (
            <div className="bg-[#16213E]/40 backdrop-blur-sm rounded-2xl border border-[#FF6B00]/20 p-8 mb-10 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-bold text-lg">
                  Прогресс: {completedCount} / {files.length}
                </h3>
                <span className="text-[#FF6B00] font-bold text-xl font-mono">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3 bg-[#0a0a0a]/60" />
            </div>
          )}

          <div className="space-y-5 mb-10">
            {files.map(file => (
              <div
                key={file.id}
                className="bg-[#16213E]/40 backdrop-blur-sm rounded-2xl border border-[#FF6B00]/20 p-6 shadow-lg hover:border-[#FF6B00]/40 transition-all"
              >
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B00]/20 to-[#FF6B00]/5 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#FF6B00]/20">
                    <Icon
                      name={file.type === 'audio' ? 'Music' : 'Image'}
                      size={32}
                      className="text-[#FF6B00]"
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold text-lg mb-2">{file.originalName}</h4>
                    
                    {file.status === 'pending' && (
                      <p className="text-gray-400">Ожидает обработки...</p>
                    )}
                    
                    {file.status === 'processing' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="animate-spin">
                            <Icon name="Loader2" size={20} className="text-[#FF6B00]" />
                          </div>
                          <p className="text-[#FF6B00] font-semibold">
                            Обработка: {file.progress}%
                          </p>
                        </div>
                        {file.progress !== undefined && (
                          <Progress value={file.progress} className="h-2 bg-[#0a0a0a]/60" />
                        )}
                      </div>
                    )}
                    
                    {file.status === 'completed' && file.info && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Icon name="CheckCircle2" size={18} className="text-green-400" />
                          <p className="text-green-400 font-semibold">Готово!</p>
                        </div>
                        
                        {file.type === 'audio' ? (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-300 space-y-1 bg-[#0a0a0a]/40 rounded-lg p-3 border border-[#FF6B00]/10">
                              <p><span className="text-[#FF6B00]">Формат:</span> WAV Stereo | <span className="text-[#FF6B00]">Частота:</span> 44.1kHz | <span className="text-[#FF6B00]">Разрядность:</span> 16-bit</p>
                              <p><span className="text-[#FF6B00]">Длительность:</span> {file.info.duration} | <span className="text-[#FF6B00]">Размер:</span> {file.info.fileSizeMB} MB</p>
                            </div>
                            {file.processedUrl && (
                              <div className="bg-[#0a0a0a]/60 rounded-xl p-4 border border-[#FF6B00]/20">
                                <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                                  <Icon name="Volume2" size={14} />
                                  Предпросмотр:
                                </p>
                                <audio
                                  controls
                                  src={file.processedUrl}
                                  className="w-full h-10"
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="text-sm text-gray-300 bg-[#0a0a0a]/40 rounded-lg p-3 border border-[#FF6B00]/10">
                              <p><span className="text-[#FF6B00]">Формат:</span> JPEG | <span className="text-[#FF6B00]">Размер:</span> 1500×1500px | <span className="text-[#FF6B00]">Качество:</span> 95% | {file.info.fileSizeKB} KB</p>
                            </div>
                            {file.processedUrl && (
                              <img
                                src={file.processedUrl}
                                alt="Preview"
                                className="w-48 h-48 object-cover rounded-xl border-2 border-[#FF6B00]/30 shadow-lg"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-400 bg-red-500/10 rounded-lg p-3">
                        <Icon name="AlertCircle" size={18} />
                        <p className="font-medium">Ошибка: {file.error}</p>
                      </div>
                    )}
                  </div>
                  
                  {file.status === 'completed' && (
                    <Button
                      onClick={() => downloadFile(file)}
                      className="bg-[#FF6B00]/10 border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white font-semibold px-5 py-6 rounded-xl transition-all"
                    >
                      <Icon name="Download" size={18} className="mr-2" />
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
              className="w-full bg-gradient-to-r from-[#FF6B00] to-[#FF8C00] hover:from-[#FF8C00] hover:to-[#FF6B00] text-white font-bold py-7 rounded-xl text-lg shadow-lg shadow-[#FF6B00]/30"
            >
              <Icon name="Download" size={22} className="mr-3" />
              Скачать все файлы ({completedCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Process;