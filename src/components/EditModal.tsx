import { useState } from "react";
import { tryParseJson, highlightJson } from "../utils/json.tsx";

interface EditModalProps {
  value: unknown;
  columnName: string;
  isEditable: boolean;
  onClose: () => void;
  onSave: (newValue: string) => Promise<void>;
}

export function EditModal({ value, columnName, isEditable, onClose, onSave }: EditModalProps) {
  const { isJson } = tryParseJson(value);
  const stringValue = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value ?? "");
  
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(stringValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartEdit = () => {
    setEditValue(stringValue);
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    if (isJson) {
      try {
        JSON.parse(editValue);
      } catch {
        setError("Ungültiges JSON-Format");
        return;
      }
    }
    
    setIsSaving(true);
    setError(null);
    try {
      await onSave(editValue);
      setIsEditing(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(stringValue);
    setError(null);
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-800">{columnName}</h3>
            {isJson && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">JSON</span>}
            {!isEditable && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">🔒 Schreibgeschützt</span>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        <div className="overflow-auto p-4 flex-1 bg-gray-50">
          {isEditing ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full h-full min-h-[200px] p-3 text-sm font-mono bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              spellCheck={false}
              autoFocus
            />
          ) : (
            <pre className="text-sm font-mono whitespace-pre-wrap break-words">
              {isJson ? highlightJson(value) : stringValue}
            </pre>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 flex justify-between">
          <div>
            {!isEditing && (
              <button
                onClick={() => navigator.clipboard.writeText(stringValue)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Kopieren
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Speichern..." : "Speichern"}
                </button>
              </>
            ) : (
              <>
                {isEditable && (
                  <button
                    onClick={handleStartEdit}
                    className="px-3 py-1.5 text-sm bg-yellow-500 text-white hover:bg-yellow-600 rounded-md transition-colors"
                  >
                    Bearbeiten
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
                >
                  Schließen
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
