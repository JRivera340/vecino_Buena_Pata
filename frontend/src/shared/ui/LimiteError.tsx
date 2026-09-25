import { Component, type ErrorInfo, type ReactNode } from 'react';

const CLAVE_RECARGA = 'vbp_recarga';
const ESPERA_MS = 15_000;

export function esErrorDeCarga(error: unknown): boolean {
  const mensaje = error instanceof Error ? error.message : String(error);
  return /dynamically imported module|Importing a module script failed|Failed to fetch dynamically|error loading dynamically/i.test(
    mensaje,
  );
}

// Tras un despliegue, una pestana abierta apunta a archivos que ya no existen.
// Se recarga una sola vez para traer la version nueva.
export function recargarUnaVez(): boolean {
  try {
    const ultima = Number(sessionStorage.getItem(CLAVE_RECARGA) ?? 0);
    if (Date.now() - ultima < ESPERA_MS) {
      return false;
    }
    sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

interface Estado {
  fallo: boolean;
}

export class LimiteError extends Component<{ children: ReactNode }, Estado> {
  state: Estado = { fallo: false };

  static getDerivedStateFromError(): Estado {
    return { fallo: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (esErrorDeCarga(error)) {
      recargarUnaVez();
    } else {
      console.error(error, info.componentStack);
    }
  }

  render() {
    if (!this.state.fallo) {
      return this.props.children;
    }
    return (
      <main className="contenedor max-w-[56ch] space-y-4 py-16">
        <h1 className="text-h1">Algo salió mal al mostrar la página</h1>
        <p className="text-tinta-suave">
          Puede que haya una versión nueva del sistema. Recarga la página para continuar.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex min-h-[44px] items-center rounded bg-verde-profundo px-5 font-semibold text-white hover:bg-verde-oscuro"
        >
          Recargar la página
        </button>
      </main>
    );
  }
}
