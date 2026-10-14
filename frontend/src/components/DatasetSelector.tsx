import React, { useState } from "react";
import { DatasetInfo, uploadDataset } from "@/lib/api";
import { Database, UploadCloud } from "lucide-react";

interface DatasetSelectorProps {
  datasets: DatasetInfo[];
  selectedDataset: string;
  onSelectDataset: (id: string) => void;
  onDatasetUploaded: () => void;
}

export const DatasetSelector: React.FC<DatasetSelectorProps> = ({
  datasets,
  selectedDataset,
  onSelectDataset,
  onDatasetUploaded
}) => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadText, setUploadText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!selectedFile && !uploadText.trim()) return;
    setUploading(true);
    try {
      await uploadDataset(selectedFile, uploadText.trim() ? uploadText : null);
      setShowUploadModal(false);
      setUploadText("");
      setSelectedFile(null);
      onDatasetUploaded();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to upload custom dataset.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-ide-panel border border-ide-border p-3 rounded-lg text-xs font-mono">
      <div className="flex items-center gap-2">
        <Database size={15} className="text-ide-muted" />
        <span className="text-xs font-medium text-ide-muted">Active Dataset:</span>
        <select
          value={selectedDataset}
          onChange={(e) => onSelectDataset(e.target.value)}
          className="bg-ide-bg border border-ide-border text-xs text-ide-text rounded px-2.5 py-1 focus:outline-none focus:border-ide-borderLight font-mono cursor-pointer"
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.recordCount} logs, {d.format})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setShowUploadModal(true)}
        className="flex items-center gap-1.5 bg-ide-surface hover:bg-ide-hover text-ide-text border border-ide-border px-2.5 py-1 rounded text-xs font-medium transition"
      >
        <UploadCloud size={13} className="text-ide-muted" />
        <span>Upload Dataset</span>
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-ide-panel border border-ide-border rounded-lg max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ide-border pb-3">
              <h3 className="text-xs font-semibold text-ide-text flex items-center gap-2 uppercase tracking-wide">
                <Database size={14} className="text-ide-muted" /> Ingest Log Dataset
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-ide-subtle hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-ide-muted leading-relaxed font-sans">
              Upload a .jsonl, .log, or .txt file, or paste raw log lines.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs text-ide-muted font-medium">Select File:</label>
              <input
                type="file"
                accept=".log,.jsonl,.txt,.json"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-ide-muted file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-medium file:bg-ide-surface file:text-ide-text hover:file:bg-ide-hover cursor-pointer border border-ide-border rounded p-1"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-ide-muted font-medium">Or Paste Log Lines:</label>
              <textarea
                rows={4}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder="Paste raw log lines here..."
                className="w-full bg-ide-bg border border-ide-border rounded p-2 text-xs font-mono text-ide-text placeholder-ide-subtle focus:outline-none focus:border-ide-borderLight resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-ide-border">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-3 py-1.5 rounded hover:bg-ide-surface text-xs text-ide-muted hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-3.5 py-1.5 rounded font-medium bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
