from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CompileRequest(BaseModel):
    query: str = Field(..., description="LogQL query text")

class ExecuteRequest(BaseModel):
    query: str = Field(..., description="LogQL query text")
    datasetId: Optional[str] = Field("app_events", description="Dataset identifier")

class DatasetInfo(BaseModel):
    id: str
    name: str
    format: str
    recordCount: int
    path: str

class DiagnosticItem(BaseModel):
    severity: str
    message: str
    line: Optional[int] = 0
    col: Optional[int] = 0

class SemanticInfo(BaseModel):
    isValid: bool
    diagnostics: List[DiagnosticItem] = []

class OptimizationItem(BaseModel):
    rule: str
    description: str
    before: str
    after: str

class TokenItem(BaseModel):
    token: str
    lexeme: str
    line: int
    col: int

class CompileResponse(BaseModel):
    success: bool
    stage: Optional[str] = None
    error: Optional[str] = None
    line: Optional[int] = None
    col: Optional[int] = None
    tokens: Optional[List[TokenItem]] = None
    ast: Optional[Dict[str, Any]] = None
    optimizedAst: Optional[Dict[str, Any]] = None
    semantic: Optional[SemanticInfo] = None
    optimizations: Optional[List[OptimizationItem]] = None
    physicalPlan: Optional[Dict[str, Any]] = None

class ExecutionMetricsModel(BaseModel):
    recordsScanned: int = 0
    recordsFiltered: int = 0
    recordsGrouped: int = 0
    recordsReturned: int = 0
    executionTimeMs: float = 0.0

class ResultsData(BaseModel):
    success: bool = True
    errorMessage: Optional[str] = ""
    columns: List[str] = []
    rows: List[Dict[str, Any]] = []
    metrics: ExecutionMetricsModel = ExecutionMetricsModel()

class ExecuteResponse(BaseModel):
    success: bool
    stage: Optional[str] = None
    error: Optional[str] = None
    tokens: Optional[List[TokenItem]] = None
    ast: Optional[Dict[str, Any]] = None
    optimizedAst: Optional[Dict[str, Any]] = None
    semantic: Optional[SemanticInfo] = None
    optimizations: Optional[List[OptimizationItem]] = None
    physicalPlan: Optional[Dict[str, Any]] = None
    results: Optional[ResultsData] = None
