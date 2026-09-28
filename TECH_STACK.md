# TECH STACK SPECIFICATION

This document defines the technology stack, programming languages, build tools, libraries, and justification for each selection in **LogQL — Compiler-Based Log Query & Optimization Engine**.

---

## 1. Core Technology Selection Matrix

| Subsystem | Technology | Primary Role / Purpose | Justification |
| :--- | :--- | :--- | :--- |
| **Lexical Analyzer** | **Flex (Fast Lexical Analyzer)** | Tokenizing LogQL query source text | Industry & academic standard for generating high-performance deterministic finite automaton (DFA) state-machine tokenizers. |
| **Syntax Analyzer** | **Bison / YACC** | Parsing token stream into Abstract Syntax Trees | Academic standard LALR(1) parser generator; enforces strict Context-Free Grammar definitions and unambiguous operator precedence. |
| **Compiler & Core Engine** | **C++ (C++17 standard)** | AST representation, semantic validation, optimizer, execution engine | Provides type safety, memory layout control, object-oriented AST modeling, and fast in-memory query execution. |
| **Build Toolchain** | **GCC / G++ & GNU Make** | Compiling Lex/Yacc and C++ sources into native executable | Universal availability on Linux/macOS and Windows (via MinGW-w64 / MSYS2 / WSL). |
| **Backend API** | **Python 3.10+ & FastAPI** | Orchestration layer, log parsing, compiler subprocess bridge | High-productivity async web framework with automatic OpenAPI documentation and fast JSON serialization via Pydantic. |
| **API Server Runner** | **Uvicorn** | ASGI server for running FastAPI backend | Lightweight, standard Python ASGI server. |
| **Frontend Framework**| **Next.js 14+ / React 18+** | Interactive developer studio user interface | Modern React framework offering clean component architecture, fast state updates, and TypeScript support. |
| **Language & Typing** | **TypeScript** | Static typing for frontend components and API contracts | Prevents runtime schema mismatch errors between backend JSON payloads and UI state. |
| **Styling & Theme** | **Tailwind CSS** | Styling modern developer dark-mode interface | Utility-first CSS providing a clean, developer-tool aesthetic (inspired by VS Code, Datadog, Grafana). |
| **UI Enhancements** | **Lucide React & Recharts** | Icons & log analytics chart visualizations | Clean minimalist icon set and lightweight declarative charting for rendering query metrics. |

---

## 2. Deep Dive: Component Justifications & Trade-offs

### 2.1 Compiler Core: Flex + Bison + C++17
* **Why not Python `sqlparse` or JavaScript regex?**
  * The central academic objective of this mini project is to demonstrate **Compiler Design principles**. Using high-level third-party SQL parsing libraries would defeat the educational purpose. Flex and Bison provide explicit `.l` and `.y` grammar files that directly map to syllabus topics (DFAs, CFGs, Shift-Reduce parsing).
* **Why C++17 over pure C?**
  * While Flex/Bison generate C-compatible code, C++17 provides `std::unique_ptr` (clean memory management for AST nodes), `std::string_view`, `std::unordered_map` (for hash-based grouping in the execution engine), and `std::variant`, which drastically simplifies writing clean AST visitors, semantic checks, and optimizer passes.

### 2.2 Backend Service: Python & FastAPI
* **Why FastAPI?**
  * FastAPI provides built-in Pydantic schema validation for API request/response models (`CompileRequest`, `CompileResponse`, `ExecuteResponse`).
  * It can seamlessly invoke the compiled C++ binary via standard subprocess pipes or shared libraries (`ctypes`), parsing the compiler's structured JSON diagnostics.
* **Why not an all-in-one C++ web server (e.g., Crow/Civetweb)?**
  * A C++ HTTP server adds unnecessary boilerplate for static file handling and JSON serialization. Python acts as a clean bridge while keeping the compiler core strictly focused on compilation and execution algorithms.

### 2.3 Frontend: Next.js + React + Tailwind CSS
* **Why a Web UI for a Compiler Project?**
  * A command-line compiler is vital, but a web-based studio allows evaluators and students to visually inspect tokens, expand AST tree branches, compare optimizer passes side-by-side, and view query execution charts in real-time.
* **Why avoid heavy full-stack database dependencies?**
  * LogQL is designed to be lightweight and runnable instantly without setting up local background services or database containers.

---

## 3. Libraries & Dependencies Summary

### Compiler Toolchain
* `flex` (v2.6.x)
* `bison` (v3.8.x)
* `g++` (supports `-std=c++17`)
* `make` (GNU Make 4.x)
* `nlohmann/json` (single-header C++ library for AST JSON serialization)

### Backend Dependencies (`requirements.txt`)
```text
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
pydantic>=2.6.0
python-multipart>=0.0.9
```

### Frontend Dependencies (`package.json`)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.1.0",
    "lucide-react": "^0.330.0",
    "recharts": "^2.12.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  },
  "devDependencies": {
    "typescript": "^5.3.3",
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.35",
    "autoprefixer": "^10.4.17"
  }
}
```

---

## 4. Development & Runtime Environment Requirements

To build and run LogQL on local development environments:

### Windows:
* **Option A (Recommended)**: MSYS2 / MinGW-w64 (`pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-flex mingw-w64-x86_64-bison make`).
* **Option B**: Windows Subsystem for Linux (WSL2 with Ubuntu: `sudo apt install build-essential flex bison`).
* **Python**: Python 3.10 or higher.
* **Node.js**: Node.js v18.x or v20.x (LTS) with npm.

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install -y build-essential flex bison python3 python3-pip nodejs npm
```

### macOS (Homebrew):
```bash
brew install flex bison gcc make python@3.11 node
```
