# 1. Usa una imagen base oficial de Node.js
FROM node:20-slim

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copia los archivos desde la subcarpeta
COPY whatsapp-gateway/package*.json ./
RUN npm install --omit=dev

# 4. Copia el resto del código
COPY whatsapp-gateway/ ./

# 5. Expone el puerto
EXPOSE 8080

# 6. Comando de inicio
CMD ["node", "index.js"]
