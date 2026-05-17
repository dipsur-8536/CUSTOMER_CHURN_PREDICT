"""
Advanced Ensemble churn model trainer.
Features: age, monthly_spend, satisfaction_score
Uses SMOTE and a VotingClassifier (XGBoost, RandomForest, ExtraTrees)
"""
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, VotingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib

print("Loading dataset...")
df = pd.read_csv("churn_uplift_synthetic_dataset (2).csv")

FEATURES = ['age', 'monthly_spend', 'satisfaction_score']

for col in FEATURES:
    df[col] = pd.to_numeric(df[col], errors='coerce')
    df[col] = df[col].fillna(df[col].median())

X = df[FEATURES]
y = df['churn'].astype(int)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

print("Applying SMOTE...")
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train_s, y_train)

print("Training ensemble model...")
rf = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
xgb = XGBClassifier(n_estimators=150, max_depth=6, learning_rate=0.05, random_state=42, n_jobs=-1)
et = ExtraTreesClassifier(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)

model = VotingClassifier(
    estimators=[('rf', rf), ('xgb', xgb), ('et', et)],
    voting='soft'
)
model.fit(X_train_res, y_train_res)

acc = accuracy_score(y_test, model.predict(X_test_s))
print(f"Test Accuracy: {acc:.1%}")

joblib.dump(model,  'model.pkl')
joblib.dump(scaler, 'scaler.pkl')
print("Saved: model.pkl, scaler.pkl")
