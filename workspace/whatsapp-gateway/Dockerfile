# 1. Usa una imagen base de Node.js
FROM node:20-slim

# 2. Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app

# 3. Copia los archivos de dependencias
COPY package*.json ./

# 4. Instala git (necesario para dependencias de npm que vienen de GitHub) y luego las dependencias de npm
RUN apt-get update && apt-get install -y git && npm install

# 5. Copia el resto del código de la aplicación
COPY . .

# 6. Expone el puerto que usará la aplicación
EXPOSE 8080

# 7. El comando para iniciar la aplicación
CMD ["node", "index.js"]
