FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM golang:1.22-alpine AS build-server

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
RUN go build -o server .

FROM python:3.12-alpine AS runner

COPY --from=build /app/dist /app/dist
COPY --from=build-server /app/server /app/server
COPY --from=build /app/login.html /app/login.html
COPY --from=build /app/admin.html /app/admin.html

RUN pip install edge-tts

EXPOSE 3000

WORKDIR /app

CMD ["./server", ":3000"]