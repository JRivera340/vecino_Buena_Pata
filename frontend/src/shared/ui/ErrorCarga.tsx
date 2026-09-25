import { Alerta } from './Alerta';
import { Boton } from './Boton';

interface ErrorCargaProps {
  titulo: string;
  alReintentar: () => void;
}

export function ErrorCarga({ titulo, alReintentar }: ErrorCargaProps) {
  return (
    <Alerta tipo="error" titulo={titulo}>
      <p>Revisa tu conexión e inténtalo otra vez.</p>
      <Boton className="mt-3" tamano="pequeno" variante="secundario" onClick={alReintentar}>
        Reintentar
      </Boton>
    </Alerta>
  );
}
