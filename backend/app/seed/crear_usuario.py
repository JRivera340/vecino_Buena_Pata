"""Crea un usuario real en la base de datos.

No hay endpoint de gestion de usuarios todavia (ver DEUDA-TECNICA.md), asi
que los primeros usuarios de cada rol se cargan a mano con este script:

    railway run --service vbp-backend python -m app.seed.crear_usuario \
        --nombre "Nombre Apellido" --username usuario --rol ADMIN
"""

import argparse
import getpass

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models.enums import RolUsuarioEnum
from app.models.usuario import Usuario


def crear_usuario(nombre: str, username: str, rol: RolUsuarioEnum, password: str) -> None:
    db = SessionLocal()
    try:
        if db.query(Usuario).filter(Usuario.username == username).first():
            raise SystemExit(f"Ya existe un usuario con username '{username}'.")

        usuario = Usuario(
            nombre=nombre,
            rol=rol,
            username=username,
            password_hash=hash_password(password),
        )
        db.add(usuario)
        db.commit()
        print(f"Usuario '{username}' creado con rol {rol.value}.")
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nombre", required=True)
    parser.add_argument("--username", required=True)
    parser.add_argument("--rol", required=True, choices=[r.value for r in RolUsuarioEnum])
    args = parser.parse_args()

    password = getpass.getpass("Contrasena para el nuevo usuario: ")
    confirmacion = getpass.getpass("Repetir contrasena: ")
    if password != confirmacion:
        raise SystemExit("Las contrasenas no coinciden.")

    crear_usuario(args.nombre, args.username, RolUsuarioEnum(args.rol), password)


if __name__ == "__main__":
    main()
