# Build stage
FROM golang:1.25.5 AS builder

WORKDIR /app

# Build context is the backend root. Copy go module files and download deps.
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire backend source tree so that module import paths resolve
COPY . ./

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /bin/api ./cmd/api

# Runtime stage
FROM gcr.io/distroless/base-debian12

ENV PORT=8080
EXPOSE 8080

COPY --from=builder /bin/api /api

ENTRYPOINT ["/api"]
