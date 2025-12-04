import type { ReactNode } from "react";

export function tryParseJson(value: unknown): { isJson: boolean; parsed: unknown } {
  if (typeof value !== "string") {
    if (typeof value === "object" && value !== null) {
      return { isJson: true, parsed: value };
    }
    return { isJson: false, parsed: null };
  }
  const trimmed = value.trim();
  if ((!trimmed.startsWith("{") && !trimmed.startsWith("[")) || 
      (!trimmed.endsWith("}") && !trimmed.endsWith("]"))) {
    return { isJson: false, parsed: null };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return { isJson: true, parsed };
  } catch {
    return { isJson: false, parsed: null };
  }
}

export function tryParseCsv(value: unknown): { isCsv: boolean; rows: string[][] } {
  if (typeof value !== "string") {
    return { isCsv: false, rows: [] };
  }
  
  const trimmed = value.trim();
  
  // Mindestens ein Komma erforderlich
  if (!trimmed.includes(",")) {
    return { isCsv: false, rows: [] };
  }
  
  // Aufteilen in Zeilen
  const lines = trimmed.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length === 0) {
    return { isCsv: false, rows: [] };
  }
  
  // CSV-Heuristik:
  // 1. Keine Leerzeichen außer in Anführungszeichen (oder sehr wenige)
  // 2. Konsistente Anzahl von Kommas pro Zeile
  // 3. Mindestens 2 Spalten
  
  const rows: string[][] = [];
  let expectedColumns = -1;
  
  for (const line of lines) {
    // Einfaches CSV-Parsing (unterstützt quoted values)
    const columns = parseCsvLine(line);
    
    if (columns.length < 2) {
      return { isCsv: false, rows: [] };
    }
    
    if (expectedColumns === -1) {
      expectedColumns = columns.length;
    } else if (columns.length !== expectedColumns) {
      // Inkonsistente Spaltenanzahl
      return { isCsv: false, rows: [] };
    }
    
    rows.push(columns);
  }
  
  // Prüfe ob es wie CSV aussieht (wenig Leerzeichen außerhalb von Quotes)
  const unquotedParts = trimmed.replace(/"[^"]*"/g, "");
  const spaceRatio = (unquotedParts.match(/ /g) || []).length / unquotedParts.length;
  
  // Wenn mehr als 10% Leerzeichen, ist es wahrscheinlich kein CSV
  if (spaceRatio > 0.1) {
    return { isCsv: false, rows: [] };
  }
  
  return { isCsv: true, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function highlightJson(json: unknown): ReactNode[] {
  const str = JSON.stringify(json, null, 2);
  const result: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const styles = {
    string: "text-green-600",
    number: "text-blue-600",
    boolean: "text-orange-500",
    null: "text-red-500",
    key: "text-purple-600",
    bracket: "text-gray-600",
  };

  while (i < str.length) {
    const char = str[i];

    // Strings (Keys oder Values)
    if (char === '"') {
      const start = i;
      i++;
      while (i < str.length && (str[i] !== '"' || str[i - 1] === '\\')) {
        i++;
      }
      i++;
      const content = str.slice(start, i);
      
      let j = i;
      while (j < str.length && str[j] === ' ') j++;
      const isKey = str[j] === ':';
      
      const className = isKey ? styles.key : styles.string;
      result.push(
        <span key={key++} className={className}>
          {content}
        </span>
      );
      continue;
    }

    // Zahlen
    if (char === '-' || (char >= '0' && char <= '9')) {
      const start = i;
      while (i < str.length && /[\d.eE+-]/.test(str[i])) {
        i++;
      }
      result.push(
        <span key={key++} className={styles.number}>
          {str.slice(start, i)}
        </span>
      );
      continue;
    }

    // true/false/null
    if (str.slice(i, i + 4) === 'true') {
      result.push(<span key={key++} className={styles.boolean}>true</span>);
      i += 4;
      continue;
    }
    if (str.slice(i, i + 5) === 'false') {
      result.push(<span key={key++} className={styles.boolean}>false</span>);
      i += 5;
      continue;
    }
    if (str.slice(i, i + 4) === 'null') {
      result.push(<span key={key++} className={styles.null}>null</span>);
      i += 4;
      continue;
    }

    // Klammern und Sonderzeichen
    if ('{}[],:'.includes(char)) {
      result.push(<span key={key++} className={styles.bracket}>{char}</span>);
      i++;
      continue;
    }

    // Whitespace und Rest
    result.push(<span key={key++}>{char}</span>);
    i++;
  }

  return result;
}

// Spaltenname-Patterns für Timestamp-Erkennung
const TIMESTAMP_COLUMN_PATTERNS = [
  /time/i,
  /date/i,
  /created/i,
  /updated/i,
  /modified/i,
  /^at$/i,
  /timestamp/i,
];

// Prüft ob Spaltenname auf Timestamp hindeutet
export function isTimestampColumn(columnName: string): boolean {
  return TIMESTAMP_COLUMN_PATTERNS.some(pattern => pattern.test(columnName));
}

// Prüft ob Wert ein plausibler Unix-Timestamp ist (ms oder s)
export function tryFormatTimestamp(value: unknown): { isTimestamp: boolean; formatted: string } {
  if (typeof value !== "number" && typeof value !== "string") {
    return { isTimestamp: false, formatted: "" };
  }
  
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num) || num <= 0) {
    return { isTimestamp: false, formatted: "" };
  }
  
  // 13 Ziffern = Millisekunden (1000000000000 - 9999999999999)
  // 10 Ziffern = Sekunden (1000000000 - 9999999999)
  const isMilliseconds = num >= 1_000_000_000_000 && num < 10_000_000_000_000;
  const isSeconds = num >= 1_000_000_000 && num < 10_000_000_000;
  
  if (!isMilliseconds && !isSeconds) {
    return { isTimestamp: false, formatted: "" };
  }
  
  const timestamp = isMilliseconds ? num : num * 1000;
  const date = new Date(timestamp);
  
  // Plausibilitätsprüfung: Zwischen 2000 und 2100
  const year = date.getFullYear();
  if (year < 2000 || year > 2100) {
    return { isTimestamp: false, formatted: "" };
  }
  
  // ISO-Format wie Azure Timestamp
  const formatted = date.toISOString();
  
  return { isTimestamp: true, formatted };
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
