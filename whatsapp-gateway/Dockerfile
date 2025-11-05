# Imagen base ligera con Node.js
FROM node:20-slim

# Instalar git (necesario para algunas dependencias npm) y otras herramientas.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Establecer directorio de trabajo
WORKDIR /usr/src/app

# Copiar package.json y lockfile primero para aprovechar el caché de Docker
COPY package*.json ./

# Instalar dependencias de producción
RUN npm install --omit=dev

# Copiar el resto del código fuente
COPY . .

# Variables de entorno (pueden ser sobreescritas por Cloud Run)
ENV NODE_ENV=production
ENV PORT=8080

# Exponer el puerto para Cloud Run
EXPOSE 8080

# Comando para iniciar la aplicación
CMD ["node", "index.js"]
