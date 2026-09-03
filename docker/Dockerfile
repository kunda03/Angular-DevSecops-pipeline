# ============================================================
# STAGE 1: Build Angular Application
# ============================================================

FROM node:20-alpine AS build

# Working directory inside the container
WORKDIR /app

# Copy package files first
# This allows Docker to cache npm dependencies
COPY package*.json ./

# Install exact dependencies from package-lock.json
RUN npm ci

# Copy the complete Angular source code
COPY . .

# Build Angular application
RUN npm run build


# ============================================================
# STAGE 2: Serve Angular Application using Nginx
# ============================================================

# ============================================================
# STAGE 2: Serve Angular Application using Nginx
# ============================================================

FROM nginx:alpine

# Remove Nginx default page
RUN rm -rf /usr/share/nginx/html/*

# Copy Angular production build
COPY --from=build \
    /app/dist/CoursePerformanceDashboard/browser \
    /usr/share/nginx/html

# Copy custom Nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Angular application will be served on HTTP port 80
EXPOSE 80

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]