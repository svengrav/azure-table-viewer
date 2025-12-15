import { useState, useEffect } from "react";
import type { AppState } from "./types/index.ts";
import { listTablesApi, fetchTableEntitiesApi } from "./services/apiClient.ts";
import { ConnectionForm } from "./components/ConnectionForm.tsx";
import { TableSelector } from "./components/TableSelector.tsx";
import { TableViewer } from "./components/TableViewer.tsx";
import { getUrlParams, setUrlParams } from "./utils/urlParams.ts";

function App() {
  const [state, setState] = useState<AppState>({ status: "disconnected" });

  // Initialisiere State aus URL-Parametern beim Mount
  useEffect(() => {
    const params = getUrlParams();
    if (params.connection) {
      // Auto-Connect wenn connection Parameter vorhanden
      handleConnectWithParams(params.connection, params.table);
    }
  }, []);

  const handleConnect = async (connectionString: string) => {
    setState({ status: "loading-tables" });
    setUrlParams({ connection: connectionString });
    try {
      const tables = await listTablesApi(connectionString);
      setState({ status: "tables-loaded", connectionString, tables });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleConnectWithParams = async (connectionString: string, tableName?: string) => {
    setState({ status: "loading-tables" });
    setUrlParams({ connection: connectionString });
    try {
      const tables = await listTablesApi(connectionString);
      // Wenn table Parameter vorhanden, versuche diese zu laden
      if (tableName) {
        setState({ status: "loading-data", connectionString, tables, selectedTable: tableName });
        try {
          const entities = await fetchTableEntitiesApi(connectionString, tableName);
          setState({ status: "connected", connectionString, tables, tableName, entities });
          setUrlParams({ connection: connectionString, table: tableName });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unbekannter Fehler";
          setState({ status: "error", message, connectionString });
        }
      } else {
        setState({ status: "tables-loaded", connectionString, tables });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleSelectTable = async (tableName: string) => {
    if (state.status !== "tables-loaded" && state.status !== "connected") return;
    
    const { connectionString, tables } = state;
    setState({ status: "loading-data", connectionString, tables, selectedTable: tableName });
    setUrlParams({ connection: connectionString, table: tableName });
    
    try {
      const entities = await fetchTableEntitiesApi(connectionString, tableName);
      setState({ status: "connected", connectionString, tables, tableName, entities });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleBackToTables = () => {
    if (state.status === "connected") {
      setState({ status: "tables-loaded", connectionString: state.connectionString, tables: state.tables });
      setUrlParams({ connection: state.connectionString });
    }
  };

  const handleDisconnect = () => {
    setState({ status: "disconnected" });
    setUrlParams({});
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">Azure Table Viewer</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 px-4">
        {state.status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Mit Azure Table Storage verbinden</h2>
              <ConnectionForm onConnect={handleConnect} isLoading={false} />
            </div>
          </div>
        )}
        
        {state.status === "loading-tables" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Mit Azure Table Storage verbinden</h2>
              <ConnectionForm onConnect={handleConnect} isLoading={true} />
            </div>
          </div>
        )}
        
        {state.status === "tables-loaded" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <TableSelector 
                tables={state.tables} 
                onSelectTable={handleSelectTable} 
                onDisconnect={handleDisconnect}
                isLoading={false}
              />
            </div>
          </div>
        )}
        
        {state.status === "loading-data" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Lade Daten aus Tabelle...</p>
                <p className="text-blue-600 font-medium">{state.selectedTable}</p>
              </div>
            </div>
          </div>
        )}
        
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <strong className="font-medium">Fehler:</strong> {state.message}
              </div>
              <ConnectionForm onConnect={handleConnect} isLoading={false} initialValue={state.connectionString} />
            </div>
          </div>
        )}
        
        {state.status === "connected" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <TableViewer 
              entities={state.entities} 
              tableName={state.tableName}
              connectionString={state.connectionString}
              onDisconnect={handleDisconnect}
              onBackToTables={handleBackToTables}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
