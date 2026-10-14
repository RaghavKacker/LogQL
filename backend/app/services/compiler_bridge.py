import subprocess
import json
import os
from typing import Dict, Any, Optional
from ..config import COMPILER_CLI_PATH, BASE_DIR

class CompilerBridge:
    @staticmethod
    def run_compiler(query: str, dataset_path: Optional[str] = None, execute: bool = False) -> Dict[str, Any]:
        if not os.path.exists(COMPILER_CLI_PATH):
            return {
                "success": False,
                "stage": "Environment",
                "error": f"Compiler CLI binary not found at '{COMPILER_CLI_PATH}'. Please build it using 'cd compiler && make'."
            }

        cmd = [COMPILER_CLI_PATH, "--query", query, "--json"]
        if execute and dataset_path and os.path.exists(dataset_path):
            cmd.extend(["--dataset", dataset_path, "--execute"])

        # Ensure environment PATH has compiler dependencies if on Windows
        env = os.environ.copy()
        if os.name == "nt":
            local_bin = str(BASE_DIR / "w64devkit" / "bin")
            tools_bin = str(BASE_DIR / "tools" / "winflexbison")
            extra_paths = [p for p in [local_bin, tools_bin] if os.path.exists(p)]
            if extra_paths:
                env["PATH"] = ";".join(extra_paths) + ";" + env.get("PATH", "")

        try:
            process = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10,
                env=env
            )
            stdout = process.stdout.strip()

            if stdout:
                try:
                    return json.loads(stdout)
                except json.JSONDecodeError:
                    return {
                        "success": False,
                        "stage": "Bridge",
                        "error": f"Failed to parse compiler JSON output: {stdout[:500]}",
                        "stderr": process.stderr
                    }

            if process.returncode != 0:
                return {
                    "success": False,
                    "stage": "Process",
                    "error": process.stderr.strip() or f"Compiler process exited with code {process.returncode}"
                }

            return {
                "success": False,
                "stage": "Bridge",
                "error": "Compiler emitted empty output."
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "stage": "Execution",
                "error": "Query execution timed out after 10 seconds."
            }
        except Exception as e:
            return {
                "success": False,
                "stage": "System",
                "error": f"Subprocess invocation error: {str(e)}"
            }
