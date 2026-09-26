import { useLocation } from 'react-router-dom';
import { useCarga } from '@/core/api/useCarga';
import { listarMapa } from '@/core/api/publico';
import { useDesplazarAlHash, useTitulo } from '@/shared/ui/useTitulo';
import { ComoFunciona } from './inicio/ComoFunciona';
import { Hero } from './inicio/Hero';
import { LlamadoQr } from './inicio/LlamadoQr';
import { MapaVecinos } from './inicio/MapaVecinos';

export default function PaginaInicio() {
  useTitulo('Mapa de animales');
  const { hash } = useLocation();
  useDesplazarAlHash(hash);
  const { datos, cargando, error, recargar } = useCarga(listarMapa);

  return (
    <>
      <Hero animales={datos} cargando={cargando} />
      <MapaVecinos
        animales={datos}
        cargando={cargando}
        hayError={error !== null}
        alReintentar={recargar}
      />
      <ComoFunciona />
      <LlamadoQr />
    </>
  );
}
