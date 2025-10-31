# Usa una imagen base de Node.js ligera y optimizada
FROM node:18-slim

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# Copia los archivos de definición de dependencias
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# Copia el resto del código de la aplicación
COPY . .

# Expone el puerto que usará la aplicación (si aplica, aunque Baileys no expone un puerto HTTP)
# EXPOSE 8080

# Comando para ejecutar la aplicación cuando el contenedor inicie
CMD [ "npm", "start" ]
