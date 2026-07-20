from fastapi import APIRouter, FastAPI
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
from app.routers import animales as animales_router
from app.routers import auth as auth_router
from app.routers import collar as collar_router
from app.routers import comunidades as comunidades_router
from app.routers import formalizacion as formalizacion_router
from app.routers import media as media_router
from app.routers import publico as publico_router
from app.routers import reactivacion as reactivacion_router
from app.routers import salida as salida_router
from app.routers import validaciones as validaciones_router
from app.routers import visitas as visitas_router

settings = get_settings()

app = FastAPI(title="Vecino Buena Pata")

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router.router)
api_router.include_router(comunidades_router.router)
api_router.include_router(animales_router.router)
api_router.include_router(validaciones_router.router)
api_router.include_router(formalizacion_router.router)
api_router.include_router(collar_router.router)
api_router.include_router(media_router.router)
api_router.include_router(publico_router.router)
api_router.include_router(visitas_router.router)
api_router.include_router(salida_router.router)
api_router.include_router(reactivacion_router.router)


@api_router.get("/salud")
def salud() -> dict[str, str]:
    return {"estado": "ok"}


app.include_router(api_router)

settings.media_root.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.media_root)), name="media")
