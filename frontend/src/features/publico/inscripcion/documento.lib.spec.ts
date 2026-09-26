import { normalizarDocumento, validarDocumento } from './documento.lib';

describe('normalizarDocumento', () => {
  it('quita puntos, espacios y guiones', () => {
    expect(normalizarDocumento('1.234.567-8')).toBe('12345678');
    expect(normalizarDocumento(' 1 234 567 ')).toBe('1234567');
  });

  it('pasa a mayúsculas los documentos con letras', () => {
    expect(normalizarDocumento('ab-123456')).toBe('AB123456');
  });
});

describe('validarDocumento', () => {
  it('acepta un documento normal, con o sin puntos', () => {
    expect(validarDocumento('1.234.567')).toBeNull();
    expect(validarDocumento('1234567')).toBeNull();
  });

  it('pide el documento cuando está vacío o solo tiene símbolos', () => {
    expect(validarDocumento('')).toBe('Escribe tu número de documento.');
    expect(validarDocumento(' ... ')).toBe('Escribe tu número de documento.');
  });

  it('rechaza los muy cortos y los muy largos', () => {
    expect(validarDocumento('123')).toMatch(/entre 4 y 20/);
    expect(validarDocumento('1'.repeat(21))).toMatch(/entre 4 y 20/);
  });
});
