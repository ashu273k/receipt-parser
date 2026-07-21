import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import type { ParsedReceipt } from '../types';
import './UploadScreen.css';

interface UploadScreenProps {
  onExtractSuccess: (data: ParsedReceipt | null, parseFailed: boolean) => void;
}

export function UploadScreen({ onExtractSuccess }: UploadScreenProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type.startsWith('image/')) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('receipt', file);
    try {
      const res = await fetch('/api/receipts/parse', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      onExtractSuccess(json.data || null, json.parseFailed);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div 
        className={`drop-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/jpeg,image/png" 
          onChange={handleChange}
          hidden
        />
        {preview ? (
          <img src={preview} alt="Receipt preview" className="preview-img" />
        ) : (
          <div className="placeholder-text">
            Drag & drop receipt image here or click to browse
          </div>
        )}
      </div>
      <button 
        className="extract-btn" 
        onClick={handleExtract} 
        disabled={!file || loading}
      >
        {loading ? <span className="spinner"></span> : "Extract"}
      </button>
    </div>
  );
}
