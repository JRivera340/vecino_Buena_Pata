from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.routers import animales as animales_router
from app.routers import auth as auth_router
from app.routers import comunidades as comunidades_router

settings = get_settings()

app = FastAPI(title="Vecino Buena Pata")

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router.router)
api_router.include_router(comunidades_router.router)
api_router.include_router(animales_router.router)


@api_router.get("/salud")
def salud() -> dict[str, str]:
    return {"estado": "ok"}


app.include_router(api_router)

settings.media_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.media_root)), name="media")
