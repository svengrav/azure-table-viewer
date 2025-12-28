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
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleConnectWithParams = async (connectionString: string, tableName?: string) => {
    setState({ status: "loading-tables" });
    setUrlParams({ connection: connectionString });
    try {
      const tables = await listTablesApi(connectionString);
      if (tableName) {
        setState({ status: "loading-data", connectionString, tables, selectedTable: tableName });
        try {
          const result = await fetchTableEntitiesApi(connectionString, tableName);
          setState({ status: "connected", connectionString, tables, tableName, entities: result.entities });
          setUrlParams({ connection: connectionString, table: tableName });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          setState({ status: "error", message, connectionString });
        }
      } else {
        setState({ status: "tables-loaded", connectionString, tables });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      setState({ status: "error", message, connectionString });
    }
  };

  const handleSelectTable = async (tableName: string) => {
    if (state.status !== "tables-loaded" && state.status !== "connected") return;
    
    const { connectionString, tables } = state;
    setState({ status: "loading-data", connectionString, tables, selectedTable: tableName });
    setUrlParams({ connection: connectionString, table: tableName });
    
    try {
      const result = await fetchTableEntitiesApi(connectionString, tableName);
      setState({ status: "connected", connectionString, tables, tableName, entities: result.entities });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900  text-white">
        <div className="max-w-7xl mx-auto py-3 px-4">
          <h1 className="text-2xl font-semibold text-gray-100">Azure Table Viewer</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto ">
        {state.status === "disconnected" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Connect to Azure Table Storage</h2>
              <ConnectionForm onConnect={handleConnect} isLoading={false} />
            </div>
          </div>
        )}
        
        {state.status === "loading-tables" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-lg font-medium text-gray-800 mb-6 text-center">Connect to Azure Table Storage</h2>
              <ConnectionForm onConnect={handleConnect} isLoading />
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
                <p className="text-gray-600 mb-2">Loading data from table...</p>
                <p className="text-blue-600 font-medium">{state.selectedTable}</p>
              </div>
            </div>
          </div>
        )}
        
        {state.status === "error" && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                <strong className="font-medium">Error:</strong> {state.message}
              </div>
              <ConnectionForm onConnect={handleConnect} isLoading={false} initialValue={state.connectionString} />
            </div>
          </div>
        )}
        
        {state.status === "connected" && (
          <div className="p-6 rounded-lg ">
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
