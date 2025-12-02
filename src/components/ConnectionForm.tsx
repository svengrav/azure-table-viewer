import { useState } from "react";
import { STORAGE_KEY_CONNECTION } from "../constants";

interface ConnectionFormProps {
  onConnect: (connectionString: string) => void;
  isLoading: boolean;
  initialValue?: string;
}

export function ConnectionForm({ onConnect, isLoading, initialValue }: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState(() => 
    initialValue || localStorage.getItem(STORAGE_KEY_CONNECTION) || ""
  );
  const [rememberCredentials, setRememberCredentials] = useState(() => 
    !!localStorage.getItem(STORAGE_KEY_CONNECTION)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionString.trim()) {
      if (rememberCredentials) {
        localStorage.setItem(STORAGE_KEY_CONNECTION, connectionString.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_CONNECTION);
      }
      onConnect(connectionString.trim());
    }
  };

  const handleClearStorage = () => {
    localStorage.removeItem(STORAGE_KEY_CONNECTION);
    setConnectionString("");
    setRememberCredentials(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div>
        <label htmlFor="connectionString" className="block text-sm font-medium text-gray-700 mb-1">
          Connection String
        </label>
        <textarea
          id="connectionString"
          value={connectionString}
          onChange={(e) => setConnectionString(e.target.value)}
          placeholder="DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
          rows={3}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberCredentials}
            onChange={(e) => setRememberCredentials(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600">Connection String merken</span>
        </label>
        {localStorage.getItem(STORAGE_KEY_CONNECTION) && (
          <button
            type="button"
            onClick={handleClearStorage}
            className="text-sm text-red-600 hover:text-red-800 underline"
          >
            Gespeicherte Daten löschen
          </button>
        )}
      </div>
      <button
        type="submit"
        disabled={isLoading || !connectionString.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Lade Tabellen..." : "Verbinden"}
      </button>
    </form>
  );
}
