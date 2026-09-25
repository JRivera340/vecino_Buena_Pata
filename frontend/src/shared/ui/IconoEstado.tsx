import type { IconoEstado } from '@/shared/estado-visual/estado-visual.lib';

interface Props {
  icono: IconoEstado;
  color: string;
  tamano?: number;
}

const GLIFOS: Record<IconoEstado, string> = {
  revision: '<circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="2.4"/>',
  proceso:
    '<circle cx="12" cy="12" r="5" fill="none" stroke="#fff" stroke-width="2"/><path d="M12 7a5 5 0 0 1 0 10z" fill="#fff"/>',
  activo: '<path d="M7.2 12.6l3.2 3.2L17 9.2" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  adoptado:
    '<path d="M12 17.6s-5.6-3.4-5.6-7.2a3 3 0 0 1 5.6-1.6 3 3 0 0 1 5.6 1.6c0 3.8-5.6 7.2-5.6 7.2z" fill="#fff"/>',
  perdido:
    '<path d="M12 7.2v5.6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="16.4" r="1.4" fill="#fff"/>',
  fallecido:
    '<path d="M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
};

export function glifoEstado(icono: IconoEstado): string {
  return GLIFOS[icono];
}

export function IconoEstadoAnimal({ icono, color, tamano = 20 }: Props) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="11" fill={color} />
      <g dangerouslySetInnerHTML={{ __html: GLIFOS[icono] }} />
    </svg>
  );
}
