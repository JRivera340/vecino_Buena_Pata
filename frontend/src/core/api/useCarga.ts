import { useCallback, useEffect, useState } from 'react';

interface EstadoCarga<T> {
  datos: T | null;
  cargando: boolean;
  error: unknown;
}

export function useCarga<T>(cargar: () => Promise<T>, dependencias: unknown[] = []) {
  const [estado, setEstado] = useState<EstadoCarga<T>>({ datos: null, cargando: true, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado((anterior) => ({ ...anterior, cargando: true, error: null }));

    cargar()
      .then((datos) => {
        if (vigente) {
          setEstado({ datos, cargando: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (vigente) {
          setEstado({ datos: null, cargando: false, error });
        }
      });

    return () => {
      vigente = false;
    };
    // La función de carga se vuelve a crear en cada render; solo importan las dependencias declaradas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, version]);

  const recargar = useCallback(() => setVersion((actual) => actual + 1), []);

  return { ...estado, recargar };
}
