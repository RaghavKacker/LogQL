from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class CompileRequest(BaseModel):
    query: str = Field(..., description="LogQL query text")

class ExecuteRequest(BaseModel):
    query: str = Field(..., description="LogQL query text")
    datasetId: Optional[str] = Field("app_events", alias="dataset_id", description="Dataset identifier")

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True

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

class QuadrupleItem(BaseModel):
    index: int
    op: str
    arg1: str = ""
    arg2: str = ""
    result: str = ""
    comment: Optional[str] = ""

class TacInstructionItem(BaseModel):
    line: int
    label: Optional[str] = ""
    code: str
    block: Optional[str] = ""

class BasicBlockItem(BaseModel):
    name: str
    label: str = ""
    instructions: List[str] = []
    successors: List[str] = []

class TacInfo(BaseModel):
    quadruples: List[QuadrupleItem] = []
    instructions: List[TacInstructionItem] = []
    basicBlocks: List[BasicBlockItem] = []
    temporaryCount: int = 0
    temporaryVariables: List[str] = []

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
    tac: Optional[TacInfo] = None
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
    tac: Optional[TacInfo] = None
    physicalPlan: Optional[Dict[str, Any]] = None
    results: Optional[ResultsData] = None
