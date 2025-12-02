#!/bin/bash

# Azure Static Web App Deployment Script
# Voraussetzungen: Azure CLI installiert und eingeloggt (az login)

set -e

# .env Datei laden (mit Windows CRLF Bereinigung)
if [ -f .env ]; then
  export $(grep -v '^#' .env | tr -d '\r' | xargs)
fi

# Prüfen ob Variablen gesetzt sind
if [ -z "$SUBSCRIPTION_ID" ] || [ -z "$RESOURCE_GROUP" ] || [ -z "$APP_NAME" ] || [ -z "$LOCATION" ]; then
  echo "Fehler: SUBSCRIPTION_ID, RESOURCE_GROUP, APP_NAME und LOCATION müssen in .env gesetzt sein"
  exit 1
fi

# Azure Subscription setzen
echo "Setting Azure subscription..."
az account set --subscription "$SUBSCRIPTION_ID"

echo "=== Azure Table Viewer Deployment ==="
echo "Subscription: $SUBSCRIPTION_ID"
echo "Resource Group: $RESOURCE_GROUP"
echo "App Name: $APP_NAME"
echo "Location: $LOCATION"
echo ""

# 1. Build
echo "[1/4] Building app..."
npm ci
npm run build

# 2. Resource Group erstellen (falls nicht vorhanden)
echo "[2/4] Creating resource group (if not exists)..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" --output none 2>/dev/null || true

# 3. Static Web App erstellen (falls nicht vorhanden)
echo "[3/4] Creating Static Web App (if not exists)..."
az staticwebapp create \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --sku Free \
  --output none 2>/dev/null || echo "Static Web App already exists, continuing..."

# 4. Deployment Token holen und deployen
echo "[4/4] Deploying to Azure..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "properties.apiKey" \
  --output tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
  echo "Fehler: Konnte Deployment Token nicht abrufen"
  echo "Versuche manuell: az staticwebapp secrets list --name $APP_NAME --resource-group $RESOURCE_GROUP"
  exit 1
fi

# SWA CLI für Deployment nutzen
npx @azure/static-web-apps-cli deploy ./dist \
  --deployment-token "$DEPLOYMENT_TOKEN" \
  --env production

# URL ausgeben
APP_URL=$(az staticwebapp show \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --query "defaultHostname" -o tsv)

echo ""
echo "=== Deployment erfolgreich ==="
echo "URL: https://$APP_URL"
