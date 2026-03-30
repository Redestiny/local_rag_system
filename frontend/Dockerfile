# 前端容器构建文件 (Next.js)

# ---- 第一阶段：安装依赖 ----
FROM node:20-alpine AS deps

# 设置工作目录
WORKDIR /app

# 复制依赖清单到容器里
COPY package.json package-lock.json* ./

# 安装依赖（如果没有 lock 文件则用 npm install）
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ---- 第二阶段：构建项目 ----
FROM node:20-alpine AS builder

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 从上一阶段复制 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制所有源代码
COPY . .

# 构建 Next.js 项目
RUN npm run build

# ---- 第三阶段：运行 ----
FROM node:20-alpine AS runner

WORKDIR /app
ARG NEXT_PUBLIC_API_URL=http://localhost:8000

# 设置为生产环境
ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# 从构建阶段复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 暴露端口
EXPOSE 3000

# 设置开机启动命令
CMD ["node", "server.js"]
