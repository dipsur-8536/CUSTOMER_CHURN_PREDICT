"""
Simple 4-feature churn model trainer.
Features: age, monthly_spend, satisfaction_score, treatment
"""
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

print("Loading dataset...")
df = pd.read_csv("churn_uplift_synthetic_dataset (2).csv")

FEATURES = ['age', 'monthly_spend', 'satisfaction_score', 'treatment']

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

print("Training model...")
model = RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42, n_jobs=-1)
model.fit(X_train_s, y_train)

acc = accuracy_score(y_test, model.predict(X_test_s))
print(f"Test Accuracy: {acc:.1%}")

joblib.dump(model,  'model.pkl')
joblib.dump(scaler, 'scaler.pkl')
print("Saved: model.pkl, scaler.pkl")
