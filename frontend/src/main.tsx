import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './estilos/index.css';
import { LimiteError, recargarUnaVez } from './shared/ui/LimiteError';

window.addEventListener('vite:preloadError', (evento) => {
  if (recargarUnaVez()) {
    evento.preventDefault();
  }
});

createRoot(document.getElementById('raiz') as HTMLElement).render(
  <StrictMode>
    <LimiteError>
      <App />
    </LimiteError>
  </StrictMode>,
);
