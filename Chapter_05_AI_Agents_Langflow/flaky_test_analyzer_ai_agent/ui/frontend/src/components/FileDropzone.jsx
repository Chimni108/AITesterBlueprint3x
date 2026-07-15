import { useRef, useState } from 'react';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileDropzone({ label, file, onFileSelected }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList) {
    const selected = fileList?.[0];
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith('.json')) {
      alert('Please select a .json file.');
      return;
    }
    onFileSelected(selected);
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'dropzone--dragging' : ''} ${file ? 'dropzone--filled' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="dropzone__label">{label}</div>
      {file ? (
        <div className="dropzone__file">
          <span className="dropzone__filename">{file.name}</span>
          <span className="dropzone__filesize">{formatBytes(file.size)}</span>
        </div>
      ) : (
        <div className="dropzone__hint">Click or drag a .json file here</div>
      )}
    </div>
  );
}
