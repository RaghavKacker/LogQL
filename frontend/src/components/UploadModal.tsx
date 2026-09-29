import React, { useState } from "react";
import { uploadDataset } from "@/lib/api";
import { Upload, X, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !rawText.trim()) {
      setError("Please select a file or paste log records.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await uploadDataset(file, rawText.trim() ? rawText : null);
      if (res.success) {
        setFile(null);
        setRawText("");
        onUploadSuccess();
        onClose();
      } else {
        setError(res.error || "Failed to parse uploaded log dataset.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to communicate with backend ingestion service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ide-panel border border-ide-borderLight rounded-lg w-full max-w-lg shadow-2xl flex flex-col text-xs text-ide-text">
        {/* Header */}
        <div className="px-4 py-3 border-b border-ide-border flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <Upload size={14} className="text-status-info" />
            <span>Ingest Custom Log Dataset</span>
          </div>
          <button
            onClick={onClose}
            className="text-ide-muted hover:text-ide-text transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-ide-muted text-[11px] leading-relaxed">
            Supported formats: <strong className="text-ide-text">JSON Lines (.jsonl)</strong>,{" "}
            <strong className="text-ide-text">Nginx/Apache CLF</strong>, and{" "}
            <strong className="text-ide-text">Syslog (RFC 3164)</strong>. All entries are normalized into in-memory records.
          </p>

          {error && (
            <div className="p-2.5 rounded bg-status-error/10 border border-status-error/30 text-status-error flex items-start gap-2 text-[11px]">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* File Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ide-text text-[11px]">Select File (.log, .jsonl, .txt):</label>
            <input
              type="file"
              accept=".log,.jsonl,.txt,.json"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="w-full text-[11px] text-ide-muted file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-ide-surface file:text-ide-text hover:file:bg-ide-hover cursor-pointer border border-ide-border rounded p-1"
            />
          </div>

          <div className="flex items-center gap-2 text-ide-subtle text-[10px]">
            <div className="flex-1 h-px bg-ide-border" />
            <span>OR PASTE TEXT</span>
            <div className="flex-1 h-px bg-ide-border" />
          </div>

          {/* Raw Text Input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-ide-text text-[11px]">Raw Log Records:</label>
            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`{"timestamp": "2026-09-28T10:00:00Z", "service": "auth-service", "level": "ERROR", "status": 500, "response_time": 140.2, "message": "Connection timeout"}`}
              className="w-full bg-ide-bg border border-ide-border rounded p-2.5 font-mono text-[11px] text-ide-text placeholder-ide-subtle focus:outline-none focus:border-status-info resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-ide-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1.5 rounded hover:bg-ide-hover text-ide-muted hover:text-ide-text transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 rounded font-semibold bg-status-info text-white hover:bg-blue-600 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading ? "Ingesting..." : "Ingest Dataset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
