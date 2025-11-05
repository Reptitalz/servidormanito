# Imagen base de Node.js (slim es más ligera)
FROM node:20-slim

# Baileys requiere algunas dependencias de compilación y git
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    git \
    && rm -rf /var/lib/apt/lists/*

# Carpeta de trabajo
WORKDIR /usr/src/app

# Copiar dependencias e instalarlas
# Copiamos package-lock.json para asegurar una instalación consistente
COPY package*.json ./
RUN npm install --omit=dev

# Copiar el resto del código de la aplicación
COPY . .

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto para Cloud Run
EXPOSE 8080

# Comando de arranque
CMD ["node", "index.js"]
