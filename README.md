# Azure Table Viewer

A web app for viewing and editing Azure Table Storage data.

## Features

- **Connect** via Azure Storage Connection String
- **List and select** tables
- **View data** with sortable columns
- **OData filter** for server-side filtering
- **Edit & delete** entries
- **Auto-detection** of JSON, CSV, and Unix timestamps

## Prerequisites

- Node.js 18+
- Azure Storage Account with Table Storage
- CORS configured in Azure Storage (for browser access)

## Local Development

```bash
# Install dependencies
npm install

# Start development server (port 15173)
npm run dev

# Create production build
npm run build
```

## Deployment (Azure Static Web Apps)

### 1. Configuration

Create a `.env` file:

```env
SUBSCRIPTION_ID=your-azure-subscription-id
RESOURCE_GROUP=your-resource-group
APP_NAME=azure-table-viewer
LOCATION=westeurope
```

### 2. Prerequisites

- Azure CLI installed (`az --version`)
- Logged in (`az login`)
- SWA CLI installed (`npm install -g @azure/static-web-apps-cli`)

### 3. Deploy

```bash
./deploy.sh
```

## Tech Stack

- React 19 + TypeScript
- Vite (Rolldown)
- Tailwind CSS v4
- Azure Data Tables SDK
- Heroicons
