import React, { useState, useRef } from 'react';
import { UploadCloud, File, X, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FileUploadInputProps {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  accept?: string;
  maxSizeMb?: number;
  onFileSelect?: (file: File | null) => void;
  disabled?: boolean;
}

export const FileUploadInput: React.FC<FileUploadInputProps> = ({
  label,
  helperText = 'PDF, PNG, JPG up to 5MB',
  error,
  required,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 5,
  onFileSelect,
  disabled,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | null) => {
    if (file) {
      if (file.size > maxSizeMb * 1024 * 1024) {
        alert(`File size exceeds limit of ${maxSizeMb}MB`);
        return;
      }
      setSelectedFile(file);
      onFileSelect?.(file);
    } else {
      setSelectedFile(null);
      onFileSelect?.(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <span className="text-[18px] font-medium text-[#0F172A] dark:text-slate-200 select-none">
          {label} {required && <span className="text-[#EF4444] font-bold">*</span>}
        </span>
      )}

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all cursor-pointer bg-[#F8FAFC] dark:bg-slate-900/50',
            isDragging ? 'border-[#16A34A] bg-[#F0FDF4]' : 'border-[#E2E8F0] dark:border-slate-700 hover:border-[#16A34A] hover:bg-[#F0FDF4]/50 dark:hover:bg-slate-850',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
            error ? 'border-[#EF4444] bg-rose-50/30' : ''
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          <UploadCloud className="w-10 h-10 text-[#16A34A] mb-3 opacity-90" />
          <p className="text-[18px] font-medium text-[#0F172A] dark:text-slate-200 text-center">
            <span className="text-[#16A34A] font-semibold hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-[15px] text-[#475569] dark:text-slate-400 mt-1">{helperText}</p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border border-[#E2E8F0] dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] dark:bg-emerald-950/60 text-[#16A34A] flex items-center justify-center flex-shrink-0">
              <File className="w-6 h-6" />
            </div>
            <div className="truncate">
              <p className="text-[17px] font-semibold text-[#0F172A] dark:text-white truncate">{selectedFile.name}</p>
              <p className="text-[14px] text-[#475569] dark:text-slate-400 mt-0.5">
                {(selectedFile.size / 1024).toFixed(1)} KB • <CheckCircle2 className="w-4 h-4 inline text-[#16A34A]" /> Ready
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleFile(null)}
            className="text-slate-400 hover:text-[#EF4444] p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {error && <p className="text-[15px] text-[#EF4444] dark:text-rose-400 font-medium">{error}</p>}
    </div>
  );
};
