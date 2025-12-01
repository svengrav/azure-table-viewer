import { highlightJson } from "../utils/jsonUtils";

interface JsonModalProps {
  json: unknown;
  onClose: () => void;
}

export function JsonModal({ json, onClose }: JsonModalProps) {
  const formatted = JSON.stringify(json, null, 2);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">JSON Preview</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-4 flex-1 bg-gray-50">
          <pre className="text-sm font-mono whitespace-pre-wrap wrap-break-word">
            {highlightJson(json)}
          </pre>
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(formatted)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Kopieren
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
}
