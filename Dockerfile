# Azure Table Viewer - Multi-stage build
# Stage 1: Build Frontend (React + Vite)
FROM denoland/deno:2.3.3 AS frontend-builder
WORKDIR /build

COPY deno.json deno.lock* ./
RUN deno cache deno.json

COPY . .
RUN deno run -A npm:vite build

# Stage 2: Final Image with API + Frontend
FROM denoland/deno:2.3.3

WORKDIR /app

# Copy deno files
COPY deno.json deno.lock* ./
RUN deno cache deno.json

# Copy source code
COPY . .

# Copy built frontend from previous stage
COPY --from=frontend-builder /build/dist ./dist

# Expose ports
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno eval "fetch('http://localhost:8000/api/tables').catch(() => Deno.exit(1))"

# Run API server (serves frontend static files + API)
CMD ["deno", "run", "-A", "api/main.ts"]
