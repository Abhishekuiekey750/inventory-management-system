# Stage 1: Build static assets
FROM node:20-slim AS builder

WORKDIR /app

# Copy package configurations
COPY package*.json ./

# Install npm packages
RUN npm install

# Copy application source code
COPY . .

# Run production build
RUN npm run build

# Stage 2: Serve static files with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration block
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Run Nginx server
CMD ["nginx", "-g", "daemon off;"]
