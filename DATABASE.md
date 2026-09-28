# DATA STORAGE & RECORD MANAGEMENT SPECIFICATION

This document outlines the data storage strategy, log record schemas, lifecycle management, and in-memory execution structures for **LogQL — Compiler-Based Log Query & Optimization Engine**.

---

## 1. Storage Strategy & Architectural Decision

### 1.1 Decision: No Traditional External Database Required
For this Compiler Design mini project, **an external RDBMS (PostgreSQL, MySQL) or NoSQL engine (MongoDB, Elasticsearch) is intentionally NOT used**.

### 1.2 Rationale:
1. **Academic Alignment**: The primary focus is demonstrating **compiler front-end, optimization, and query execution pipelines**. Introducing a traditional SQL database would obscure the compiler's role, as one could be tempted to simply forward queries to the database rather than parsing, optimizing, and executing them natively.
2. **Zero-Setup Portability**: The project can be cloned and run immediately without installing or running background database daemons, configuring connection pools, or managing credentials.
3. **Execution Model**: Query engines for logs typically scan sequential immutable append-only files. An in-memory columnar or row-oriented record array is ideal for demonstrating Volcano-style operators (`Scan`, `Filter`, `Aggregate`, `Project`).
4. **Lightweight Metadata**: For optional features like query history or saved presets, a local file-based store (or embedded SQLite if needed) is sufficient.

---

## 2. Log Data Lifecycle

```text
  [ Raw Log File ] (.log / .jsonl / .txt)
         │
         ▼
  [ Ingestion & Normalizer Subsystem ]
  • Regex Pattern Matcher (CLF / Syslog)
  • JSON Deserializer (JSON Lines)
         │
         ▼
  [ In-Memory Normalized Record Store ]
  • Vector of Typed Structs (`std::vector<LogRecord>`)
         │
         ▼
  [ Compiler & Execution Engine Pipeline ]
  • Filtered, Projected, and Aggregated in RAM
         │
         ▼
  [ Query Output Results (JSON Array) ]
```

---

## 3. Normalized Log Record Schema

All ingested logs are parsed and mapped to a canonical, typed in-memory record structure:

### 3.1 Field Definitions

| Field Name | Data Type | Nullable | Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `timestamp` | `STRING` (ISO-8601) | No | `"2026-09-28T10:15:30Z"` | Event timestamp |
| `service` | `STRING` | No | `"auth-service"` | Originating service or daemon name |
| `level` | `STRING` | No | `"ERROR"`, `"INFO"`, `"WARN"` | Log severity level |
| `status` | `INTEGER` | Yes | `500`, `200`, `404` | HTTP response code or process exit code |
| `response_time` | `FLOAT` | Yes | `142.5` | Request duration in milliseconds |
| `path` | `STRING` | Yes | `"/api/v1/login"` | Request URI or resource identifier |
| `ip` | `STRING` | Yes | `"192.168.1.45"` | Client IP address |
| `message` | `STRING` | No | `"Database connection timeout"` | Log event payload message |

### 3.2 C++ In-Memory Representation (`log_record.hpp`)
```cpp
struct LogRecord {
    std::string timestamp;
    std::string service;
    std::string level;
    int32_t status;
    double response_time;
    std::string path;
    std::string ip;
    std::string message;

    // Fast field accessor by string name (used by Filter & Project operators)
    FieldValue getField(const std::string& fieldName) const;
};
```

---

## 4. Supported Log Ingestion Formats

### 4.1 JSON Lines (`.jsonl`)
Each line contains an independent JSON object:
```json
{"timestamp": "2026-09-28T10:15:30Z", "service": "auth-service", "level": "ERROR", "status": 500, "response_time": 142.5, "path": "/api/v1/login", "ip": "192.168.1.45", "message": "Database connection timeout"}
{"timestamp": "2026-09-28T10:15:31Z", "service": "payment-api", "level": "INFO", "status": 200, "response_time": 45.2, "path": "/api/v1/charge", "ip": "192.168.1.88", "message": "Charge successful"}
```

### 4.2 Standard Combined Log Format (Nginx / Apache CLF)
Standard regex matching for web server logs:
```text
192.168.1.45 - - [28/Sep/2026:10:15:30 +0000] "POST /api/v1/login HTTP/1.1" 500 142 "auth-service" "Database connection timeout"
```
**Parsing Pattern**:
`^(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) \S+" (\d{3}) (\d+) "(.*?)" "(.*?)"$`

### 4.3 Standard Syslog (RFC 3164)
```text
Sep 28 10:15:30 server01 auth-service[1245]: ERROR [500] Database connection timeout
```

---

## 5. Sample & Seed Datasets

The repository includes pre-built realistic sample logs in `sample-logs/`:
1. `sample-logs/web_access.log`: ~1,000 Nginx web server access logs with various HTTP statuses (`200`, `301`, `400`, `404`, `500`, `503`) and response times.
2. `sample-logs/app_events.jsonl`: ~1,000 JSON application log entries across multiple microservice names (`auth-service`, `payment-api`, `user-service`, `gateway`).
3. `sample-logs/system.log`: Standard operating system daemon logs.

---

## 6. Optional Query History & Saved Presets

If query history or saved query presets are displayed in the frontend:
* **Default Implementation**: Stored directly in browser `localStorage` or served from a lightweight static JSON file (`backend/app/data/saved_queries.json`).
* **Optional Embedded SQLite**: If persistent backend-level query history is desired, a single lightweight file `backend/app/data/history.db` containing a single table `queries (id, query_text, executed_at, duration_ms, row_count)` can be used.
