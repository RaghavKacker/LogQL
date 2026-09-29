from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
import uuid
from pathlib import Path
from ..models.api_models import DatasetInfo
from ..services.log_ingestion import LogIngestionService
from ..config import UPLOAD_DIR

router = APIRouter(prefix="/api/datasets", tags=["Datasets"])

@router.get("", response_model=List[DatasetInfo])
def list_datasets():
    return LogIngestionService.get_datasets()

@router.post("/upload")
async def upload_dataset(
    file: Optional[UploadFile] = File(None),
    rawText: Optional[str] = Form(None)
):
    dataset_id = f"custom_{uuid.uuid4().hex[:8]}"
    dest_path = Path(UPLOAD_DIR) / f"{dataset_id}.log"

    line_count = 0
    if file:
        contents = await file.read()
        text = contents.decode("utf-8", errors="ignore")
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(text)
        line_count = len([line for line in text.splitlines() if line.strip()])
    elif rawText:
        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(rawText)
        line_count = len([line for line in rawText.splitlines() if line.strip()])
    else:
        raise HTTPException(status_code=400, detail="Either file or rawText must be provided.")

    return {
        "success": True,
        "datasetId": dataset_id,
        "name": f"Custom Upload ({dataset_id})",
        "recordCount": line_count,
        "path": str(dest_path)
    }
