import { solicitar } from './cliente';

export interface FilaImportacion {
  fila: number;
  estado: 'OK' | 'ERROR';
  animal_id: number | null;
  incompleto: boolean;
  motivo: string | null;
}

export interface ResumenImportacion {
  total: number;
  importados: number;
  con_error: number;
  incompletos: number;
  filas: FilaImportacion[];
}

export function importarAnimales(archivo: File): Promise<ResumenImportacion> {
  const formulario = new FormData();
  formulario.append('archivo', archivo);
  return solicitar<ResumenImportacion>('/importacion/animales', { metodo: 'POST', cuerpo: formulario });
}
