# 1. Imagen base de Node.js con Git
FROM node:20

# 2. Directorio de trabajo
WORKDIR /usr/src/app

# 3. Copiar archivos de dependencias
COPY package*.json ./

# 4. Instalar dependencias
RUN npm install --omit=dev

# 5. Copiar el resto del código
COPY . .

# 6. Exponer el puerto
EXPOSE 8080

# 6.1. Definir URL de tu app Next.js
ENV NEXTJS_APP_URL=https://studio--studio-1128284178-7d125.us-central1.hosted.app

# 7. Comando de inicio
CMD ["node", "index.js"]
