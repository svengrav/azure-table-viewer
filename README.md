# Azure Table Viewer

Modern web application for browsing and managing data from Azure Table Storage.

## Features

- 🔗 **Connection Management**: Secure credential storage in LocalStorage
- 📊 **Table Overview**: List all available tables in your storage account
- 📋 **Data Viewer**: Interactive display and search within table entities
- 🎨 **Modern UI**: Responsive design with Tailwind CSS
- ⚙️ **Backend API**: Oak/Deno REST API for secure table operations

## Architecture

```
azure-table-viewer/
├── api/                          # Backend (Deno + Oak)
│   ├── main.ts                  # API Server & Routes
│   └── services/
│       └── azureTableService.ts # Azure Table Storage Integration
├── app/                         # Frontend (React + Vite)
│   ├── App.tsx                  # Main App Component
│   ├── components/              # React Components
│   │   ├── ConnectionForm.tsx   # Connection String Input
│   │   ├── TableSelector.tsx    # Table Selection
│   │   └── TableViewer.tsx      # Entity Data Display
│   └── services/
│       └── apiClient.ts         # HTTP Client for Backend
└── deno.json                    # Project Configuration
```

## Tech Stack

- **Backend**: Deno, Oak (TypeScript)
- **Frontend**: React 19, Vite, Tailwind CSS
- **Azure**: @azure/data-tables@13.3.2
- **Runtime**: Deno 2.x

## Installation & Setup

### Prerequisites
- [Deno 2.x](https://deno.land) installed
- Azure Storage Account with connection string

### Step 1: Install Dependencies

```bash
deno cache deno.json
```

### Step 2: Start Dev Servers

```bash
deno task dev
```

This starts both servers in parallel:
- **Frontend**: http://localhost:15173 (Vite)
- **Backend**: http://localhost:8000 (Oak)

## Usage

1. **Open App**: Navigate to http://localhost:15173
2. **Enter Connection**: Paste your Azure Storage connection string
3. **Select Table**: View available tables from your account
4. **Browse Data**: Search and explore entities in the selected table

## API Endpoints

### POST `/api/azure/validate`
Validates a connection string

```json
{
  "connectionString": "DefaultEndpointsProtocol=https;..."
}
```

### POST `/api/azure/tables`
Lists all tables

```json
{
  "connectionString": "DefaultEndpointsProtocol=https;..."
}
```

**Response:**
```json
{
  "tables": ["Users", "Orders", "Products"]
}
```

### POST `/api/azure/table/:name`
Loads all entities from a table

```json
{
  "connectionString": "DefaultEndpointsProtocol=https;..."
}
```

**Response:**
```json
{
  "entities": [
    {
      "partitionKey": "pk1",
      "rowKey": "rk1",
      "timestamp": "2025-12-14T10:00:00Z",
      "customField": "value"
    }
  ]
}
```

## Build & Deployment

### Production Build

```bash
deno task build
```

Generates optimized files in `dist/`

### Start Server

```bash
deno task serve
```

## Development

### Available Tasks

```bash
deno task dev         # Start Dev Servers
deno task build       # Production Build
deno task serve       # Start Server with Build
```

### Structure

- **app/**: React Frontend - components, services, styling
- **api/**: Deno/Oak Backend - routes, business logic
- **app/types/**: Shared TypeScript types

## Security

⚠️ **Note**: The current implementation stores the connection string in browser LocalStorage. For production, use:
- Session-based authentication
- Server-side credential management
- OAuth/MSAL for Azure

## Error Handling

The application handles the following errors:
- ❌ Invalid connection strings
- ❌ Network errors during API calls
- ❌ Azure Storage authentication errors
- ❌ Timeouts on long queries

## Performance

- **Frontend**: Vite Dev Server with Hot Module Reloading
- **Backend**: Entity data streaming for large tables
- **Caching**: Browser cache for static assets

## License

MIT

## Support

For questions or issues: [GitHub Issues](https://github.com/svengrav/azure-table-viewer/issues)
