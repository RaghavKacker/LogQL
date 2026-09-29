from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import query, datasets

app = FastAPI(
    title="LogQL Compiler API",
    description="Backend API service connecting LogQL Flex/Bison compiler and execution engine with developer studio",
    version="1.0.0"
)

# Enable CORS for local Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router)
app.include_router(datasets.router)

@app.get("/")
def root():
    return {
        "system": "LogQL Compiler & Optimization Engine API",
        "status": "online",
        "docs": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}
