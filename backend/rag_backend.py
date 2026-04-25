import sys
import os

# 1. PARCHE SQLITE (Debe ser lo primero)
try:
    import pysqlite3
    sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")
except ImportError:
    pass

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx

# 2. IMPORTS ACTUALIZADOS (Ruta nueva)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. CONFIGURACIÓN
CHROMA_PATH = "chroma_db"
# Este es el modelo que mejor funciona en español
model_kwargs = {'device': 'cpu'}
encode_kwargs = {'normalize_embeddings': False}
EMBEDDINGS = HuggingFaceEmbeddings(
    model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)
LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

# Inicializar DB
vectorstore = Chroma(persist_directory=CHROMA_PATH, embedding_function=EMBEDDINGS)

class QueryRequest(BaseModel):
    query: str
    discipline: Optional[str] = "General"

@app.get("/health")
async def health():
    return {"status": "online", "docs_count": vectorstore._collection.count()}

@app.post("/upload")
async def upload_file(discipline: str, file: UploadFile = File(...)):
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    loader = PyPDFLoader(temp_path) if file.filename.endswith(".pdf") else Docx2txtLoader(temp_path)
    docs = loader.load()
    for d in docs: d.metadata["discipline"] = discipline
    
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    vectorstore.add_documents(chunks)
    
    os.remove(temp_path)
    return {"status": "success"}

@app.post("/query")
async def query_rag(req: QueryRequest):
    search_kwargs = {"filter": {"discipline": req.discipline}} if req.discipline != "General" else {}
    results = vectorstore.similarity_search(req.query, k=3, **search_kwargs)
    
    context = "\n".join([r.page_content for r in results])
    sources = [{"file": r.metadata.get("source"), "page": r.metadata.get("page", 0)} for r in results]

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(LM_STUDIO_URL, json={
                "messages": [
                    {"role": "system", "content": "Eres BARB, experto en mantenimiento técnico."},
                    {"role": "user", "content": f"Contexto:\n{context}\n\nPregunta: {req.query}"}
                ],
                "temperature": 0.1
            }, timeout=30.0)
            answer = response.json()["choices"][0]["message"]["content"]
    except:
        answer = "Error: LM Studio no responde en puerto 1234."

    return {"answer": answer, "sources": sources}
