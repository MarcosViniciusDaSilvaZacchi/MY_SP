FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
# sqlite3 é nativo: as ferramentas de build ficam só durante a instalação (caso não haja binário pronto para Alpine)
RUN apk add --no-cache --virtual .build-deps python3 make g++   && npm install --omit=dev   && apk del .build-deps
# Pasta dos bancos SQLite (montada como volume no docker-compose)
RUN mkdir -p /app/data
COPY . .
EXPOSE 3006
CMD ["node", "src/app.js"]
