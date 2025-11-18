
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onFileChange(file);
      } else {
        alert('Please upload an image file.');
      }
    }
  }, [onFileChange]);

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };


  return (
    <div>
      <label
        htmlFor="file-upload"
        className={`relative block w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200 ${
          isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {imagePreview ? (
          <img src={imagePreview} alt="Preview" className="mx-auto max-h-64 rounded-md" />
        ) : (
          <div className="flex flex-col items-center">
            <UploadIcon className="w-12 h-12 text-slate-400" />
            <span className="mt-2 block text-sm font-medium text-slate-900 dark:text-slate-200">
              Drag & drop or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
            </span>
            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">PNG, JPG, GIF up to 10MB</span>
          </div>
        )}
      </label>
      <input
        id="file-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={(e) => handleFileChange(e.target.files)}
      />
      {imagePreview && (
        <button
            onClick={() => {
                setImagePreview(null);
                onFileChange(null);
                const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                if (fileInput) fileInput.value = '';
            }}
            className="mt-4 w-full text-sm text-red-600 dark:text-red-400 hover:underline"
        >
            Remove Image
        </button>
      )}
    </div>
  );
};

export default FileUpload;
