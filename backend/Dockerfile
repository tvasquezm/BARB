# Usamos una imagen oficial y ligera de Python
FROM python:3.10-slim

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalamos dependencias del sistema necesarias para compilar librerías como ChromaDB o Psycopg
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiamos el archivo de requerimientos primero (para aprovechar el caché de Docker)
COPY requirements.txt .

# Instalamos las librerías de Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código de tu backend
COPY . .

# Exponemos el puerto 9000 que es el que tu frontend está buscando
EXPOSE 9000

# Comando para levantar el servidor (asumiendo que tu app FastAPI está en rag_backend.py)
CMD ["uvicorn", "rag_backend:app", "--host", "0.0.0.0", "--port", "9000", "--reload"]