import { useState } from "react";

export interface ConnectionConfig {
  connectionString: string;
  tableName: string;
}

interface ConnectionFormProps {
  onConnect: (config: ConnectionConfig) => void;
  isLoading: boolean;
}

export function ConnectionForm({ onConnect, isLoading }: ConnectionFormProps) {
  const [connectionString, setConnectionString] = useState("");
  const [tableName, setTableName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (connectionString.trim() && tableName.trim()) {
      onConnect({ connectionString: connectionString.trim(), tableName: tableName.trim() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      <div>
        <label
          htmlFor="connectionString"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
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

      <div>
        <label
          htmlFor="tableName"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Table Name
        </label>
        <input
          id="tableName"
          type="text"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="myTable"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !connectionString.trim() || !tableName.trim()}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Verbinde..." : "Verbinden"}
      </button>
    </form>
  );
}
