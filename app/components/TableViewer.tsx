import { useCallback, useMemo, useState, useEffect } from "react";
import type { TableEntity } from "../types/index.ts";
import { analyzeContent, type ContentType } from "../utils/jsonUtils.ts";
import { downloadCSV, entitiesToCSV } from "../utils/csvExport.ts";
import { ContentModal } from "./ContentModal.tsx";
import { fetchTableEntitiesApi } from "../services/apiClient.ts";
import { ArrowLeftCircleIcon } from '@heroicons/react/24/solid'

interface TableViewerProps {
  entities: TableEntity[];
  tableName: string;
  connectionString: string;
  initialContinuationToken?: string;
  initialHasMore: boolean;
  onDisconnect: () => void;
  onBackToTables: () => void;
}

interface ModalState {
  content: unknown;
  type: ContentType;
}

export function TableViewer({
  entities: initialEntities,
  tableName,
  connectionString,
  initialContinuationToken,
  initialHasMore,
  onDisconnect,
  onBackToTables,
}: TableViewerProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"simple" | "odata">("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [entities, setEntities] = useState<TableEntity[]>(initialEntities);
  const [filterError, setFilterError] = useState<string | null>(null);
  
  // Pagination state - Load More Pattern
  const [loadSize, setLoadSize] = useState<number>(100);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [totalLoaded, setTotalLoaded] = useState(0);

  // Update entities when initialEntities change (e.g., on table reload)
  useEffect(() => {
    setEntities(initialEntities);
    setNextToken(initialContinuationToken);
    setHasMore(initialHasMore);
    setTotalLoaded(initialEntities.length);
  }, [initialEntities, initialContinuationToken, initialHasMore]);

  const formatTimestamp = (value: string): string => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) + " UTC";
  };

  const formatValue = (value: unknown, column?: string): string => {
    if (value === null || value === undefined) return "-";
    if (column === "timestamp" && typeof value === "string") {
      return formatTimestamp(value);
    }
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleCellClick = (value: unknown) => {
    const analysis = analyzeContent(value);
    if (analysis.isClickable) {
      setModalState({ content: analysis.parsed, type: analysis.type });
    }
  };

  const handleSimpleSearch = (query: string) => {
    setSearchQuery(query);
    setFilterError(null);
    if (!query.trim()) {
      setEntities(initialEntities);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const filtered = initialEntities.filter((entity) =>
      Object.values(entity).some((val) =>
        String(val).toLowerCase().includes(lowerQuery)
      )
    );
    setEntities(filtered);
  };

  const handleODataSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setFilterError(null);
      if (!query.trim()) {
        setEntities(initialEntities);
        setTotalLoaded(initialEntities.length);
        return;
      }
      setIsLoading(true);
      console.log("OData Filter Request:", { tableName, filter: query });
      try {
        const result = await fetchTableEntitiesApi(
          connectionString,
          tableName,
          query,
          loadSize,
        );
        console.log("OData Filter Response:", {
          count: result.entities.length,
          hasMore: result.hasMore,
        });
        setEntities(result.entities);
        setNextToken(result.continuationToken);
        setHasMore(result.hasMore);
        setTotalLoaded(result.entities.length);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : "Filter failed";
        console.error("OData Filter Error:", message);
        setFilterError(message);
        setEntities(initialEntities);
      } finally {
        setIsLoading(false);
      }
    },
    [connectionString, tableName, initialEntities, loadSize],
  );

  const handleApplyFilter = useCallback(() => {
    if (filterMode === "odata" && searchQuery.trim()) {
      handleODataSearch(searchQuery);
    }
  }, [filterMode, searchQuery, handleODataSearch]);

  const handleRefresh = useCallback(() => {
    setEntities(initialEntities);
    setSearchQuery("");
    setFilterError(null);
    setSortColumn(null);
    setSortDirection("asc");
    setNextToken(undefined);
    setHasMore(false);
    setTotalLoaded(initialEntities.length);
  }, [initialEntities]);

  const handleLoadMore = useCallback(async () => {
    if (!nextToken || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await fetchTableEntitiesApi(
        connectionString,
        tableName,
        filterMode === "odata" ? searchQuery : undefined,
        loadSize,
        nextToken,
      );
      
      // Append new entities to existing ones
      setEntities(prev => [...prev, ...result.entities]);
      setNextToken(result.continuationToken);
      setHasMore(result.hasMore);
      setTotalLoaded(prev => prev + result.entities.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load more";
      setFilterError(message);
    } finally {
      setIsLoading(false);
    }
  }, [nextToken, isLoading, connectionString, tableName, filterMode, searchQuery, loadSize]);

  const handleLoadSizeChange = useCallback(async (newSize: number) => {
    setLoadSize(newSize);
    setIsLoading(true);
    try {
      const result = await fetchTableEntitiesApi(
        connectionString,
        tableName,
        filterMode === "odata" ? searchQuery : undefined,
        newSize,
      );
      
      setEntities(result.entities);
      setNextToken(result.continuationToken);
      setHasMore(result.hasMore);
      setTotalLoaded(result.entities.length);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change load size";
      setFilterError(message);
    } finally {
      setIsLoading(false);
    }
  }, [connectionString, tableName, filterMode, searchQuery]);

  const sortedEntities = useMemo(() => {
    return [...entities].sort((a, b) => {
      if (!sortColumn) return 0;
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const aStr = String(aVal);
      const bStr = String(bVal);

      const comparison = aStr.localeCompare(bStr, undefined, {
        numeric: true,
      });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [entities, sortColumn, sortDirection]);

  const handleDownloadCSV = useCallback(() => {
    const csv = entitiesToCSV(sortedEntities);
    const timestamp = new Date().toISOString().slice(0, 10);
    downloadCSV(csv, `${tableName}_${timestamp}.csv`);
  }, [sortedEntities, tableName]);

  const columns = useMemo(
    () =>
      Array.from(new Set(entities.flatMap((entity) => Object.keys(entity)))),
    [entities],
  );

  const sortedColumns = useMemo(() => {
    const priorityColumns = ["partitionKey", "rowKey", "timestamp"];
    return [
      ...priorityColumns.filter((col) => columns.includes(col)),
      ...columns.filter((col) =>
        !priorityColumns.includes(col) && col !== "etag"
      ).sort(),
    ];
  }, [columns]);

  const getLabelStyle = (color: string) => {
    const styles: Record<string, string> = {
      purple: "bg-purple-100 text-purple-600",
      green: "bg-green-100 text-green-600",
      blue: "bg-blue-100 text-blue-600",
    };
    return styles[color] || "bg-gray-100 text-gray-600";
  };

  const renderCell = (value: unknown, column: string) => {
    const analysis = analyzeContent(value);
    const displayValue = formatValue(value, column);

    if (analysis.isClickable) {
      const textColorClass = analysis.type === "json"
        ? "text-purple-600 hover:text-purple-800"
        : analysis.type === "csv"
        ? "text-green-600 hover:text-green-800"
        : "text-blue-600 hover:text-blue-800";

      return (
        <span
          className={`flex items-center gap-1 cursor-pointer ${textColorClass}`}
        >
          <span
            className={`text-xs px-1 rounded ${
              getLabelStyle(analysis.labelColor)
            }`}
          >
            {analysis.label}
          </span>
          <span className="truncate">{displayValue}</span>
        </span>
      );
    }
    return displayValue;
  };

  return (
    <div className="w-full">
      {modalState !== null && (
        <ContentModal
          content={modalState.content}
          type={modalState.type}
          onClose={() => setModalState(null)}
        />
      )}
      <div className="flex justify-between  items-end mb-4 ">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToTables}
            className="h-6 flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <ArrowLeftCircleIcon className="h-7 mt-0.5" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            <span className="text-slate-800">{tableName}</span>
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({entities.length} entries)
            </span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Sorted by Azure native order (PartitionKey, RowKey)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            className="text-sm px-3 py-1 cursor-pointer  bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1"
            title="Refresh table data"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleDownloadCSV}
            disabled={entities.length === 0}
            className="text-sm px-3 py-1 cursor-pointer  bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            title="Download filtered data as CSV"
          >
            CSV Export
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            className="text-sm cursor-pointer  bg-red-500 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Filter UI */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg">
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={() => {
              setFilterMode("simple");
              setSearchQuery("");
              setFilterError(null);
              setEntities(initialEntities);
            }}
            className={`px-3 py-1 text-sm rounded ${
              filterMode === "simple"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Quick Search
          </button>
          <button
            type="button"
            onClick={() => {
              setFilterMode("odata");
              setSearchQuery("");
              setFilterError(null);
              setEntities(initialEntities);
            }}
            className={`px-3 py-1 text-sm rounded ${
              filterMode === "odata"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            OData Filter
          </button>
        </div>

        {filterMode === "simple" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Search in all fields..."
              value={searchQuery}
              onChange={(e) => handleSimpleSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">
              Searches across all columns (client-side)

            </p>
          </div>
        )}

        {filterMode === "odata" && (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="e.g., partitionKey eq 'User1' or startswith(email, 'admin')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="flex justify-between items-start">
              <p className="text-xs text-gray-500">
                OData filter syntax (server-side)
              </p>
              <button
                type="button"
                onClick={handleApplyFilter}
                disabled={isLoading}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Filtering..." : "Apply"}
              </button>
            </div>
          </div>
        )}

        {filterError && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
            {filterError}
          </div>
        )}
      </div>

      {/* Load More Controls */}
      <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700">Load Size:</span>
          <select
            value={loadSize}
            onChange={(e) => handleLoadSizeChange(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
          <span className="text-sm text-gray-500">
            {totalLoaded} entries loaded
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Loading..." : `Load ${loadSize} more`}
            </button>
          )}
          {!hasMore && totalLoaded > 0 && (
            <span className="text-sm text-gray-500">All entries loaded</span>
          )}
        </div>
      </div>

      {entities.length === 0 && !filterError && (
        <p className="text-gray-500 text-center py-8">
          {searchQuery ? "No matching entries found." : "No entries found."}
        </p>
      )}

      {entities.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {sortedColumns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {column}
                      {sortColumn === column && (
                        <span className="text-blue-600">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedEntities.map((entity, idx) => (
                <tr
                  key={`${entity.partitionKey}-${entity.rowKey}-${idx}`}
                  className="hover:bg-gray-50"
                >
                  {sortedColumns.map((column) => {
                    const value = entity[column];
                    const analysis = analyzeContent(value);
                    return (
                      <td
                        key={column}
                        className={`px-4 py-3 text-sm text-gray-700 whitespace-nowrap max-w-xs truncate ${
                          analysis.isClickable ? "cursor-pointer" : ""
                        }`}
                        title={formatValue(value, column)}
                        onClick={() =>
                          analysis.isClickable && handleCellClick(value)}
                      >
                        {renderCell(value, column)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
