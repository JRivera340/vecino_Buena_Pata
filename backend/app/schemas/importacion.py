from pydantic import BaseModel


class FilaImportacion(BaseModel):
    fila: int
    estado: str  # "OK" | "ERROR"
    animal_id: int | None = None
    incompleto: bool = False
    motivo: str | None = None


class ResumenImportacion(BaseModel):
    total: int
    importados: int
    con_error: int
    incompletos: int
    filas: list[FilaImportacion]
