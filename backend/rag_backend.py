from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Literal, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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
    version="1.0.0",
    description="API local mockeada para OTs, topología de planta y chat RAG.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WorkOrderStatus = Literal["Open", "In Progress", "Done", "Closed"]
PriorityLevel = Literal["Low", "Medium", "High"]
MachineHealth = Literal["operational", "warning", "error"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def minutes_between(start: datetime, end: datetime | None = None) -> int:
    end = end or utc_now()
    delta = end - start
    return max(0, int(delta.total_seconds() // 60))


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


class MachineStatusItem(BaseModel):
    id: str
    name: str
    status: MachineHealth


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, examples=["¿Cuál fue la última falla del motor D1?"])
    context_machine: Optional[str] = Field(default=None, examples=["motor-d1"])


class ChatResponse(BaseModel):
    reply: str
    sources: List[str]


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


def build_chat_reply(message: str, context_machine: Optional[str]) -> str:
    machine_fragment = f" para la máquina {context_machine}" if context_machine else ""
    return (
        f"Respuesta simulada{machine_fragment}: he recibido tu mensaje '{message}'. "
        "Todo indica que la información relevante está disponible para el equipo de frontend. "
        "TODO: conectar esta respuesta con LM Studio y el motor RAG real."
    )


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


@app.get("/api/machines", response_model=list[MachineStatusItem])
async def list_machines() -> list[MachineStatusItem]:
    return MACHINES


@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    reply = build_chat_reply(payload.message, payload.context_machine)
    sources = ["Manual_UTEM.pdf", "Procedimientos_Mantenimiento_Planta.pdf"]
    return ChatResponse(reply=reply, sources=sources)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("rag_backend:app", host="0.0.0.0", port=9000, reload=True)
