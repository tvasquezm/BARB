# TECHBOT — Sistema RAG Industrial para Reducción de MTR
## Guía de instalación y uso

---

## 🎯 Objetivo
Sistema RAG (Retrieval-Augmented Generation) que permite a operadores de planta consultar
manuales de maquinaria en lenguaje natural, vinculado a Órdenes de Trabajo (OT),
para reducir el MTR y el costo de $2.000 USD/minuto de parada.

---

## 📁 Archivos del proyecto

```
techbot/
├── rag_maquinaria.html    ← Interfaz web (funciona sola, modo demo o con backend)
├── rag_backend.py         ← Backend Python con RAG real (LangChain + ChromaDB)
└── README.md              ← Este archivo
```

---

## 🚀 Opción A: Solo HTML (demo rápido)

1. Abre `rag_maquinaria.html` en el navegador
2. El sistema usa un manual de demo pre-cargado
3. Sin LM Studio → respuestas mostrando el fragmento del manual
4. Con LM Studio → respuestas inteligentes generadas por el LLM

---

## 🛠 Opción B: Stack completo (producción)

### 1. Instalar LM Studio
- Descargar: https://lmstudio.ai
- Cargar un modelo recomendado:
  - **Mistral 7B Instruct** (buena relación velocidad/calidad)
  - **LLaMA 3.1 8B Instruct** (mejor para español técnico)
  - **Qwen2.5 7B Instruct** (excelente multilingüe)
- Activar servidor local: ☰ → Local Server → Start Server (puerto 1234)

### 2. Instalar dependencias Python

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Instalar dependencias
pip install fastapi uvicorn python-multipart
pip install langchain langchain-community chromadb
pip install sentence-transformers
pip install pypdf python-docx
pip install httpx
```

### 3. Correr el backend

```bash
python rag_backend.py
# o
uvicorn rag_backend:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Probar la API

```bash
# Health check
curl http://localhost:8000/health

# Subir un manual
curl -X POST http://localhost:8000/upload \
  -F "file=@manual_compresor.pdf"

# Consultar
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "¿Cómo solucionar el error E-041?",
    "ot_number": "OT-2024-0847",
    "ot_machine": "Compresor Atlas Copco GA55",
    "ot_type": "Sobrecalentamiento"
  }'
```

### 5. Conectar el frontend al backend

En `rag_maquinaria.html`, la función `ragQuery()` hace la llamada al backend.
Modifica la URL para apuntar a `http://localhost:8000/query` en vez de LM Studio directo.

---

## ⚙️ Variables de entorno

```bash
export LM_STUDIO_URL="http://localhost:1234/v1"
export LM_STUDIO_MODEL="mistral-7b-instruct"
export EMBEDDING_MODEL="nomic-ai/nomic-embed-text-v1.5"
export CHROMA_PATH="./chroma_db"
```

---

## 🏗 Arquitectura del pipeline RAG

```
Manual PDF/DOCX
      ↓
  Chunking (600 tokens, overlap 80)
      ↓
  Embeddings (nomic-embed-text)
      ↓
  ChromaDB (vector store local)
      ↓
  Consulta operador + OT
      ↓
  Búsqueda semántica (Top-K=4)
      ↓
  Prompt con contexto + OT
      ↓
  LM Studio (LLM local)
      ↓
  Respuesta al operador
```

---

## 📊 Métricas de impacto esperadas

| Métrica | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| Tiempo búsqueda en manual | 15-30 min | 30 seg | -97% |
| MTR promedio | Línea base | -25 a -40% | $3.000-6.000/incidente |
| Consultas sin escalar | ~40% | ~70% | +75% autonomía |
| Errores de procedimiento | Variable | -60% | Seguridad mejorada |

---

## 🔒 Privacidad (datos 100% locales)

- ✅ LM Studio corre offline — ningún dato sale de la red
- ✅ ChromaDB almacena embeddings en disco local
- ✅ Sin dependencia de APIs externas en producción
- ✅ Compatible con redes aisladas (OT/IT segregadas)

---

## 🛣 Roadmap sugerido

1. **Semana 1**: Deploy interfaz HTML + LM Studio + 1 manual piloto
2. **Semana 2**: Backend Python, subir todos los manuales, ajustar chunk size
3. **Semana 3**: Integrar con sistema de OT existente (SAP PM, MP2, etc.)
4. **Mes 2**: Historial de consultas → dashboard de MTR
5. **Mes 3**: Fine-tuning del LLM con Q&A propias del equipo

---

## 🆘 Soporte y troubleshooting

**LM Studio no responde:**
→ Verificar que el servidor local esté activo (ícono verde en LM Studio)
→ Revisar puerto: `curl http://localhost:1234/v1/models`

**Respuestas fuera de contexto:**
→ Reducir temperatura a 0.05
→ Aumentar TOP_K a 6
→ Mejorar calidad de chunking (ajustar separadores)

**Embeddings lentos:**
→ Usar GPU si disponible: `CUDA_VISIBLE_DEVICES=0 python rag_backend.py`
→ Modelo alternativo más liviano: `all-MiniLM-L6-v2`
