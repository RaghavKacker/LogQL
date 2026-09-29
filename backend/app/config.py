import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Compiler CLI binary path
COMPILER_CLI_NAME = "logql_cli.exe" if os.name == "nt" else "logql_cli"
COMPILER_CLI_PATH = os.getenv("COMPILER_CLI_PATH", str(BASE_DIR / "compiler" / "build" / COMPILER_CLI_NAME))

# Sample logs directory
SAMPLE_LOGS_DIR = os.getenv("SAMPLE_LOGS_DIR", str(BASE_DIR / "sample-logs"))

# Temp uploads directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", str(BASE_DIR / "backend" / "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
