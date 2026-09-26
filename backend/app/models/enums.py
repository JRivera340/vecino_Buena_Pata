import enum


class EspecieEnum(str, enum.Enum):
    PERRO = "PERRO"
    GATO = "GATO"


class SexoEnum(str, enum.Enum):
    MACHO = "MACHO"
    HEMBRA = "HEMBRA"


class TamanoEnum(str, enum.Enum):
    PEQUENO = "PEQUENO"
    MEDIANO = "MEDIANO"
    GRANDE = "GRANDE"


class EstadoAnimalEnum(str, enum.Enum):
    CANDIDATO = "CANDIDATO"
    EN_PROCESO = "EN_PROCESO"
    VBP_ACTIVO = "VBP_ACTIVO"
    ADOPTADO = "ADOPTADO"
    PERDIDO = "PERDIDO"
    FALLECIDO = "FALLECIDO"


class CausalSalidaEnum(str, enum.Enum):
    ADOPCION = "ADOPCION"
    PERDIDA = "PERDIDA"
    FALLECIMIENTO = "FALLECIMIENTO"


class TipoComunidadEnum(str, enum.Enum):
    ACCION_COMUNAL = "ACCION_COMUNAL"
    PROTECCION_ANIMAL = "PROTECCION_ANIMAL"
    EDUCATIVA = "EDUCATIVA"
    UNIVERSIDAD = "UNIVERSIDAD"


class RolUsuarioEnum(str, enum.Enum):
    COMUNIDAD = "COMUNIDAD"
    VETERINARIO = "VETERINARIO"
    LIDER = "LIDER"
    UNIDAD_ESPECIAL = "UNIDAD_ESPECIAL"
    ADMIN = "ADMIN"


class VeredictoValidacionEnum(str, enum.Enum):
    APROBADO = "APROBADO"
    CON_PENDIENTES = "CON_PENDIENTES"


class PendienteValidacionEnum(str, enum.Enum):
    SIN_CHIP = "SIN_CHIP"
    SIN_ESTERILIZAR = "SIN_ESTERILIZAR"
    COMPORTAMIENTO = "COMPORTAMIENTO"
    SALUD = "SALUD"


class EstadoSaludEnum(str, enum.Enum):
    BUENO = "BUENO"
    REGULAR = "REGULAR"
    MALO = "MALO"


class EstadoReporteEnum(str, enum.Enum):
    NUEVO = "NUEVO"
    EN_ATENCION = "EN_ATENCION"
    ATENDIDO = "ATENDIDO"
    CERRADO = "CERRADO"


class TipoDocumentoEnum(str, enum.Enum):
    CC = "CC"
    CE = "CE"
    NIT = "NIT"
    OTRO = "OTRO"
