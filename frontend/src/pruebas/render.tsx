import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

function UbicacionActual() {
  const { pathname } = useLocation();
  return <p data-testid="ubicacion">{pathname}</p>;
}

export function renderizarConRutas(elemento: ReactElement, rutaInicial = '/') {
  return render(
    <MemoryRouter initialEntries={[rutaInicial]}>
      <Routes>
        <Route path="*" element={elemento} />
      </Routes>
      <UbicacionActual />
    </MemoryRouter>,
  );
}

export { UbicacionActual };
