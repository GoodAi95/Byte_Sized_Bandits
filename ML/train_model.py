"""
Byte-Sized Bandits — Credit Score Model Training Pipeline
==========================================================
This script trains the XGBoost + LightGBM stacking ensemble model
for credit score prediction with SHAP explainability.

Run with: python train_model.py

Prerequisites:
- Place your credit_score.csv dataset in the same directory
- Install requirements: pip install -r requirements.txt
"""

import warnings
warnings.filterwarnings('ignore')

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import shap
import joblib

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.linear_model import Ridge
from sklearn.ensemble import StackingRegressor
from sklearn.metrics import mean_squared_error, r2_score

import xgboost as xgb
import lightgbm as lgb

RANDOM_STATE = 42

def main():
    print("=" * 60)
    print("  Byte-Sized Bandits — Credit Score Model Training")
    print("=" * 60)
    
    # ─── Data Loading ────────────────────────────────────────────────────────
    print("\n[1/7] Loading data...")
    try:
        df = pd.read_csv('credit_score.csv')
        print(f"     ✓ Loaded {df.shape[0]} rows, {df.shape[1]} columns")
    except FileNotFoundError:
        print("     ✗ Error: credit_score.csv not found!")
        print("     Please place the dataset in the ML folder.")
        return
    
    # ─── Preprocessing ───────────────────────────────────────────────────────
    print("\n[2/7] Preprocessing...")
    
    # Drop identifier and leakage columns
    cols_to_drop = ['CUST_ID', 'DEFAULT']
    df = df.drop(columns=[c for c in cols_to_drop if c in df.columns])
    
    TARGET = 'CREDIT_SCORE'
    y = df[TARGET]
    X = df.drop(columns=[TARGET])
    
    CAT_FEATURES = ['CAT_GAMBLING'] if 'CAT_GAMBLING' in X.columns else []
    NUM_FEATURES = [c for c in X.columns if c not in CAT_FEATURES]
    
    print(f"     Features: {X.shape[1]} ({len(CAT_FEATURES)} categorical, {len(NUM_FEATURES)} numerical)")
    print(f"     Target: {TARGET} (min={y.min()}, max={y.max()}, mean={y.mean():.1f})")
    
    # Check for nulls
    null_count = X.isnull().sum().sum()
    if null_count > 0:
        print(f"     ⚠ Warning: {null_count} null values found - filling with median")
        X = X.fillna(X.median())
    else:
        print("     ✓ No missing values")
    
    # Preprocessor
    if CAT_FEATURES:
        preprocessor = ColumnTransformer(
            transformers=[
                ('ohe', OneHotEncoder(drop='first', sparse_output=False, handle_unknown='ignore'), CAT_FEATURES)
            ],
            remainder='passthrough'
        )
    else:
        preprocessor = ColumnTransformer(
            transformers=[],
            remainder='passthrough'
        )
    
    # Train/Test split
    y_bins = pd.qcut(y, q=10, labels=False, duplicates='drop')
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y_bins
    )
    print(f"     Train: {X_train.shape[0]} rows | Test: {X_test.shape[0]} rows")
    
    # Transform
    X_train_pre = preprocessor.fit_transform(X_train)
    X_test_pre = preprocessor.transform(X_test)
    
    # Get feature names
    if CAT_FEATURES:
        ohe_names = preprocessor.named_transformers_['ohe'].get_feature_names_out(CAT_FEATURES).tolist()
        FEATURE_NAMES = ohe_names + NUM_FEATURES
    else:
        FEATURE_NAMES = NUM_FEATURES
    
    print(f"     ✓ Total features after encoding: {len(FEATURE_NAMES)}")
    
    # ─── Model Training ──────────────────────────────────────────────────────
    print("\n[3/7] Training XGBoost base learner...")
    xgb_model = xgb.XGBRegressor(
        n_estimators=1000,
        learning_rate=0.02,
        max_depth=6,
        min_child_weight=3,
        subsample=0.80,
        colsample_bytree=0.70,
        reg_alpha=0.05,
        reg_lambda=1.50,
        gamma=0.10,
        early_stopping_rounds=50,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbosity=0,
    )
    xgb_model.fit(X_train_pre, y_train, eval_set=[(X_test_pre, y_test)], verbose=False)
    xgb_best = xgb_model.best_iteration
    print(f"     ✓ Best iteration: {xgb_best}")
    
    print("\n[4/7] Training LightGBM base learner...")
    lgb_model = lgb.LGBMRegressor(
        n_estimators=1000,
        learning_rate=0.02,
        max_depth=6,
        num_leaves=63,
        min_child_samples=10,
        subsample=0.80,
        colsample_bytree=0.70,
        reg_alpha=0.05,
        reg_lambda=1.50,
        random_state=RANDOM_STATE,
        n_jobs=-1,
        verbose=-1,
    )
    lgb_model.fit(
        X_train_pre, y_train,
        eval_set=[(X_test_pre, y_test)],
        callbacks=[lgb.early_stopping(50, verbose=False), lgb.log_evaluation(period=-1)]
    )
    lgb_best = lgb_model.best_iteration_
    print(f"     ✓ Best iteration: {lgb_best}")
    
    # Final models without early stopping for stacking
    xgb_final = xgb.XGBRegressor(
        n_estimators=xgb_best, learning_rate=0.02, max_depth=6,
        min_child_weight=3, subsample=0.80, colsample_bytree=0.70,
        reg_alpha=0.05, reg_lambda=1.50, gamma=0.10,
        random_state=RANDOM_STATE, n_jobs=-1, verbosity=0
    )
    lgb_final = lgb.LGBMRegressor(
        n_estimators=lgb_best, learning_rate=0.02, max_depth=6, num_leaves=63,
        min_child_samples=10, subsample=0.80, colsample_bytree=0.70,
        reg_alpha=0.05, reg_lambda=1.50,
        random_state=RANDOM_STATE, n_jobs=-1, verbose=-1
    )
    
    print("\n[5/7] Training stacking ensemble...")
    stacking_model = StackingRegressor(
        estimators=[('xgb', xgb_final), ('lgb', lgb_final)],
        final_estimator=Ridge(alpha=1.0),
        cv=5,
        n_jobs=-1,
        passthrough=False,
    )
    stacking_model.fit(X_train_pre, y_train)
    print("     ✓ Stacking ensemble trained")
    
    # ─── Evaluation ──────────────────────────────────────────────────────────
    print("\n[6/7] Evaluating models...")
    
    def evaluate(name, model, X_tr, y_tr, X_te, y_te):
        tr_pred = model.predict(X_tr)
        te_pred = model.predict(X_te)
        tr_rmse = np.sqrt(mean_squared_error(y_tr, tr_pred))
        te_rmse = np.sqrt(mean_squared_error(y_te, te_pred))
        tr_r2 = r2_score(y_tr, tr_pred)
        te_r2 = r2_score(y_te, te_pred)
        print(f"     {name:<25} Train RMSE: {tr_rmse:6.2f}, R²: {tr_r2:.4f} | "
              f"Test RMSE: {te_rmse:6.2f}, R²: {te_r2:.4f}")
        return te_pred
    
    evaluate('XGBoost', xgb_model, X_train_pre, y_train, X_test_pre, y_test)
    evaluate('LightGBM', lgb_model, X_train_pre, y_train, X_test_pre, y_test)
    test_preds = evaluate('Stacking Ensemble ★', stacking_model, X_train_pre, y_train, X_test_pre, y_test)
    
    # ─── SHAP Explainer ──────────────────────────────────────────────────────
    print("\n[7/7] Building SHAP explainer...")
    xgb_base_learner = stacking_model.estimators_[0]
    shap_explainer = shap.TreeExplainer(xgb_base_learner, feature_names=FEATURE_NAMES)
    print("     ✓ SHAP TreeExplainer initialized")
    
    # ─── Save Model Bundle ───────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  Saving model bundle...")
    
    model_bundle = {
        'model': stacking_model,
        'preprocessor': preprocessor,
        'shap_explainer': shap_explainer,
        'feature_names': FEATURE_NAMES,
        'cat_features': CAT_FEATURES,
        'num_features': NUM_FEATURES,
        'target': TARGET,
    }
    
    joblib.dump(model_bundle, 'credit_score_model_bundle.joblib', compress=3)
    print("  ✓ Saved: credit_score_model_bundle.joblib")
    
    # ─── Quick Verification ──────────────────────────────────────────────────
    print("\n  Verifying round-trip load...")
    loaded = joblib.load('credit_score_model_bundle.joblib')
    sample_row = X_test.iloc[0:1]
    sample_pre = loaded['preprocessor'].transform(sample_row)
    verify_score = int(np.clip(round(loaded['model'].predict(sample_pre)[0]), 300, 850))
    actual = int(y_test.iloc[0])
    print(f"  ✓ Sample prediction: {verify_score} (actual: {actual})")
    
    print("\n" + "=" * 60)
    print("  Training complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
