# ---- Build Stage ----
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 优先复制依赖文件以利用 Docker 缓存层
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# 安装依赖 (优先尝试 npm，如果存在其他锁文件环境也会走默认安装)
RUN npm install

# 复制代码源文件
COPY . .

# 执行打包构建
RUN npm run build


# ---- Production Stage ----
FROM nginx:alpine

# 清理默认主页
RUN rm -rf /usr/share/nginx/html/*

# 从构建阶段复制打包好的静态文件到 Nginx 的 /text2pic 目录，与 Vite 的 base 保持一致
COPY --from=builder /app/dist /usr/share/nginx/html/text2pic

# 写入一个简单的根目录重定向，防止直接访问 / 出现 403 或 404，而是自动跳转至 /text2pic/
RUN echo '<meta http-equiv="refresh" content="0;url=/text2pic/" />' > /usr/share/nginx/html/index.html

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
