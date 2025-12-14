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
4. **Browse & Filter Data**: Search or filter entities using Quick Search or OData syntax

### Filtering Data

The app supports two filtering modes:

#### Quick Search (Client-Side)
- Simple text search across all columns
- Case-insensitive
- Instant results
- No server round-trip

#### OData Filter (Server-Side)
- Full OData v4 filter syntax support
- Powerful, SQL-like filtering
- Server-executed for better performance
- Syntax examples:

```odata
# Exact match
partitionKey eq 'User1'

# Startswith
startswith(email, 'admin')

# Comparison
timestamp gt datetime'2024-01-01T00:00:00Z'

# And/Or combinations
partitionKey eq 'User1' and status eq 'Active'

# Substring
substringof('search', Name)

# Numeric comparison
age ge 18 and age le 65
```

For complete OData syntax documentation, see [Microsoft OData Docs](https://docs.microsoft.com/en-us/rest/api/storageservices/querying-tables-and-entities)

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

⚠️ **Important**: This application handles Azure Storage credentials and should be **self-hosted only**. Never deploy to a public server or share access with untrusted users.

### Security Considerations

- Connection strings contain sensitive credentials (account name and key)
- The current implementation stores credentials in browser LocalStorage
- API endpoints accept connection strings in request bodies
- No authentication/authorization layer implemented

### Self-Hosting Requirements

- Deploy on a **private/internal network only**
- Restrict access via firewall rules
- Use HTTPS in production
- Implement proper authentication before production use

### For Production Use, Consider:
- Session-based authentication instead of raw credentials
- Server-side credential management (environment variables, Key Vault)
- OAuth/MSAL for Azure authentication
- Rate limiting and request validation
- Audit logging for data access

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
