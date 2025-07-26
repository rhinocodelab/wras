from sqlalchemy.orm import Session
from app.models.user import User
from app.core.security.security import verify_password, get_password_hash
from app.schemas.user import UserCreate

def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_username(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_default_user(db: Session):
    """Create default admin user if it doesn't exist"""
    existing_user = get_user_by_username(db, "admin")
    if not existing_user:
        default_user = UserCreate(username="admin", password="wras@dhh")
        create_user(db, default_user)
        return True
    return False 