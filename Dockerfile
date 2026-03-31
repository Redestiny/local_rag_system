FROM python:3.10-slim AS backend-builder

WORKDIR /build/backend

ARG TORCH_PACKAGE=torch
ARG TORCH_INDEX_URL=https://download.pytorch.org/whl/cpu

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_NO_CACHE_DIR=1

COPY backend/requirements.txt ./

# The app runs as a regular CPU container in compose, so we preinstall the
# CPU-only PyTorch wheel to avoid pulling in multi-GB CUDA runtime packages.
RUN pip install --upgrade pip && \
    pip install --index-url ${TORCH_INDEX_URL} ${TORCH_PACKAGE} && \
    pip install -r requirements.txt && \
    find /opt/venv -type d -name "__pycache__" -prune -exec rm -rf '{}' + && \
    find /opt/venv -type f \( -name "*.pyc" -o -name "*.pyo" \) -delete


FROM node:20-alpine AS frontend-deps

WORKDIR /build/frontend

COPY frontend/package.json frontend/package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi


FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend

ARG NEXT_PUBLIC_API_URL=/
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=frontend-deps /build/frontend/node_modules ./node_modules
COPY frontend/ ./

RUN npm run build


FROM node:20-bookworm-slim AS node-runtime


FROM python:3.10-slim AS runner

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/

ENV PATH="/opt/venv/bin:$PATH" \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    PORT=10113 \
    HOSTNAME=0.0.0.0

RUN apt-get update && \
    apt-get install -y --no-install-recommends bash ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY --from=backend-builder /opt/venv /opt/venv
COPY backend ./backend
COPY --from=frontend-builder /build/frontend/.next/standalone ./frontend
COPY --from=frontend-builder /build/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /build/frontend/public ./frontend/public
COPY start.sh ./start.sh

EXPOSE 10113

CMD ["/bin/bash", "/app/start.sh"]
