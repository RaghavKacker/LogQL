from fastapi import APIRouter, HTTPException
from ..models.api_models import CompileRequest, CompileResponse, ExecuteRequest, ExecuteResponse
from ..services.compiler_bridge import CompilerBridge
from ..services.log_ingestion import LogIngestionService

router = APIRouter(prefix="/api", tags=["Query"])

@router.post("/compile", response_model=CompileResponse)
def compile_query(req: CompileRequest):
    if not req.query.strip():
        return CompileResponse(
            success=False,
            stage="Input",
            error="Query string cannot be empty."
        )

    result = CompilerBridge.run_compiler(query=req.query, execute=False)
    return result

@router.post("/execute", response_model=ExecuteResponse)
def execute_query(req: ExecuteRequest):
    if not req.query.strip():
        return ExecuteResponse(
            success=False,
            stage="Input",
            error="Query string cannot be empty."
        )

    dataset_path = LogIngestionService.resolve_dataset_path(req.datasetId or "app_events")
    if not dataset_path:
        return ExecuteResponse(
            success=False,
            stage="Dataset",
            error=f"Dataset '{req.datasetId}' could not be resolved."
        )

    result = CompilerBridge.run_compiler(query=req.query, dataset_path=dataset_path, execute=True)
    return result
