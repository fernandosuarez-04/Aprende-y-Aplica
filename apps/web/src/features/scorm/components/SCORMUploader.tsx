'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { SCORMUploaderProps } from '@/lib/scorm/types';

export function SCORMUploader({
  courseId,
  organizationId,
  onSuccess,
  onError
}: SCORMUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setError('El archivo debe ser un paquete ZIP');
      onError?.('El archivo debe ser un paquete ZIP');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('El archivo excede el límite de 100MB');
      onError?.('El archivo excede el límite de 100MB');
      return;
    }

    setUploading(true);
    setError(null);
    setFileName(file.name);
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('organizationId', organizationId);

    try {
      setProgress(30);

      const response = await fetch('/api/scorm/upload', {
        method: 'POST',
        body: formData
      });

      setProgress(80);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir el paquete');
      }

      setProgress(100);
      onSuccess?.(data.package);

      // Reset después de éxito
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setFileName(null);
      }, 2000);

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al subir el paquete';
      setError(message);
      onError?.(message);
      setUploading(false);
      setProgress(0);
    }
  }, [courseId, organizationId, onSuccess, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/zip': ['.zip'] },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 scale-[1.02]'
            : 'border-neutral-300 hover:border-primary-400 hover:bg-neutral-50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto relative">
              <svg className="w-16 h-16 text-primary-100" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
              </svg>
              <svg
                className="w-16 h-16 text-primary-600 absolute top-0 left-0 transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary-600">
                {progress}%
              </span>
            </div>
            <div>
              <p className="text-neutral-700 font-medium">Subiendo...</p>
              {fileName && (
                <p className="text-neutral-500 text-sm mt-1 truncate max-w-xs mx-auto">
                  {fileName}
                </p>
              )}
            </div>
            <div className="w-full max-w-xs mx-auto bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : progress === 100 ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto text-green-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-green-600 font-medium">¡Subida completa!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto text-neutral-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-neutral-700 font-medium">
              {isDragActive ? 'Suelta el paquete SCORM aquí' : 'Arrastra y suelta el paquete SCORM'}
            </p>
            <p className="text-neutral-500 text-sm">
              o haz clic para seleccionar archivo (ZIP, máx 100MB)
            </p>
            <p className="text-neutral-400 text-xs">
              Soporta SCORM 1.2 y SCORM 2004
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <svg
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-red-600 text-sm font-medium">Error al subir</p>
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
