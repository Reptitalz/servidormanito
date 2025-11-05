# 1. Imagen base ligera de Node.js
FROM node:20

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copiar los archivos de dependencias
COPY package*.json ./

# 4. Instalar dependencias sin las de desarrollo
RUN npm ci --omit=dev

# 5. Copiar el resto del código fuente
COPY . .

# 6. Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080
ENV NEXTJS_APP_URL=https://studio--studio-1128284178-7d125.us-central1.hosted.app

# 7. Exponer el puerto (Cloud Run requiere el 8080)
EXPOSE 8080

# 8. Comando para iniciar el servidor
CMD ["node", "index.js"]
