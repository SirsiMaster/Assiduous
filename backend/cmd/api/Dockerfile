# Build stage
FROM golang:1.21 AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./cmd/api

# Runtime stage
FROM gcr.io/distroless/base-debian12

ENV PORT=8080
EXPOSE 8080

COPY --from=builder /bin/api /api

ENTRYPOINT ["/api"]
