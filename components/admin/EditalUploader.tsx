import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle, Link as LinkIcon } from 'lucide-react';

interface EditalUploaderProps {
  onFileSelect: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string;
  disabled?: boolean;
}

export const EditalUploader: React.FC<EditalUploaderProps> = ({
  onFileSelect,
  onUrlSubmit,
  isUploading = false,
  uploadProgress = 0,
  error,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setInputMode('file');
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setInputMode('file');
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      setInputMode('url');
      setSelectedFile(null);
      onUrlSubmit(urlInput.trim());
    }
  }, [urlInput, onUrlSubmit]);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          Upload do Edital (PDF)
        </label>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !selectedFile && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-sm p-8 text-center transition-all
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${isDragOver ? 'border-brand-yellow bg-brand-yellow/10' : 'border-white/10 hover:border-brand-yellow/50'}
            ${selectedFile ? 'border-green-500/50 bg-green-500/5' : ''}
            ${error ? 'border-red-500/50 bg-red-500/5' : ''}
            bg-brand-dark/30
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />

          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 text-brand-yellow mx-auto animate-spin" />
              <div>
                <p className="text-white font-medium">Enviando arquivo...</p>
                <p className="text-gray-500 text-sm mt-1">{uploadProgress}%</p>
              </div>
              <div className="w-full bg-brand-dark rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-brand-yellow transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium truncate max-w-xs">{selectedFile.name}</p>
                  <p className="text-gray-500 text-sm">{formatFileSize(selectedFile.size)}</p>
                </div>
                {!disabled && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearSelection();
                    }}
                    className="p-2 hover:bg-white/10 rounded-sm transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400 hover:text-white" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Arquivo selecionado</span>
              </div>
            </div>
          ) : (
            <>
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? 'text-brand-yellow' : 'text-gray-500'}`} />
              <p className="text-gray-400">
                {isDragOver ? (
                  <span className="text-brand-yellow font-medium">Solte o arquivo aqui</span>
                ) : (
                  <>Arraste o PDF ou <span className="text-brand-yellow">clique para selecionar</span></>
                )}
              </p>
              <p className="text-gray-600 text-xs mt-2">Máximo 10MB • Apenas PDF</p>
            </>
          )}

          {error && (
            <div className="mt-4 flex items-center justify-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-brand-card text-gray-500 uppercase text-xs font-bold">
            Ou cole o link abaixo
          </span>
        </div>
      </div>

      {/* URL Input */}
      <div>
        <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
          Link do Edital
        </label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <LinkIcon className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://exemplo.com/edital.pdf"
              disabled={disabled || !!selectedFile}
              className={`
                w-full bg-brand-dark border border-white/10 rounded-sm py-3 pl-10 pr-4
                text-white focus:outline-none focus:border-brand-yellow placeholder-gray-600
                ${disabled || selectedFile ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={disabled || !urlInput.trim() || !!selectedFile}
            className={`
              px-6 font-bold uppercase tracking-wide rounded-sm transition-all flex items-center gap-2
              ${disabled || !urlInput.trim() || selectedFile
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              }
            `}
          >
            <CheckCircle className="w-4 h-4" />
            Usar Link
          </button>
        </div>
        {urlInput && !selectedFile && (
          <p className="text-gray-500 text-xs mt-2">
            O sistema irá baixar o PDF do link fornecido para análise.
          </p>
        )}
      </div>
    </div>
  );
};
