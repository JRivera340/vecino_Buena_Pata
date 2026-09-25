import { act, renderHook, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { useCarga } from './useCarga';

describe('useCarga', () => {
  it('empieza cargando y luego entrega los datos', async () => {
    const cargar = vi.fn().mockResolvedValue(['a', 'b']);

    const { result } = renderHook(() => useCarga(cargar));

    expect(result.current.cargando).toBe(true);
    expect(result.current.datos).toBeNull();
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.datos).toEqual(['a', 'b']);
    expect(result.current.error).toBeNull();
  });

  it('entrega el error cuando la carga falla', async () => {
    const fallo = new Error('sin conexión');
    const cargar = vi.fn().mockRejectedValue(fallo);

    const { result } = renderHook(() => useCarga(cargar));

    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.error).toBe(fallo);
    expect(result.current.datos).toBeNull();
  });

  it('vuelve a cargar cuando se pide recargar', async () => {
    const cargar = vi.fn().mockResolvedValueOnce('uno').mockResolvedValueOnce('dos');

    const { result } = renderHook(() => useCarga(cargar));
    await waitFor(() => expect(result.current.datos).toBe('uno'));

    act(() => result.current.recargar());

    await waitFor(() => expect(result.current.datos).toBe('dos'));
    expect(cargar).toHaveBeenCalledTimes(2);
  });

  it('recarga cuando cambian las dependencias', async () => {
    const cargar = vi.fn((id: number) => Promise.resolve(`animal ${id}`));

    const { result, rerender } = renderHook(({ id }) => useCarga(() => cargar(id), [id]), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.datos).toBe('animal 1'));

    rerender({ id: 2 });

    await waitFor(() => expect(result.current.datos).toBe('animal 2'));
  });

  it('ignora una respuesta atrasada cuando ya llegó una más nueva', async () => {
    let resolverLenta: (valor: string) => void = () => undefined;
    const lenta = new Promise<string>((resolver) => {
      resolverLenta = resolver;
    });
    const cargar = vi.fn((id: number) => (id === 1 ? lenta : Promise.resolve('rápida')));

    const { result, rerender } = renderHook(({ id }) => useCarga(() => cargar(id), [id]), {
      initialProps: { id: 1 },
    });
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.datos).toBe('rápida'));

    await act(async () => {
      resolverLenta('lenta');
      await lenta;
    });

    expect(result.current.datos).toBe('rápida');
  });

  it('no actualiza el estado después de desmontarse', async () => {
    let resolver: (valor: string) => void = () => undefined;
    const pendiente = new Promise<string>((res) => {
      resolver = res;
    });
    const errores = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = renderHook(() => useCarga(() => pendiente));
    unmount();
    await act(async () => {
      resolver('tarde');
      await pendiente;
    });

    expect(errores).not.toHaveBeenCalled();
    errores.mockRestore();
  });
});
