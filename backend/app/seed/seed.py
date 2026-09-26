from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.animal import Animal
from app.models.atencion_especial import AtencionEspecial
from app.models.collar_qr import CollarQr
from app.models.comunidad import Comunidad
from app.models.enums import (
    CausalSalidaEnum,
    EstadoAnimalEnum,
    EstadoReporteEnum,
    EstadoSaludEnum,
    RolUsuarioEnum,
    SexoEnum,
    TamanoEnum,
    TipoComunidadEnum,
    VeredictoValidacionEnum,
)
from app.models.reporte_novedad import ReporteNovedad
from app.models.usuario import Usuario
from app.models.validacion import Validacion
from app.models.visita_seguimiento import VisitaSeguimiento
from app.seed.silueta import generar_silueta_placeholder
from app.services.formalizacion import generar_codigo_qr

_PASSWORD_SEMILLA = "vbp2026"

_COMUNIDADES = [
    dict(
        nombre="Junta de Accion Comunal La Esperanza",
        tipo=TipoComunidadEnum.ACCION_COMUNAL,
        barrio="La Esperanza",
        telefono_contacto="3011234567",
        email_contacto="contacto@laesperanza.org",
    ),
    dict(
        nombre="Patitas del Sur",
        tipo=TipoComunidadEnum.PROTECCION_ANIMAL,
        barrio="San Cristobal Sur",
        telefono_contacto="3027654321",
        email_contacto="contacto@patitasdelsur.org",
    ),
    dict(
        nombre="Colegio Distrital San Jose",
        tipo=TipoComunidadEnum.EDUCATIVA,
        barrio="Las Cruces",
        telefono_contacto="3039876543",
        email_contacto="rectoria@colegiosanjose.edu.co",
    ),
    dict(
        nombre="Universidad del Valle del Barrio",
        tipo=TipoComunidadEnum.UNIVERSIDAD,
        barrio="La Perseverancia",
        telefono_contacto="3045551234",
        email_contacto="bienestar@uvb.edu.co",
    ),
]

_USUARIOS = [
    dict(nombre="Maria Comunidad", rol=RolUsuarioEnum.COMUNIDAD, username="maria.comunidad"),
    dict(nombre="Dr. Rojas", rol=RolUsuarioEnum.VETERINARIO, username="dr.rojas"),
    dict(nombre="Lider de Campo", rol=RolUsuarioEnum.LIDER, username="lider.campo"),
    dict(nombre="Administrador", rol=RolUsuarioEnum.ADMIN, username="admin"),
]

_BARRIOS_COORDENADAS = {
    "La Esperanza": (4.5709, -74.0973),
    "San Cristobal Sur": (4.5561, -74.0866),
    "Las Cruces": (4.5931, -74.0906),
    "La Perseverancia": (4.6103, -74.0656),
}


def _ahora_menos(dias: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=dias)


def ejecutar_seed() -> None:
    settings = get_settings()
    nombre_foto = generar_silueta_placeholder(settings.media_root)

    db = SessionLocal()
    try:
        comunidades = {}
        for datos in _COMUNIDADES:
            comunidad = Comunidad(**datos)
            db.add(comunidad)
            db.flush()
            comunidades[comunidad.barrio] = comunidad

        for datos in _USUARIOS:
            db.add(Usuario(**datos, password_hash=hash_password(_PASSWORD_SEMILLA)))

        barrios = list(_BARRIOS_COORDENADAS.keys())

        def _nueva_ubicacion(barrio: str, indice: int) -> tuple[float, float]:
            lat, lon = _BARRIOS_COORDENADAS[barrio]
            desplazamiento = indice * 0.002
            return lat + desplazamiento, lon + desplazamiento

        # 6 VBP activos, con collar y visitas de seguimiento
        nombres_vbp = ["Rocky", "Canela", "Motas", "Negra", "Duque", "Manchas"]
        for indice, nombre in enumerate(nombres_vbp):
            barrio = barrios[indice % len(barrios)]
            lat, lon = _nueva_ubicacion(barrio, indice)
            animal = Animal(
                nombre=nombre,
                sexo=SexoEnum.MACHO if indice % 2 == 0 else SexoEnum.HEMBRA,
                tamano=TamanoEnum.MEDIANO,
                descripcion=f"{nombre} es un vecino tranquilo que ronda el sector de {barrio}.",
                foto_principal=nombre_foto,
                estado=EstadoAnimalEnum.VBP_ACTIVO,
                esterilizado=True,
                numero_microchip=f"985141{indice:06d}",
                barrio=barrio,
                latitud=lat,
                longitud=lon,
                comunidad_id=comunidades[barrio].id,
                fecha_inscripcion=_ahora_menos(120),
                inscrito_por="maria.comunidad",
            )
            db.add(animal)
            db.flush()

            db.add(
                Validacion(
                    animal_id=animal.id,
                    fecha=_ahora_menos(100),
                    veterinario="dr.rojas",
                    veredicto=VeredictoValidacionEnum.APROBADO,
                    pendientes=[],
                    observaciones="Cumple los cuatro criterios de formalizacion.",
                )
            )
            db.add(CollarQr(animal_id=animal.id, codigo=generar_codigo_qr(db), fecha_entrega=_ahora_menos(90)))
            for visita_indice in range(2):
                db.add(
                    VisitaSeguimiento(
                        animal_id=animal.id,
                        fecha=_ahora_menos(60 - visita_indice * 20),
                        responsable="dr.rojas",
                        estado_salud=EstadoSaludEnum.BUENO,
                        estado_comportamiento="Buena convivencia con la comunidad",
                        peso_kg=14.2 + visita_indice,
                        foto=nombre_foto,
                        observaciones="Visita de seguimiento rutinaria.",
                    )
                )

        # 3 candidatos recien inscritos
        nombres_candidatos = ["Firulais", "Estrella", "Perla"]
        for indice, nombre in enumerate(nombres_candidatos):
            barrio = barrios[indice % len(barrios)]
            lat, lon = _nueva_ubicacion(barrio, indice + 10)
            db.add(
                Animal(
                    nombre=nombre,
                    sexo=SexoEnum.HEMBRA if indice % 2 == 0 else SexoEnum.MACHO,
                    tamano=TamanoEnum.PEQUENO,
                    descripcion=f"{nombre} fue inscrito recientemente por la comunidad de {barrio}.",
                    foto_principal=nombre_foto,
                    estado=EstadoAnimalEnum.CANDIDATO,
                    barrio=barrio,
                    latitud=lat,
                    longitud=lon,
                    comunidad_id=comunidades[barrio].id,
                    fecha_inscripcion=_ahora_menos(3),
                    inscrito_por="maria.comunidad",
                )
            )

        # 2 en proceso: uno sin esterilizar, otro sin chip y con observacion de comportamiento
        barrio_tribilin = barrios[0]
        lat, lon = _nueva_ubicacion(barrio_tribilin, 20)
        tribilin = Animal(
            nombre="Tribilin",
            sexo=SexoEnum.MACHO,
            tamano=TamanoEnum.GRANDE,
            descripcion="Tribilin esta en proceso de validacion, aun no esterilizado.",
            foto_principal=nombre_foto,
            estado=EstadoAnimalEnum.EN_PROCESO,
            esterilizado=False,
            numero_microchip="985141900001",
            barrio=barrio_tribilin,
            latitud=lat,
            longitud=lon,
            comunidad_id=comunidades[barrio_tribilin].id,
            fecha_inscripcion=_ahora_menos(20),
            inscrito_por="maria.comunidad",
        )
        db.add(tribilin)
        db.flush()
        db.add(
            Validacion(
                animal_id=tribilin.id,
                fecha=_ahora_menos(10),
                veterinario="dr.rojas",
                veredicto=VeredictoValidacionEnum.CON_PENDIENTES,
                pendientes=["SIN_ESTERILIZAR"],
                observaciones="Falta esterilizacion para poder formalizar.",
            )
        )

        barrio_sombra = barrios[1]
        lat, lon = _nueva_ubicacion(barrio_sombra, 21)
        sombra = Animal(
            nombre="Sombra",
            sexo=SexoEnum.HEMBRA,
            tamano=TamanoEnum.MEDIANO,
            descripcion="Sombra es cautelosa, no deja acercarse facil a extranos del barrio.",
            foto_principal=nombre_foto,
            estado=EstadoAnimalEnum.EN_PROCESO,
            esterilizado=True,
            barrio=barrio_sombra,
            latitud=lat,
            longitud=lon,
            comunidad_id=comunidades[barrio_sombra].id,
            fecha_inscripcion=_ahora_menos(15),
            inscrito_por="maria.comunidad",
        )
        db.add(sombra)
        db.flush()
        db.add(
            Validacion(
                animal_id=sombra.id,
                fecha=_ahora_menos(8),
                veterinario="dr.rojas",
                veredicto=VeredictoValidacionEnum.CON_PENDIENTES,
                pendientes=["SIN_CHIP", "COMPORTAMIENTO"],
                observaciones="Falta chip; no deja que nadie nuevo entre al barrio.",
            )
        )

        # 1 adoptado, 1 fallecido, 1 perdido (con historial previo completo)
        barrio_lucas = barrios[2]
        lat, lon = _nueva_ubicacion(barrio_lucas, 30)
        lucas = Animal(
            nombre="Lucas",
            sexo=SexoEnum.MACHO,
            tamano=TamanoEnum.PEQUENO,
            descripcion="Lucas fue adoptado tras meses de seguimiento como Vecino Buena Pata.",
            foto_principal=nombre_foto,
            estado=EstadoAnimalEnum.ADOPTADO,
            esterilizado=True,
            numero_microchip="985141900002",
            barrio=barrio_lucas,
            latitud=lat,
            longitud=lon,
            comunidad_id=comunidades[barrio_lucas].id,
            causal_salida=CausalSalidaEnum.ADOPCION,
            fecha_salida=_ahora_menos(30),
            notas_salida="Adoptado por una familia del barrio, seguimiento cerrado con exito.",
            fecha_inscripcion=_ahora_menos(200),
            inscrito_por="maria.comunidad",
        )
        db.add(lucas)

        barrio_cafe = barrios[3]
        lat, lon = _nueva_ubicacion(barrio_cafe, 31)
        cafe = Animal(
            nombre="Cafe",
            sexo=SexoEnum.MACHO,
            tamano=TamanoEnum.MEDIANO,
            descripcion="Cafe fallecio en un accidente en su territorio.",
            foto_principal=nombre_foto,
            estado=EstadoAnimalEnum.FALLECIDO,
            esterilizado=True,
            numero_microchip="985141900003",
            barrio=barrio_cafe,
            latitud=lat,
            longitud=lon,
            comunidad_id=comunidades[barrio_cafe].id,
            causal_salida=CausalSalidaEnum.FALLECIMIENTO,
            fecha_salida=_ahora_menos(15),
            notas_salida="Accidente en la via principal del barrio.",
            fecha_inscripcion=_ahora_menos(250),
            inscrito_por="maria.comunidad",
        )
        db.add(cafe)

        barrio_lola = barrios[0]
        lat, lon = _nueva_ubicacion(barrio_lola, 32)
        lola = Animal(
            nombre="Lola",
            sexo=SexoEnum.HEMBRA,
            tamano=TamanoEnum.PEQUENO,
            descripcion="Lola desaparecio de su territorio habitual hace unos dias.",
            foto_principal=nombre_foto,
            estado=EstadoAnimalEnum.PERDIDO,
            esterilizado=True,
            numero_microchip="985141900004",
            barrio=barrio_lola,
            latitud=lat,
            longitud=lon,
            comunidad_id=comunidades[barrio_lola].id,
            causal_salida=CausalSalidaEnum.PERDIDA,
            fecha_salida=_ahora_menos(5),
            notas_salida="Ultima vez vista cerca del parque del barrio.",
            fecha_inscripcion=_ahora_menos(180),
            inscrito_por="maria.comunidad",
        )
        db.add(lola)
        db.flush()
        db.add(
            VisitaSeguimiento(
                animal_id=lola.id,
                fecha=_ahora_menos(40),
                responsable="dr.rojas",
                estado_salud=EstadoSaludEnum.BUENO,
                estado_comportamiento="Buena convivencia antes de perderse",
                peso_kg=10.0,
                foto=nombre_foto,
                observaciones="Ultima visita registrada antes de la perdida.",
            )
        )

        db.flush()

        # Reportes de novedad: nuevo, en atencion, cerrado con atencion registrada
        animal_reporte_nuevo = db.query(Animal).filter_by(nombre="Rocky").one()
        db.add(
            ReporteNovedad(
                animal_id=animal_reporte_nuevo.id,
                fecha=_ahora_menos(1),
                reportante_nombre="Vecino del sector",
                comunidad_id=comunidades[animal_reporte_nuevo.barrio].id,
                descripcion="No esta comiendo hace dos dias.",
                estado=EstadoReporteEnum.NUEVO,
            )
        )

        animal_reporte_atencion = db.query(Animal).filter_by(nombre="Canela").one()
        db.add(
            ReporteNovedad(
                animal_id=animal_reporte_atencion.id,
                fecha=_ahora_menos(2),
                reportante_nombre="Vecina del sector",
                comunidad_id=comunidades[animal_reporte_atencion.barrio].id,
                descripcion="Tiene una herida en la pata trasera.",
                estado=EstadoReporteEnum.EN_ATENCION,
            )
        )

        animal_reporte_cerrado = db.query(Animal).filter_by(nombre="Motas").one()
        reporte_cerrado = ReporteNovedad(
            animal_id=animal_reporte_cerrado.id,
            fecha=_ahora_menos(10),
            reportante_nombre="Vecino del sector",
            comunidad_id=comunidades[animal_reporte_cerrado.barrio].id,
            descripcion="Se veia decaido y con poco apetito.",
            estado=EstadoReporteEnum.CERRADO,
        )
        db.add(reporte_cerrado)
        db.flush()
        db.add(
            AtencionEspecial(
                reporte_id=reporte_cerrado.id,
                fecha=_ahora_menos(8),
                responsable="dr.rojas",
                acciones_realizadas="Se llevo alimento reforzado y se reviso su estado general.",
                resultado="El animal recupero el apetito y su comportamiento normal.",
            )
        )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    ejecutar_seed()
    print("Datos semilla cargados correctamente.")
