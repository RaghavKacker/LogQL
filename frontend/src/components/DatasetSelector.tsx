import React, { useState } from "react";
import { DatasetInfo, uploadDataset } from "@/lib/api";
import { Database, UploadCloud, Check, FileText } from "lucide-react";

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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-dark-card border border-dark-border p-3 rounded-xl">
      <div className="flex items-center gap-2">
        <Database size={16} className="text-brand-cyan" />
        <span className="text-xs font-semibold text-gray-300">Active Dataset:</span>
        <select
          value={selectedDataset}
          onChange={(e) => onSelectDataset(e.target.value)}
          className="bg-dark-input border border-dark-border text-xs text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 font-mono"
        >
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.recordCount} records, {d.format})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={() => setShowUploadModal(true)}
        className="flex items-center gap-1.5 bg-dark-bg hover:bg-dark-border text-gray-300 hover:text-white border border-dark-border px-3 py-1.5 rounded-lg text-xs font-semibold transition"
      >
        <UploadCloud size={14} className="text-indigo-400" />
        Upload Custom Log
      </button>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-dark-card border border-dark-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-border pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText size={16} className="text-brand-cyan" /> Ingest Custom Log Dataset
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Upload a `.jsonl`, `.log` (CLF), or `.txt` file, or paste raw log lines below. It will be parsed into the in-memory normalized store.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-gray-300 font-semibold">Select Log File:</label>
              <input
                type="file"
                accept=".log,.jsonl,.txt,.json"
                onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-300 font-semibold">Or Paste Raw Log Lines:</label>
              <textarea
                rows={5}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder='{"timestamp": "2026-09-28T10:00:00Z", "service": "auth", "status": 500, ...}'
                className="w-full bg-dark-input border border-dark-border rounded-lg p-3 text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-cyan text-gray-950 hover:bg-cyan-400 transition font-bold disabled:opacity-50"
              >
                {uploading ? "Ingesting..." : "Ingest & Normalize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
