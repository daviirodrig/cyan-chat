FROM node:18-alpine AS build

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

FROM golang:1.22-alpine AS build-server

WORKDIR /app

COPY . .

RUN go build -o server .

FROM alpine:latest AS runner

COPY --from=build /app/dist /app/dist
COPY --from=build-server /app/server /app/server
COPY --from=build /app/login.html /app/login.html
COPY --from=build /app/admin.html /app/admin.html

EXPOSE 3000

WORKDIR /app

CMD ["./server", ":3000"]