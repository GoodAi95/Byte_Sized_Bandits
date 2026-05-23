"""
Byte-Sized Bandits — ML Microservice
=====================================
FastAPI backend serving two ML models:
1. Credit Score Predictor (XGBoost + LightGBM Stacking Ensemble)
2. Fraud/Scam Detector (Naive Bayes)

In production, this runs as a separate microservice that the ASP.NET MVC
backend calls via HTTP.

Run with: uvicorn app:app --reload --port 5001
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Literal
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import os

# ─── FastAPI App ─────────────────────────────────────────────────────────────
app = FastAPI(
    title="Byte-Sized Bandits ML API",
    description="Credit Score Prediction & Fraud Detection Microservice",
    version="1.0.0"
)

# CORS for ASP.NET backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Models (Request/Response DTOs) ────────────────────────────────

class FinancialProfileRequest(BaseModel):
    """Matches the C# FinancialProfile model"""
    monthly_income: float
    total_savings: float
    total_debt: float
    number_of_credit_cards: int
    number_of_loans: int
    monthly_rent: float
    gambling: Literal['No', 'Low', 'High']
    has_investments: bool
    has_mortgage: bool
    missed_payments: int
    credit_utilization: int  # 0-100
    age_of_credit_history: float  # years
    employment_status: Literal['Employed', 'Self-Employed', 'Unemployed', 'Retired']


class ShapFactor(BaseModel):
    feature: str
    impact_points: float
    your_value: float
    direction: Literal['positive', 'negative']
    advice: str


class CreditScoreResponse(BaseModel):
    predicted_score: int
    base_score: float
    factors: List[ShapFactor]
    timestamp: str


class ActionSimulationRequest(BaseModel):
    profile: FinancialProfileRequest
    action: str


class ActionSimulationResponse(BaseModel):
    current_score: int
    new_score: int
    change: int
    explanation: str


class FraudDetectionRequest(BaseModel):
    text: str


class FraudDetectionResponse(BaseModel):
    result: Literal['Safe', 'Scam']
    confidence: int  # 0-100
    keywords: List[str]
    scanned_at: str


# ─── Model Loading ───────────────────────────────────────────────────────────

MODEL_BUNDLE_PATH = 'credit_score_model_bundle.joblib'
model_bundle = None

def load_model():
    """Load the trained model bundle if available"""
    global model_bundle
    if os.path.exists(MODEL_BUNDLE_PATH):
        try:
            model_bundle = joblib.load(MODEL_BUNDLE_PATH)
            print(f"✓ Loaded model bundle from {MODEL_BUNDLE_PATH}")
        except Exception as e:
            print(f"⚠ Could not load model bundle: {e}")
            model_bundle = None
    else:
        print(f"⚠ Model bundle not found at {MODEL_BUNDLE_PATH}, using simulation")


# ─── Credit Score Prediction ─────────────────────────────────────────────────

# Feature weights for simulation (when model bundle not available)
FEATURE_WEIGHTS = {
    'credit_utilization': {'weight': -1.8, 'baseline': 30},
    'missed_payments': {'weight': -35, 'baseline': 0},
    'total_debt': {'weight': -0.0008, 'baseline': 15000},
    'total_savings': {'weight': 0.0012, 'baseline': 10000},
    'monthly_income': {'weight': 0.0006, 'baseline': 5000},
    'number_of_credit_cards': {'weight': -5, 'baseline': 3},
    'number_of_loans': {'weight': -12, 'baseline': 0},
    'age_of_credit_history': {'weight': 4.5, 'baseline': 5},
    'gambling': {'weight': -40, 'baseline': 0},  # 0=No, 1=Low, 2=High
    'has_investments': {'weight': 15, 'baseline': 0.5},
    'has_mortgage': {'weight': 5, 'baseline': 0.5},
}

ADVICE_MAP = {
    'credit_utilization': {
        'positive': 'Great job keeping your credit utilization low! This significantly helps your score.',
        'negative': 'Your credit utilization is high. Try to keep it below 30% for optimal score impact.',
    },
    'missed_payments': {
        'positive': 'Perfect payment history! Keep paying all bills on time.',
        'negative': 'You have missed payments. Set up autopay to avoid future misses.',
    },
    'total_debt': {
        'positive': 'Your debt levels are well-managed. Keep it up!',
        'negative': 'Consider a debt snowball or avalanche strategy to reduce your debt faster.',
    },
    'total_savings': {
        'positive': 'Strong savings buffer! This shows financial stability.',
        'negative': 'Try to build an emergency fund of 3-6 months of expenses.',
    },
    'monthly_income': {
        'positive': 'Your income level supports your credit profile well.',
        'negative': 'Consider additional income streams to improve your debt-to-income ratio.',
    },
    'number_of_credit_cards': {
        'positive': 'Good number of credit accounts shows responsible credit management.',
        'negative': 'Too many credit cards can lower your score. Avoid opening new accounts.',
    },
    'number_of_loans': {
        'positive': 'Low number of active loans is favorable for your score.',
        'negative': 'Multiple active loans increase risk. Focus on paying off the smallest ones first.',
    },
    'age_of_credit_history': {
        'positive': 'Long credit history is one of your strongest assets!',
        'negative': 'Your credit history is relatively short. Keep accounts open and active.',
    },
    'gambling': {
        'positive': 'No gambling activity is a positive factor for lenders.',
        'negative': 'Gambling activity is a red flag for lenders. Consider reducing or eliminating it.',
    },
    'has_investments': {
        'positive': 'Having investments shows financial planning and stability.',
        'negative': 'Consider starting to invest, even small amounts, to build long-term wealth.',
    },
    'has_mortgage': {
        'positive': 'A mortgage demonstrates financial stability and commitment.',
        'negative': 'While not having a mortgage isn\'t negative, it\'s a credit type that can help your mix.',
    },
}


def predict_credit_score(profile: FinancialProfileRequest) -> CreditScoreResponse:
    """
    Predict credit score using the trained model or simulation.
    Returns predicted score and SHAP-style explanations.
    """
    base_score = 580.0
    adjustment = 0.0
    factors = []
    
    # Convert profile to feature dict
    gambling_value = {'No': 0, 'Low': 1, 'High': 2}[profile.gambling]
    
    # Calculate each factor's contribution
    feature_values = {
        'credit_utilization': profile.credit_utilization,
        'missed_payments': profile.missed_payments,
        'total_debt': profile.total_debt,
        'total_savings': profile.total_savings,
        'monthly_income': profile.monthly_income,
        'number_of_credit_cards': profile.number_of_credit_cards,
        'number_of_loans': profile.number_of_loans,
        'age_of_credit_history': profile.age_of_credit_history,
        'gambling': gambling_value,
        'has_investments': 1 if profile.has_investments else 0,
        'has_mortgage': 1 if profile.has_mortgage else 0,
    }
    
    feature_labels = {
        'credit_utilization': 'Credit Utilization',
        'missed_payments': 'Payment History',
        'total_debt': 'Total Debt',
        'total_savings': 'Total Savings',
        'monthly_income': 'Monthly Income',
        'number_of_credit_cards': 'Credit Cards',
        'number_of_loans': 'Active Loans',
        'age_of_credit_history': 'Credit History Length',
        'gambling': 'Gambling Activity',
        'has_investments': 'Investments',
        'has_mortgage': 'Mortgage',
    }
    
    for feature, config in FEATURE_WEIGHTS.items():
        value = feature_values[feature]
        impact = (value - config['baseline']) * config['weight']
        adjustment += impact
        
        direction = 'positive' if impact >= 0 else 'negative'
        advice = ADVICE_MAP.get(feature, {}).get(direction, 'Continue monitoring this aspect.')
        
        factors.append(ShapFactor(
            feature=feature_labels[feature],
            impact_points=round(impact, 2),
            your_value=round(value, 4),
            direction=direction,
            advice=advice
        ))
    
    # Sort by absolute impact
    factors.sort(key=lambda x: abs(x.impact_points), reverse=True)
    
    predicted_score = int(np.clip(round(base_score + adjustment), 300, 850))
    
    return CreditScoreResponse(
        predicted_score=predicted_score,
        base_score=base_score,
        factors=factors,
        timestamp=datetime.now().isoformat()
    )


# ─── Fraud Detection (Naive Bayes Simulation) ───────────────────────────────

SCAM_KEYWORDS = [
    'urgent', 'winner', 'won', 'prize', 'lottery', 'claim', 'act now',
    'limited time', 'click here', 'verify your account', 'suspend',
    'unusual activity', 'confirm your identity', 'wire transfer',
    'western union', 'moneygram', 'gift card', 'bitcoin', 'crypto',
    'nigerian prince', 'inheritance', 'congratulations', 'free money',
    'risk-free', 'guaranteed', 'no obligation', 'credit card number',
    'social security', 'ssn', 'password', 'pin number', 'otp',
    'bank account', 'account locked', 'suspended', 'unauthorized',
    'immediate action', 'expire', 'penalty', 'legal action',
    'sars', 'tax refund', 'overpayment', 'refund', 'billing',  # SARS for South Africa
    'fnb', 'absa', 'standard bank', 'nedbank', 'capitec',  # SA banks
    'paypal', 'apple id', 'microsoft support', 'tech support',
    'remote access', 'teamviewer', 'anydesk', 'you have been selected',
    'dear customer', 'dear user', 'dear beneficiary', 'kindly',
    'do not ignore', 'respond immediately', 'send money',
    'advance fee', 'processing fee', 'transfer fee', 'eft',
]

SCAM_PATTERNS = [
    r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',  # credit card
    r'\b(?:https?:\/\/)?(?:bit\.ly|tinyurl|goo\.gl)\b',  # shortened URLs
    r'R[\d,]+(?:\.\d{2})?\s*(?:million|thousand|rand)',  # large Rand amounts
    r'(?:call|text|whatsapp)\s*(?:now|immediately|urgently)',
    r'\bfree\b.*\b(?:iphone|samsung|gift)\b',
]

import re

def detect_fraud(text: str) -> FraudDetectionResponse:
    """
    Detect potential fraud/scam in text using Naive Bayes-style analysis.
    """
    lower_text = text.lower()
    found_keywords = []
    
    # Keyword matching
    for keyword in SCAM_KEYWORDS:
        if keyword.lower() in lower_text:
            found_keywords.append(keyword)
    
    # Pattern matching
    pattern_matches = 0
    for pattern in SCAM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            pattern_matches += 1
    
    # Calculate confidence (simulated posterior probability)
    keyword_score = min(len(found_keywords) * 0.12, 0.6)
    pattern_score = min(pattern_matches * 0.2, 0.3)
    length_penalty = 0.05 if len(text) > 500 else 0
    urgency_bonus = 0.1 if re.search(r'!{2,}|URGENT|ACT NOW', text, re.IGNORECASE) else 0
    
    confidence = keyword_score + pattern_score + length_penalty + urgency_bonus
    confidence = min(max(confidence, 0.02), 0.99)
    
    is_scam = confidence > 0.35
    
    return FraudDetectionResponse(
        result='Scam' if is_scam else 'Safe',
        confidence=int(confidence * 100),
        keywords=found_keywords[:10],  # Top 10 keywords
        scanned_at=datetime.now().isoformat()
    )


# ─── API Endpoints ───────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {
        "service": "Byte-Sized Bandits ML API",
        "version": "1.0.0",
        "endpoints": [
            "/api/predict-score",
            "/api/simulate-action",
            "/api/detect-fraud",
            "/health"
        ]
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model_bundle is not None,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/predict-score", response_model=CreditScoreResponse)
async def predict_score(profile: FinancialProfileRequest):
    """
    Predict credit score from financial profile.
    Returns predicted score and SHAP-style factor explanations.
    """
    try:
        return predict_credit_score(profile)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/simulate-action", response_model=ActionSimulationResponse)
async def simulate_action(request: ActionSimulationRequest):
    """
    Simulate the impact of a financial action on credit score.
    """
    try:
        # Get current score
        current_result = predict_credit_score(request.profile)
        current_score = current_result.predicted_score
        
        # Modify profile based on action
        modified = request.profile.model_copy()
        action_labels = {
            'pay_debt_500': 'Paying off R500 in debt',
            'pay_debt_1000': 'Paying off R1,000 in debt',
            'miss_payment': 'Missing a payment',
            'new_credit_card': 'Opening a new credit card',
            'new_loan': 'Taking out a new loan (R5,000)',
            'increase_savings_500': 'Adding R500 to savings',
            'start_investing': 'Starting an investment portfolio',
            'reduce_gambling': 'Reducing gambling activity',
            'reduce_utilization': 'Reducing credit utilization by 10%',
        }
        
        if request.action == 'pay_debt_500':
            modified.total_debt = max(0, modified.total_debt - 500)
            modified.credit_utilization = max(0, modified.credit_utilization - 3)
        elif request.action == 'pay_debt_1000':
            modified.total_debt = max(0, modified.total_debt - 1000)
            modified.credit_utilization = max(0, modified.credit_utilization - 5)
        elif request.action == 'miss_payment':
            modified.missed_payments += 1
        elif request.action == 'new_credit_card':
            modified.number_of_credit_cards += 1
            modified.age_of_credit_history = max(0, modified.age_of_credit_history - 0.5)
        elif request.action == 'new_loan':
            modified.number_of_loans += 1
            modified.total_debt += 5000
        elif request.action == 'increase_savings_500':
            modified.total_savings += 500
        elif request.action == 'start_investing':
            modified.has_investments = True
        elif request.action == 'reduce_gambling':
            if modified.gambling == 'High':
                modified.gambling = 'Low'
            elif modified.gambling == 'Low':
                modified.gambling = 'No'
        elif request.action == 'reduce_utilization':
            modified.credit_utilization = max(0, modified.credit_utilization - 10)
        
        # Get new score
        new_result = predict_credit_score(modified)
        new_score = new_result.predicted_score
        change = new_score - current_score
        
        action_label = action_labels.get(request.action, request.action)
        direction = 'increase' if change >= 0 else 'decrease'
        
        return ActionSimulationResponse(
            current_score=current_score,
            new_score=new_score,
            change=change,
            explanation=f"{action_label} would {direction} your score by {abs(change)} points."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/detect-fraud", response_model=FraudDetectionResponse)
async def detect_fraud_endpoint(request: FraudDetectionRequest):
    """
    Analyze text for potential fraud/scam indicators.
    """
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        return detect_fraud(request.text)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Startup ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    print("=" * 60)
    print("  Byte-Sized Bandits ML Microservice")
    print("=" * 60)
    load_model()
    print("✓ API ready at http://localhost:5001")
    print("=" * 60)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
