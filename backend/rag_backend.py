from __future__ import annotations

import csv
from collections import Counter
from datetime import datetime, timezone
from io import StringIO
from typing import List, Literal, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# BARB Plant Memory API
# -----------------------------------------------------------------------------
# TODO: Reemplazar los datos en memoria por persistencia real en PostgreSQL.
# TODO: Conectar el endpoint /api/chat con LM Studio y el pipeline RAG real.
# TODO: Persistir cambios de estado de OTs en la base de datos.
# -----------------------------------------------------------------------------


app = FastAPI(
    title="BARB Plant Memory API",
    version="1.1.0",
    description="API local mockeada para OTs, topología de planta, reportes y chat RAG.",
)

app.add_middleware(
    CORSMiddleware,
    # Mantener regex general, pero agregar explícitamente Vite
    allow_origin_regex=r"https?://.*",
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WorkOrderStatus = Literal["Open", "In Progress", "Done", "Closed"]
PriorityLevel = Literal["Low", "Medium", "High"]
MachineHealth = Literal["operational", "warning", "error"]
ChatLanguage = Literal["es", "en"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def minutes_between(start: datetime, end: datetime | None = None) -> int:
    end = end or utc_now()
    delta = end - start
    return max(0, int(delta.total_seconds() // 60))


def next_work_order_id() -> str:
    numeric_suffixes: list[int] = []
    for work_order_id in WORK_ORDERS.keys():
        try:
            numeric_suffixes.append(int(work_order_id.split("-")[-1]))
        except ValueError:
            continue
    next_number = max(numeric_suffixes, default=1000) + 1
    return f"WO-{next_number}"


def next_document_id() -> str:
    numeric_suffixes: list[int] = []
    for document_id in DOCUMENTS.keys():
        try:
            numeric_suffixes.append(int(document_id.split("-")[-1]))
        except ValueError:
            continue
    next_number = max(numeric_suffixes, default=2000) + 1
    return f"DOC-{next_number}"


class WorkOrderRecord(BaseModel):
    id: str
    title: str
    machine: str
    priority: PriorityLevel
    status: WorkOrderStatus
    description: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None


class WorkOrderSummary(BaseModel):
    id: str
    title: str
    machine: str
    priority: PriorityLevel
    status: WorkOrderStatus
    age_minutes: int


class WorkOrderDetail(WorkOrderSummary):
    description: str
    created_at: datetime
    updated_at: datetime
    closed_at: Optional[datetime] = None


class WorkOrderUpdateRequest(BaseModel):
    status: WorkOrderStatus = Field(..., examples=["In Progress", "Closed"])


class WorkOrderCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, examples=["Inspect Motor D1 vibration"])
    machine: str = Field(..., min_length=1, examples=["motor-d1"])
    priority: PriorityLevel = Field(default="Medium")
    description: str = Field(default="", examples=["Se detectó vibración anómala en el motor D1."])
    status: WorkOrderStatus = Field(default="Open")


class MachineStatusItem(BaseModel):
    id: str
    name: str
    status: MachineHealth


class MachineStatusCounts(BaseModel):
    operational: int
    warning: int
    error: int


class StatsOverviewResponse(BaseModel):
    total_work_orders: int
    completion_percentage: float
    machine_status_counts: MachineStatusCounts


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, examples=["¿Cuál fue la última falla del motor D1?"])
    context_machine: Optional[str] = Field(default=None, examples=["motor-d1"])
    language: ChatLanguage = Field(default="es", description="Idioma de respuesta mockeada", examples=["es", "en"])


class ChatResponse(BaseModel):
    reply: str
    sources: List[str]
    language: ChatLanguage


class DocumentRecord(BaseModel):
    id: str
    filename: str
    title: str
    uploaded_at: datetime
    size_bytes: int
    mime_type: Optional[str] = None


WORK_ORDERS: dict[str, WorkOrderRecord] = {
    "WO-1001": WorkOrderRecord(
        id="WO-1001",
        title="Replace oil seal on Compressor A1",
        machine="comp-a1",
        priority="High",
        status="Open",
        description="Se detectó una fuga de aceite en el sello principal del compresor A1.",
        created_at=utc_now(),
        updated_at=utc_now(),
    ),
    "WO-1002": WorkOrderRecord(
        id="WO-1002",
        title="Hydraulic pressure inspection",
        machine="press-b3",
        priority="Medium",
        status="In Progress",
        description="Revisión de caída de presión hidráulica en la prensa B3.",
        created_at=utc_now(),
        updated_at=utc_now(),
    ),
    "WO-1003": WorkOrderRecord(
        id="WO-1003",
        title="Motor D1 overheating analysis",
        machine="motor-d1",
        priority="High",
        status="Done",
        description="Análisis de sobretemperatura detectada en motor D1.",
        created_at=utc_now(),
        updated_at=utc_now(),
        closed_at=utc_now(),
    ),
    "WO-1004": WorkOrderRecord(
        id="WO-1004",
        title="Preventive maintenance for CNC C2",
        machine="cnc-c2",
        priority="Low",
        status="Closed",
        description="Mantenimiento preventivo programado para la fresadora CNC C2.",
        created_at=utc_now(),
        updated_at=utc_now(),
        closed_at=utc_now(),
    ),
}

MACHINES: list[MachineStatusItem] = [
    MachineStatusItem(id="comp-a1", name="Compressor A1", status="warning"),
    MachineStatusItem(id="press-b3", name="Hydraulic Press B3", status="operational"),
    MachineStatusItem(id="motor-d1", name="Motor Drive D1", status="error"),
    MachineStatusItem(id="cnc-c2", name="CNC Mill C2", status="operational"),
    MachineStatusItem(id="pump-e4", name="Pump E4", status="warning"),
]

DOCUMENTS: dict[str, DocumentRecord] = {
    "DOC-2001": DocumentRecord(
        id="DOC-2001",
        filename="Manual_UTEM.pdf",
        title="Manual UTEM",
        uploaded_at=utc_now(),
        size_bytes=1_245_876,
        mime_type="application/pdf",
    ),
    "DOC-2002": DocumentRecord(
        id="DOC-2002",
        filename="Procedimientos_Mantenimiento_Planta.pdf",
        title="Procedimientos de Mantenimiento de Planta",
        uploaded_at=utc_now(),
        size_bytes=892_144,
        mime_type="application/pdf",
    ),
    "DOC-2003": DocumentRecord(
        id="DOC-2003",
        filename="Guia_RAG_Maquinaria.pdf",
        title="Guía RAG Maquinaria",
        uploaded_at=utc_now(),
        size_bytes=654_320,
        mime_type="application/pdf",
    ),
}


def to_summary(work_order: WorkOrderRecord) -> WorkOrderSummary:
    return WorkOrderSummary(
        id=work_order.id,
        title=work_order.title,
        machine=work_order.machine,
        priority=work_order.priority,
        status=work_order.status,
        age_minutes=minutes_between(work_order.created_at),
    )


def to_detail(work_order: WorkOrderRecord) -> WorkOrderDetail:
    return WorkOrderDetail(
        id=work_order.id,
        title=work_order.title,
        machine=work_order.machine,
        priority=work_order.priority,
        status=work_order.status,
        age_minutes=minutes_between(work_order.created_at),
        description=work_order.description,
        created_at=work_order.created_at,
        updated_at=work_order.updated_at,
        closed_at=work_order.closed_at,
    )


def build_chat_reply(message: str, context_machine: Optional[str], language: ChatLanguage) -> str:
    machine_fragment = f" for machine {context_machine}" if context_machine else ""

    if language == "en":
        return (
            f"Mock response{machine_fragment}: I received your message '{message}'. "
            "The backend is simulating the RAG pipeline for now, but the frontend can already consume this endpoint."
        )

    return (
        f"Respuesta simulada{machine_fragment}: he recibido tu mensaje '{message}'. "
        "El backend está simulando el pipeline RAG por ahora, pero el frontend ya puede consumir este endpoint."
    )


def build_completion_percentage() -> float:
    total = len(WORK_ORDERS)
    if total == 0:
        return 0.0

    completed = sum(1 for work_order in WORK_ORDERS.values() if work_order.status in ("Done", "Closed"))
    return round((completed / total) * 100, 1)


def build_machine_status_counts() -> MachineStatusCounts:
    counts = Counter(machine.status for machine in MACHINES)
    return MachineStatusCounts(
        operational=counts.get("operational", 0),
        warning=counts.get("warning", 0),
        error=counts.get("error", 0),
    )


def build_work_orders_csv() -> str:
    csv_buffer = StringIO()
    writer = csv.writer(csv_buffer, lineterminator="\n")
    writer.writerow(
        [
            "id",
            "title",
            "machine",
            "priority",
            "status",
            "description",
            "created_at",
            "updated_at",
            "closed_at",
        ]
    )

    for work_order in WORK_ORDERS.values():
        writer.writerow(
            [
                work_order.id,
                work_order.title,
                work_order.machine,
                work_order.priority,
                work_order.status,
                work_order.description,
                work_order.created_at.isoformat(),
                work_order.updated_at.isoformat(),
                work_order.closed_at.isoformat() if work_order.closed_at else "",
            ]
        )

    return csv_buffer.getvalue()


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "BARB Plant Memory API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
@app.get("/api/health")
async def health() -> dict[str, int | str]:
    return {
        "status": "online",
        "work_orders": len(WORK_ORDERS),
        "machines": len(MACHINES),
        "documents": len(DOCUMENTS),
    }


@app.get("/api/work-orders", response_model=list[WorkOrderSummary])
async def list_work_orders() -> list[WorkOrderSummary]:
    return [to_summary(work_order) for work_order in WORK_ORDERS.values()]


@app.get("/api/work-orders/{work_order_id}", response_model=WorkOrderDetail)
async def get_work_order(work_order_id: str) -> WorkOrderDetail:
    work_order = WORK_ORDERS.get(work_order_id)
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    return to_detail(work_order)


@app.post("/api/work-orders", response_model=WorkOrderDetail, status_code=201)
async def create_work_order(payload: WorkOrderCreateRequest) -> WorkOrderDetail:
    work_order_id = next_work_order_id()
    now = utc_now()
    closed_at = now if payload.status in ("Done", "Closed") else None
    work_order = WorkOrderRecord(
        id=work_order_id,
        title=payload.title,
        machine=payload.machine,
        priority=payload.priority,
        status=payload.status,
        description=payload.description or payload.title,
        created_at=now,
        updated_at=now,
        closed_at=closed_at,
    )
    WORK_ORDERS[work_order_id] = work_order
    return to_detail(work_order)


@app.put("/api/work-orders/{work_order_id}", response_model=WorkOrderDetail)
async def update_work_order(
    work_order_id: str,
    payload: WorkOrderUpdateRequest,
) -> WorkOrderDetail:
    work_order = WORK_ORDERS.get(work_order_id)
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")

    work_order.status = payload.status
    work_order.updated_at = utc_now()

    if payload.status in ("Done", "Closed") and work_order.closed_at is None:
        work_order.closed_at = utc_now()

    if payload.status in ("Open", "In Progress"):
        # TODO: ajustar esta lógica cuando la persistencia viva en PostgreSQL.
        work_order.closed_at = None if payload.status == "Open" else work_order.closed_at

    WORK_ORDERS[work_order_id] = work_order
    return to_detail(work_order)


@app.delete("/api/work-orders/{work_order_id}")
async def delete_work_order(work_order_id: str) -> dict[str, str]:
    if work_order_id not in WORK_ORDERS:
        raise HTTPException(status_code=404, detail="Work order not found")

    del WORK_ORDERS[work_order_id]
    return {"message": f"Work order {work_order_id} deleted", "id": work_order_id}


@app.get("/api/work-orders/export")
async def export_work_orders() -> StreamingResponse:
    csv_content = build_work_orders_csv()
    filename = f"work_orders_{utc_now().date().isoformat()}.csv"

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/stats/overview", response_model=StatsOverviewResponse)
async def get_stats_overview() -> StatsOverviewResponse:
    return StatsOverviewResponse(
        total_work_orders=len(WORK_ORDERS),
        completion_percentage=build_completion_percentage(),
        machine_status_counts=build_machine_status_counts(),
    )


@app.get("/api/machines", response_model=list[MachineStatusItem])
async def list_machines() -> list[MachineStatusItem]:
    return MACHINES


@app.get("/api/documents", response_model=list[DocumentRecord])
async def list_documents() -> list[DocumentRecord]:
    return list(DOCUMENTS.values())


@app.post("/api/documents/upload", response_model=DocumentRecord, status_code=201)
async def upload_document(file: UploadFile = File(...)) -> DocumentRecord:
    contents = await file.read()
    document_id = next_document_id()
    now = utc_now()
    title = file.filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    document = DocumentRecord(
        id=document_id,
        filename=file.filename,
        title=title,
        uploaded_at=now,
        size_bytes=len(contents),
        mime_type=file.content_type,
    )
    DOCUMENTS[document_id] = document
    return document


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)
    role: Optional[str] = None


class LoginResponse(BaseModel):
    id: str
    name: str
    role: str


class LogoutResponse(BaseModel):
    ok: bool


@app.post("/api/auth/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    # Endpoint básico para que el frontend funcione.
    # (Persistencia real luego conectando a la tabla Usuario.)
    role_in = payload.role or "technician"
    role_norm = role_in if role_in in ("admin", "tecnico", "technician", "engineer", "supervisor") else role_in

    return LoginResponse(
        id=f"u-{payload.username}",
        name=payload.username,
        role=role_norm,
    )


@app.post("/api/auth/logout", response_model=LogoutResponse)
async def logout() -> LogoutResponse:
    return LogoutResponse(ok=True)


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    reply = build_chat_reply(payload.message, payload.context_machine, payload.language)
    sources = ["Manual_UTEM.pdf", "Procedimientos_Mantenimiento_Planta.pdf"]
    return ChatResponse(reply=reply, sources=sources, language=payload.language)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("rag_backend:app", host="0.0.0.0", port=8000, reload=True)
