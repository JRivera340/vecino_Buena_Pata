import type { TipoDocumento } from '@/core/modelos/enums';

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; texto: string }[] = [
  { valor: 'CC', texto: 'Cédula de ciudadanía' },
  { valor: 'CE', texto: 'Cédula de extranjería' },
  { valor: 'NIT', texto: 'NIT' },
  { valor: 'OTRO', texto: 'Otro documento' },
];

const LARGO_MINIMO = 4;
const LARGO_MAXIMO = 20;

// Igual que en el servidor: solo letras y dígitos en mayúsculas, así "1.234.567" y "1234567" son el mismo documento.
export function normalizarDocumento(numero: string): string {
  return numero.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function validarDocumento(numero: string): string | null {
  const limpio = normalizarDocumento(numero);
  if (limpio === '') {
    return 'Escribe tu número de documento.';
  }
  if (limpio.length < LARGO_MINIMO || limpio.length > LARGO_MAXIMO) {
    return `El documento debe tener entre ${LARGO_MINIMO} y ${LARGO_MAXIMO} caracteres.`;
  }
  return null;
}
