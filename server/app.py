from __future__ import annotations

import os
from datetime import timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
from passlib.hash import bcrypt

from models import Base, User, TypeProfil


# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "kdh")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "logiops")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-prod")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")


# ----------------------------------------------------------------------------
# App / DB / Auth setup
# ----------------------------------------------------------------------------
app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = JWT_SECRET_KEY
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=12)

CORS(app, resources={r"/api/*": {"origins": CORS_ORIGIN}})

jwt = JWTManager(app)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))


@app.before_first_request
def init_db() -> None:
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)


@app.teardown_appcontext
def remove_session(exception=None):
    SessionLocal.remove()


# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
ALLOWED_PROFILES = {p.value for p in TypeProfil}


def validate_profile(value: str) -> str:
    v = (value or "").strip().lower()
    if v not in ALLOWED_PROFILES:
        raise ValueError(
            f"type_profil invalide. Attendu: {', '.join(sorted(ALLOWED_PROFILES))}"
        )
    return v


# ----------------------------------------------------------------------------
# Routes
# ----------------------------------------------------------------------------
@app.get("/api/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("select 1"))
        return jsonify(status="ok"), 200
    except Exception as e:
        return jsonify(status="error", error=str(e)), 500


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(force=True) or {}
    nom = (data.get("nom") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or data.get("mot_de_passe") or ""
    type_profil = data.get("type_profil") or data.get("profile") or ""

    if not nom or not email or not password or not type_profil:
        return jsonify(message="Champs requis manquants"), 400

    try:
        type_profil = validate_profile(type_profil)
    except ValueError as ve:
        return jsonify(message=str(ve)), 400

    session = SessionLocal()
    try:
        existing = (
            session.query(User)
            .filter(User.email == email, User.type_profil == type_profil)
            .first()
        )
        if existing:
            return (
                jsonify(message="Un utilisateur avec cet email et ce profil existe déjà"),
                409,
            )

        pwd_hash = bcrypt.hash(password)
        user = User(
            nom=nom,
            email=email,
            mot_de_passe_hash=pwd_hash,
            type_profil=type_profil,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "email": user.email,
                "type_profil": user.type_profil,
                "nom": user.nom,
            },
        )
        return (
            jsonify(
                id=str(user.id), nom=user.nom, email=user.email, type_profil=user.type_profil, token=token
            ),
            201,
        )
    except Exception as e:
        session.rollback()
        return jsonify(message="Erreur serveur", error=str(e)), 500
    finally:
        session.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(force=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or data.get("mot_de_passe") or ""
    type_profil = data.get("type_profil") or data.get("profile") or ""

    if not email or not password or not type_profil:
        return jsonify(message="Champs requis manquants"), 400

    try:
        type_profil = validate_profile(type_profil)
    except ValueError as ve:
        return jsonify(message=str(ve)), 400

    session = SessionLocal()
    try:
        user = (
            session.query(User)
            .filter(User.email == email, User.type_profil == type_profil)
            .first()
        )
        if not user or not bcrypt.verify(password, user.mot_de_passe_hash):
            return jsonify(message="Identifiants invalides"), 401

        token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "email": user.email,
                "type_profil": user.type_profil,
                "nom": user.nom,
            },
        )
        return (
            jsonify(
                id=str(user.id), nom=user.nom, email=user.email, type_profil=user.type_profil, token=token
            ),
            200,
        )
    except Exception as e:
        return jsonify(message="Erreur serveur", error=str(e)), 500
    finally:
        session.close()


@app.get("/api/auth/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    session = SessionLocal()
    try:
        user = session.get(User, user_id)
        if not user:
            return jsonify(message="Utilisateur introuvable"), 404
        return (
            jsonify(id=str(user.id), nom=user.nom, email=user.email, type_profil=user.type_profil, date_creation=user.date_creation.isoformat()),
            200,
        )
    finally:
        session.close()


if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=8000, debug=True)
