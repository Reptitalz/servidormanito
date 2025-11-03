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

# 7. Comando de inicio
CMD ["node", "index.js"]
