# Development image: runs the Vite dev server (hot reload). A production build stage comes later.
FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]
