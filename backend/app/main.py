from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.consentimentos import router as consentimentos_router
from app.api.routes.gestantes import router as gestantes_router
from app.api.routes.relatos import router as relatos_router
from app.core.config import settings
from app.db.init_db import init_db, seed_db
from app.db.session import SessionLocal

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(gestantes_router)
app.include_router(consentimentos_router)
app.include_router(relatos_router)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}
