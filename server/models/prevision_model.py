# server/models/prevision_model.py
from __future__ import annotations

import os
import json
import warnings
from pathlib import Path
import sys
import traceback

# Headless plotting
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

import numpy as np
import pandas as pd
from joblib import dump
from sqlalchemy import create_engine

from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor

# XGBoost / Prophet optionnels
try:
    from xgboost import XGBRegressor  # type: ignore
    _HAS_XGB = True
except Exception:
    _HAS_XGB = False

try:
    from prophet import Prophet  # type: ignore
    _HAS_PROPHET = True
except Exception:
    _HAS_PROPHET = False

# Dossiers
THIS_DIR = Path(__file__).resolve().parent               # .../server/models
OUT_DIR  = THIS_DIR / "orders_forecast"                  # .../server/models/orders_forecast
OUT_DIR.mkdir(parents=True, exist_ok=True)

DAILY_CSV  = OUT_DIR / "predictions_daily.csv"
WEEKLY_CSV = OUT_DIR / "predictions_weekly.csv"
MONTH_CSV  = OUT_DIR / "predictions_monthly.csv"
SCORES_CSV = OUT_DIR / "model_scores.csv"
FI_CSV     = OUT_DIR / "feature_importance.csv"
ERROR_LOG  = OUT_DIR / "_last_error.txt"

# --------------------------------------------------------------------------
# Helpers DB
def get_engine():
    """Essaie d'abord le moteur Flask (current_app._ENGINE), sinon env vars."""
    try:
        from flask import current_app
        try:
            eng = current_app.config.get("_ENGINE")  # nécessite un app context
        except RuntimeError:
            eng = None
        if eng is not None:
            return eng
    except Exception:
        pass

    # Fallback: variables d'env (ou valeurs par défaut)
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        DB_USER = os.getenv("DB_USER", "postgres")
        DB_PASS = os.getenv("DB_PASS", "mel")
        DB_HOST = os.getenv("DB_HOST", "localhost")
        DB_PORT = os.getenv("DB_PORT", "5432")
        DB_NAME = os.getenv("DB_NAME", "logiops")
        db_url = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    return create_engine(db_url, pool_pre_ping=True)

# --------------------------------------------------------------------------
# Helpers numériques
def _to_num(s: pd.Series) -> pd.Series:
    return pd.to_numeric(s.astype(str).str.replace(",", ".", regex=False), errors="coerce")

def _safe_div(num: pd.Series, den: pd.Series) -> pd.Series:
    num = _to_num(num)
    den = _to_num(den).replace(0, np.nan)
    return num.div(den)

def wape(y_true, y_pred):
    y_true = _to_num(pd.Series(y_true)).fillna(0.0)
    y_pred = _to_num(pd.Series(y_pred)).fillna(0.0)
    denom = max(float(np.abs(y_true).sum()), 1e-8)
    return float(np.abs(y_true - y_pred).sum() / denom)

def mae(y_true, y_pred):
    y_true = _to_num(pd.Series(y_true)).fillna(0.0)
    y_pred = _to_num(pd.Series(y_pred)).fillna(0.0)
    return float(np.mean(np.abs(y_true - y_pred)))

def rmse(y_true, y_pred):
    y_true = _to_num(pd.Series(y_true)).fillna(0.0)
    y_pred = _to_num(pd.Series(y_pred)).fillna(0.0)
    return float(np.sqrt(np.mean((y_true - y_pred)**2)))

# --------------------------------------------------------------------------
# Données
def load_data() -> pd.DataFrame:
    eng = get_engine()
    df = pd.read_sql("SELECT * FROM clean_customer_orders", eng)

    # Normalisation nom / parsing
    if "creationdate" in df.columns:
        df = df.rename(columns={"creationdate": "day"})
    elif "date" in df.columns:
        df = df.rename(columns={"date": "day"})
    else:
        raise RuntimeError("La table clean_customer_orders doit contenir 'creationdate' ou 'date'.")

    df["day"] = pd.to_datetime(df["day"], errors="coerce")
    df = df[df["day"].notna()].copy()

    # Colonnes optionnelles
    if "quantity_units" not in df.columns:
        df["quantity_units"] = 1
    if "size_us" not in df.columns:
        df["size_us"] = np.nan
    if "ordernumber" not in df.columns:
        df["ordernumber"] = np.arange(len(df))

    # Coercition
    for c in ["quantity_units", "size_us", "ordernumber"]:
        df[c] = _to_num(df[c])

    return df

# --------------------------------------------------------------------------
# Features
def make_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["day"] = pd.to_datetime(df["day"]).dt.normalize()

    agg = df.groupby(["day"], as_index=False).agg(
        qty_day=("quantity_units", "sum"),
        avg_size=("size_us", "mean"),
        n_orders=("ordernumber", "nunique"),
    )

    agg["qty_day"]  = _to_num(agg["qty_day"]).fillna(0.0)
    agg["avg_size"] = _to_num(agg["avg_size"])
    agg["n_orders"] = _to_num(agg["n_orders"]).fillna(0.0)

    # Calendaires
    agg["dow"] = agg["day"].dt.dayofweek
    agg["week"] = agg["day"].dt.isocalendar().week.astype(int)
    agg["month"] = agg["day"].dt.month
    agg["is_month_start"] = agg["day"].dt.is_month_start.astype(int)
    agg["is_month_end"] = agg["day"].dt.is_month_end.astype(int)

    # Lags / rollings
    for lag in [1, 7, 14, 30]:
        agg[f"lag{lag}"] = agg["qty_day"].shift(lag)
    for win in [3, 7, 14, 30]:
        agg[f"roll{win}"] = agg["qty_day"].rolling(win, min_periods=1).mean().shift(1)

    agg["naive7"] = agg["lag7"]
    agg = agg.dropna().reset_index(drop=True)
    return agg

# --------------------------------------------------------------------------
# Split temporel
def split_data(df: pd.DataFrame, ratio: float = 0.8):
    if df.empty:
        raise RuntimeError("Pas assez de données après feature engineering.")
    unique_days = np.sort(df["day"].unique())
    if len(unique_days) < 20:
        warnings.warn("Peu d'historique: résultats potentiellement faibles.")
    split_idx = max(1, int(len(unique_days) * ratio))
    split_day = unique_days[split_idx - 1]
    train = df[df["day"] < split_day]
    test  = df[df["day"] >= split_day]
    if train.empty or test.empty:
        mid = df["day"].median()
        train = df[df["day"] < mid]
        test  = df[df["day"] >= mid]
    return train, test

# --------------------------------------------------------------------------
# Entraînement & exports
def train_models(train: pd.DataFrame, test: pd.DataFrame, outdir: Path | str = OUT_DIR):
    outdir = Path(outdir); outdir.mkdir(parents=True, exist_ok=True)

    X_train = train.drop(columns=["qty_day", "day"]).apply(_to_num).astype(float).fillna(0.0)
    y_train = _to_num(train["qty_day"]).astype(float).values
    X_test  = test.drop(columns=["qty_day", "day"]).apply(_to_num).astype(float).fillna(0.0)
    y_test  = _to_num(test["qty_day"]).astype(float).values

    models: dict[str, tuple[object | None, np.ndarray]] = {}
    results: list[list[object]] = []

    # Baselines
    for col, name in {"lag1": "Baseline lag1", "lag7": "Baseline lag7"}.items():
        if col in test.columns:
            yb = _to_num(test[col]).astype(float).values
            results.append([name, mae(y_test, yb), wape(y_test, yb), rmse(y_test, yb)])
            models[name] = (None, yb)

    # RandomForest
    try:
        rf = RandomForestRegressor(n_estimators=400, random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        y_pred_rf = rf.predict(X_test).astype(float)
        results.append(["RandomForest", mae(y_test, y_pred_rf), wape(y_test, y_pred_rf), rmse(y_test, y_pred_rf)])
        models["RandomForest"] = (rf, y_pred_rf)
    except Exception as e:
        warnings.warn(f"RandomForest échoué: {e}")

    # Gradient Boosting (XGB → sinon HGBR)
    try:
        if _HAS_XGB:
            gb = XGBRegressor(
                n_estimators=500, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8,
                max_depth=6, random_state=42, n_jobs=-1, tree_method="hist"
            )
        else:
            raise RuntimeError("XGBoost indisponible")
    except Exception:
        gb = HistGradientBoostingRegressor(max_iter=600, learning_rate=0.06, random_state=42)

    try:
        gb.fit(X_train, y_train)
        y_pred_gb = gb.predict(X_test).astype(float)
        results.append(["GradientBoosting", mae(y_test, y_pred_gb), wape(y_test, y_pred_gb), rmse(y_test, y_pred_gb)])
        models["GradientBoosting"] = (gb, y_pred_gb)
    except Exception as e:
        warnings.warn(f"GradientBoosting échoué: {e}")

    # Prophet optionnel
    if _HAS_PROPHET:
        try:
            df_prophet = train[["day", "qty_day"]].rename(columns={"day": "ds", "qty_day": "y"}).copy()
            df_prophet["ds"] = pd.to_datetime(df_prophet["ds"], errors="coerce")
            df_prophet["y"]  = _to_num(df_prophet["y"]).astype(float)
            model_prophet = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False)
            model_prophet.fit(df_prophet)
            future = pd.DataFrame({"ds": pd.to_datetime(test["day"], errors="coerce")})
            forecast = model_prophet.predict(future)
            y_pred_prophet = forecast["yhat"].astype(float).values
            results.append(["Prophet", mae(y_test, y_pred_prophet), wape(y_test, y_pred_prophet), rmse(y_test, y_pred_prophet)])
            models["Prophet"] = (model_prophet, y_pred_prophet)
        except Exception as e:
            print(f"⚠️ Prophet non utilisé : {e}")

    if not results:
        y_zero = np.zeros_like(y_test, dtype=float)
        results.append(["Zero", mae(y_test, y_zero), wape(y_test, y_zero), rmse(y_test, y_zero)])
        models["Zero"] = (None, y_zero)

    df_scores = pd.DataFrame(results, columns=["Model", "MAE", "WAPE", "RMSE"])
    for c in ["MAE", "WAPE", "RMSE"]:
        df_scores[c] = _to_num(df_scores[c]).astype(float)
    df_scores.to_csv(SCORES_CSV, index=False)

    best_row = df_scores.sort_values("MAE").iloc[0]
    best_model_name = str(best_row["Model"])
    best_model, y_pred_best = models.get(best_model_name, (None, _to_num(test.get("lag7", test["qty_day"])).astype(float).values))

    # Cast dur anti str/str
    y_test = _to_num(pd.Series(y_test)).values.astype(float)
    y_pred_best = _to_num(pd.Series(y_pred_best)).values.astype(float)

    if best_model_name not in ("Prophet", "Zero") and best_model is not None:
        dump(best_model, OUT_DIR / f"{best_model_name}.joblib")

    # Plot comparatif
    try:
        plt.figure(figsize=(8, 4))
        plt.plot(pd.to_datetime(test["day"]), y_test, label="Réel", linewidth=2, color="black")
        for m, (_, yhat) in models.items():
            plt.plot(pd.to_datetime(test["day"]), _to_num(pd.Series(yhat)).astype(float).values, label=m)
        plt.legend(); plt.title("Comparaison modèles vs réel")
        plt.tight_layout(); plt.savefig(OUT_DIR / "model_comparison.png"); plt.close()
    except Exception:
        pass

    # Feature importance
    try:
        if hasattr(best_model, "feature_importances_"):
            fi = pd.DataFrame({"Feature": X_train.columns, "Importance": best_model.feature_importances_})
            fi.sort_values("Importance", ascending=False).to_csv(FI_CSV, index=False)
            fi.head(15).plot(kind="bar", x="Feature", y="Importance", legend=False, figsize=(8,4), title="Feature importance")
            plt.tight_layout(); plt.savefig(OUT_DIR / "feature_importance.png"); plt.close()
    except Exception:
        pass

    # Re-cast sécu
    y_test = np.asarray(y_test, dtype=float)
    y_pred_best = np.asarray(y_pred_best, dtype=float)

    # Sorties DAILY
    day_dt = pd.to_datetime(test["day"], errors="coerce")
    df_daily = pd.DataFrame({
        "day": day_dt.dt.date,
        "qty_real": _to_num(pd.Series(y_test)).astype(float),
        "qty_pred": _to_num(pd.Series(y_pred_best)).astype(float),
    })
    df_daily.to_csv(DAILY_CSV, index=False)

    # WEEKLY (lundi)
    daily_dt = pd.DataFrame({
        "day": pd.to_datetime(df_daily["day"], errors="coerce"),
        "qty_real": _to_num(df_daily["qty_real"]).astype(float),
        "qty_pred": _to_num(df_daily["qty_pred"]).astype(float),
    }).dropna(subset=["day"])

    df_weekly = daily_dt.resample("W-MON", on="day").sum(numeric_only=True).reset_index()
    df_weekly["qty_real"] = _to_num(df_weekly["qty_real"]).astype(float)
    df_weekly["qty_pred"] = _to_num(df_weekly["qty_pred"]).astype(float)
    df_weekly["ape"] = (df_weekly["qty_real"] - df_weekly["qty_pred"]).abs()
    df_weekly["ape"] = _safe_div(df_weekly["ape"], df_weekly["qty_real"]).fillna(0.0)
    df_weekly.to_csv(WEEKLY_CSV, index=False)

    # MONTHLY
    df_monthly = daily_dt.resample("M", on="day").sum(numeric_only=True).reset_index()
    df_monthly["qty_real"] = _to_num(df_monthly["qty_real"]).astype(float)
    df_monthly["qty_pred"] = _to_num(df_monthly["qty_pred"]).astype(float)
    df_monthly["ape"] = (df_monthly["qty_real"] - df_monthly["qty_pred"]).abs()
    df_monthly["ape"] = _safe_div(df_monthly["ape"], df_monthly["qty_real"]).fillna(0.0)
    df_monthly.to_csv(MONTH_CSV, index=False)

    # KPI globaux
    abs_err = (_to_num(df_daily["qty_real"]) - _to_num(df_daily["qty_pred"])).abs()
    denom   = _to_num(df_daily["qty_real"]).clip(lower=1e-8)
    accuracy = 1 - _safe_div(abs_err, denom).mean()
    accuracy = float(0.0 if pd.isna(accuracy) else accuracy)

    service_level = _safe_div(abs_err, denom).le(0.20).mean()
    service_level = float(0.0 if pd.isna(service_level) else service_level)

    metadata = {
        "best_model": best_model_name,
        "metrics": df_scores.to_dict(orient="records"),
        "kpi": {"accuracy": accuracy, "service_level_20": service_level},
        "train_start": str(train["day"].min()),
        "train_end": str(train["day"].max()),
        "test_start": str(test["day"].min()),
        "test_end": str(test["day"].max()),
        "n_train": int(len(train)),
        "n_test": int(len(test)),
    }
    with open(OUT_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("✅ Entraînement terminé. Résultats dans", str(OUT_DIR))

# --------------------------------------------------------------------------
# Main
if __name__ == "__main__":
    try:
        df = load_data()
        df_feat = make_features(df)
        train, test = split_data(df_feat)
        train_models(train, test, outdir=OUT_DIR)
    except Exception as e:
        msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
        try:
            ERROR_LOG.write_text(msg, encoding="utf-8")
        except Exception:
            pass
        print(msg, file=sys.stderr)
        raise
