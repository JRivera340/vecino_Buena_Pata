import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { RutaProtegida } from '@/core/sesion/RutaProtegida';
import { Estructura } from '@/shared/layout/Estructura';
import { CargandoPagina } from '@/shared/ui/CargandoPagina';

const PaginaInicio = lazy(() => import('@/features/publico/PaginaInicio'));
const PaginaFicha = lazy(() => import('@/features/publico/PaginaFicha'));
const PaginaQr = lazy(() => import('@/features/publico/PaginaQr'));
const PaginaIngreso = lazy(() => import('@/features/publico/PaginaIngreso'));
const PaginaNoEncontrada = lazy(() => import('@/features/publico/PaginaNoEncontrada'));
const PaginaMapaGestion = lazy(() => import('@/features/mapa/PaginaMapaGestion'));
const PaginaFichaInterna = lazy(() => import('@/features/animales/PaginaFichaInterna'));
const PaginaInscribir = lazy(() => import('@/features/animales/PaginaInscribir'));
const PaginaValidacion = lazy(() => import('@/features/validacion/PaginaValidacion'));
const PaginaFormalizacion = lazy(() => import('@/features/formalizacion/PaginaFormalizacion'));
const PaginaReportes = lazy(() => import('@/features/reportes/PaginaReportes'));
const PaginaIndicadores = lazy(() => import('@/features/indicadores/PaginaIndicadores'));
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
            <Route element={<RutaProtegida />}>
              <Route path="/mapa" element={<PaginaMapaGestion />} />
              <Route path="/animales/:id" element={<PaginaFichaInterna />} />
              <Route path="/reportes" element={<PaginaReportes />} />
              <Route path="/indicadores" element={<PaginaIndicadores />} />
            </Route>
            <Route element={<RutaProtegida roles={['COMUNIDAD', 'VETERINARIO', 'LIDER', 'ADMIN']} />}>
              <Route path="/animales/inscribir" element={<PaginaInscribir />} />
            </Route>
            <Route element={<RutaProtegida roles={['VETERINARIO', 'ADMIN']} />}>
              <Route path="/validacion" element={<PaginaValidacion />} />
            </Route>
            <Route element={<RutaProtegida roles={['LIDER', 'ADMIN']} />}>
              <Route path="/formalizacion" element={<PaginaFormalizacion />} />
            </Route>
            {PaginaEstilos &&<Route path="/estilos" element={<PaginaEstilos />} />}
            <Route path="*" element={<PaginaNoEncontrada />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
