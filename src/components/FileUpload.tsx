import { useRef, useState } from "react";
import type { FileStatus } from "../lib/types";

interface Props {
  fileStatuses: FileStatus[];
  onFilesSelected: (files: File[]) => void;
}

export function FileUpload({ fileStatuses, onFilesSelected }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const pdfFiles = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (pdfFiles.length > 0) onFilesSelected(pdfFiles);
  }

  return (
    <div className="upload-card">
      <div
        className={`dropzone ${isDragOver ? "dropzone--active" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <p className="dropzone__title">
          Перетащите PDF-выписки сюда или нажмите, чтобы выбрать файлы
        </p>
        <p className="dropzone__hint">Поддерживаются выписки Kaspi и Halyk (текстовые PDF)</p>
      </div>

      {fileStatuses.length > 0 && (
        <ul className="file-status-list">
          {fileStatuses.map((fs) => (
            <li key={fs.id} className={`file-status file-status--${fs.status}`}>
              <span className="file-status__name">{fs.name}</span>
              {fs.status === "processing" && <span className="file-status__badge">обработка…</span>}
              {fs.status === "success" && (
                <span className="file-status__badge">
                  готово · {fs.transactionCount} операций
                </span>
              )}
              {fs.status === "error" && (
                <span className="file-status__badge" title={fs.error}>
                  ошибка
                </span>
              )}
              {fs.status === "error" && fs.error && (
                <span className="file-status__error">{fs.error}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
