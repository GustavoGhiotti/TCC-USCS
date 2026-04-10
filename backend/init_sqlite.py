from app.db.init_db import init_db, seed_db
from app.db.session import SessionLocal


def main() -> None:
    init_db()
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
    print("Banco SQLite inicializado com sucesso.")


if __name__ == "__main__":
    main()
