# Go Backend Reference

This is a Go implementation of the productivity app backend using the **Gin** framework and **SQLite**.

## Prerequisites

- [Go](https://golang.org/doc/install) installed on your machine.
- SQLite development headers (usually pre-installed on macOS/Linux).

## Setup

1. Initialize the Go module:
   ```bash
   go mod init productivity-app
   ```

2. Install dependencies:
   ```bash
   go get github.com/gin-gonic/gin
   go get github.com/mattn/go-sqlite3
   ```

3. Run the server:
   ```bash
   go run main.go
   ```

The server will start on `http://localhost:3000`.

## Features Implemented

- **Authentication**: Signup and Login with SQLite.
- **Task Management**: CRUD operations for tasks with user isolation.
- **Chat History**: Persistent storage for AI Architect conversations.
- **Multi-user Isolation**: All data is filtered by `user_id`.

## Note on Frontend Integration

To use this with your React frontend, ensure your frontend API calls point to the Go server's address. If you are running both locally, you may need to handle CORS or use a proxy.
