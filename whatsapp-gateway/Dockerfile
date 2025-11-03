# 1. Usa una imagen base oficial de Node.js
FROM node:20-slim

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copia los archivos de definición de paquetes e instala dependencias
# La ruta es relativa al contexto de compilación (whatsapp-gateway)
COPY package*.json ./
RUN npm install --omit=dev

# 4. Copia el resto de los archivos de la aplicación
# La ruta es relativa al contexto de compilación (whatsapp-gateway)
COPY . .

# 5. Expone el puerto que la aplicación usará
EXPOSE 8080

# 6. El comando para iniciar la aplicación
CMD ["node", "index.js"]
