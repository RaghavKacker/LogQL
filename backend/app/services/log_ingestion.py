import os
from pathlib import Path
from typing import List, Dict, Optional
from ..config import SAMPLE_LOGS_DIR, UPLOAD_DIR
from ..models.api_models import DatasetInfo

DATASETS_METADATA = {
    "app_events": {
        "id": "app_events",
        "name": "Microservice Application Logs",
        "format": "JSON Lines (.jsonl)",
        "file": "app_events.jsonl"
    },
    "web_access": {
        "id": "web_access",
        "name": "Nginx / Apache Web Access Logs",
        "format": "Combined Log Format (CLF)",
        "file": "web_access.log"
    },
    "system": {
        "id": "system",
        "name": "Operating System Daemons",
        "format": "Syslog (RFC 3164)",
        "file": "system.log"
    }
}

class LogIngestionService:
    @staticmethod
    def get_datasets() -> List[DatasetInfo]:
        datasets: List[DatasetInfo] = []
        sample_dir = Path(SAMPLE_LOGS_DIR)

        for key, meta in DATASETS_METADATA.items():
            fpath = sample_dir / meta["file"]
            count = 0
            if fpath.exists():
                try:
                    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                        count = sum(1 for line in f if line.strip())
                except Exception:
                    count = 1000

            datasets.append(DatasetInfo(
                id=meta["id"],
                name=meta["name"],
                format=meta["format"],
                recordCount=count,
                path=str(fpath)
            ))

        # Also list custom uploads
        upload_path = Path(UPLOAD_DIR)
        if upload_path.exists():
            for uf in upload_path.glob("*.log"):
                try:
                    with open(uf, "r", encoding="utf-8", errors="ignore") as f:
                        count = sum(1 for line in f if line.strip())
                except Exception:
                    count = 0
                datasets.append(DatasetInfo(
                    id=uf.stem,
                    name=f"Custom Upload ({uf.name})",
                    format="Custom Log File",
                    recordCount=count,
                    path=str(uf)
                ))

        return datasets

    @staticmethod
    def resolve_dataset_path(dataset_id: str) -> Optional[str]:
        if dataset_id in DATASETS_METADATA:
            p = Path(SAMPLE_LOGS_DIR) / DATASETS_METADATA[dataset_id]["file"]
            if p.exists():
                return str(p)

        # Check uploads
        custom_file = Path(UPLOAD_DIR) / f"{dataset_id}.log"
        if custom_file.exists():
            return str(custom_file)

        # Fallback to app_events.jsonl
        default_file = Path(SAMPLE_LOGS_DIR) / "app_events.jsonl"
        if default_file.exists():
            return str(default_file)

        return None
