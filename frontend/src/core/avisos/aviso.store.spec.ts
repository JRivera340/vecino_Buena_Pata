import { useAviso } from './aviso.store';

describe('useAviso', () => {
  beforeEach(() => {
    useAviso.getState().limpiar();
  });

  it('no tiene mensaje al iniciar', () => {
    expect(useAviso.getState().mensaje).toBeNull();
  });

  it('guarda el mensaje mostrado', () => {
    useAviso.getState().mostrar('No pudimos conectar con el servidor.');
    expect(useAviso.getState().mensaje).toBe('No pudimos conectar con el servidor.');
  });

  it('limpia el mensaje', () => {
    useAviso.getState().mostrar('Error');
    useAviso.getState().limpiar();
    expect(useAviso.getState().mensaje).toBeNull();
  });
});
