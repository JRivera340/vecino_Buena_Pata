import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Estructura } from '@/shared/layout/Estructura';
import { CargandoPagina } from '@/shared/ui/CargandoPagina';

const PaginaNoEncontrada = lazy(() => import('@/features/publico/PaginaNoEncontrada'));
const PaginaEstilos = import.meta.env.DEV ? lazy(() => import('@/features/estilos/PaginaEstilos')) : null;

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route element={<Estructura />}>
            {PaginaEstilos && <Route path="/estilos" element={<PaginaEstilos />} />}
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
