from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email.lower())
        return self.db.scalar(stmt)

    def get_by_id(self, user_id: str) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return self.db.scalar(stmt)

    def create(self, *, email: str, senha_hash: str, role: str) -> User:
        user = User(email=email.lower(), senha_hash=senha_hash, role=role, ativo=True)
        self.db.add(user)
        self.db.flush()
        return user
