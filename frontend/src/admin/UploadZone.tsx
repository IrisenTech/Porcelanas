import React, { useRef, useState, useCallback } from 'react';
import { toWebP } from '../lib/imageUtils';
import { saveImageToOPFS, generateId } from '../lib/storage';
import { UnassignedPhoto } from '../types';

interface Props {
  onUploaded: (photos: UnassignedPhoto[]) => void;
}

interface ProgressEntry {
  name: string;
  progress: number; // 0–100
  done: boolean;
  error?: string;
}

export function UploadZone({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateProgress = (idx: number, patch: Partial<ProgressEntry>) => {
    setProgress(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const processFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    setIsProcessing(true);
    const entries: ProgressEntry[] = imageFiles.map(f => ({
      name: f.name,
      progress: 0,
      done: false,
    }));
    setProgress(entries);

    const results: UnassignedPhoto[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      try {
        updateProgress(i, { progress: 30 });
        const { blob, dataUrl } = await toWebP(file, 1200, 0.85);
        const id = generateId();
        const opfsName = `img_${id}.webp`;
        updateProgress(i, { progress: 70 });
        await saveImageToOPFS(opfsName, blob);
        updateProgress(i, { progress: 100, done: true });
        results.push({ id, opfsName, dataUrl });
      } catch (err) {
        updateProgress(i, { progress: 0, done: true, error: 'Error' });
      }
    }

    setIsProcessing(false);
    onUploaded(results);

    // Clear progress after a moment
    setTimeout(() => setProgress([]), 2500);
  }, [onUploaded]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    e.target.value = '';
  };

  return (
    <div className="admin-section">
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload images"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 16v2a2 2 0 002 2h14a2 2 0 002-2v-2" strokeLinecap="round"/>
          <rect x="3" y="10" width="18" height="12" rx="2" strokeLinejoin="round"/>
        </svg>
        <p>
          <strong>Arrastrar fotos aquí</strong> o hacer clic para seleccionar
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--cream-muted)' }}>
          JPG, PNG, WEBP — Se convertirán automáticamente a WebP
        </p>
        {isProcessing && (
          <div style={{ marginTop: '0.75rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {progress.length > 0 && (
        <div className="upload-progress">
          {progress.map((p, i) => (
            <div key={i} className="progress-item">
              <span style={{ flex: '0 0 140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              {p.error ? (
                <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>❌ Error</span>
              ) : (
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${p.progress}%` }} />
                </div>
              )}
              {p.done && !p.error && (
                <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
