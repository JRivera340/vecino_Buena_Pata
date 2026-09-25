import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Estructura } from '@/shared/layout/Estructura';
import { CargandoPagina } from '@/shared/ui/CargandoPagina';

const PaginaInicio = lazy(() => import('@/features/publico/PaginaInicio'));
const PaginaFicha = lazy(() => import('@/features/publico/PaginaFicha'));
const PaginaQr = lazy(() => import('@/features/publico/PaginaQr'));
const PaginaIngreso = lazy(() => import('@/features/publico/PaginaIngreso'));
const PaginaNoEncontrada = lazy(() => import('@/features/publico/PaginaNoEncontrada'));
const PaginaEstilos = import.meta.env.DEV ? lazy(() => import('@/features/estilos/PaginaEstilos')) : null;

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<CargandoPagina />}>
        <Routes>
          <Route element={<Estructura />}>
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/vbp/:id" element={<PaginaFicha />} />
            <Route path="/v/:codigo" element={<PaginaQr />} />
            <Route path="/ingreso" element={<PaginaIngreso />} />
            {PaginaEstilos && <Route path="/estilos" element={<PaginaEstilos />} />}
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
