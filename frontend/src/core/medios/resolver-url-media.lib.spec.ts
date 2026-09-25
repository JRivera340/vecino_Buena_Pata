import { resolverUrlMedia } from './resolver-url-media.lib';

describe('resolverUrlMedia', () => {
  it('devuelve null si la ruta es null', () => {
    expect(resolverUrlMedia(null)).toBeNull();
  });

  it('devuelve null si la ruta es una cadena vacía', () => {
    expect(resolverUrlMedia('')).toBeNull();
  });

  it('arma la URL completa a partir del nombre de archivo', () => {
    expect(resolverUrlMedia('foto123.jpg')).toBe('http://localhost:8000/media/foto123.jpg');
  });
});
