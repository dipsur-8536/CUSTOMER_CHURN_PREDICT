from flask import Flask, render_template, request, jsonify, make_response
import joblib
import pandas as pd
import os

app = Flask(__name__)

BASE = os.path.dirname(__file__)

# Load the model and scaler
MODEL_PATH  = os.path.join(BASE, 'model.pkl')
SCALER_PATH = os.path.join(BASE, 'scaler.pkl')

model  = None
scaler = None

if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
else:
    print("Warning: model.pkl or scaler.pkl not found. Please run train_model.py first.")


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    if not model or not scaler:
        return jsonify({'error': 'Model not loaded. Run train_model.py first.'}), 500

    try:
        data = request.json

        # Parse
        try:
            age            = float(data.get('age', 0))
            monthly_spend  = float(data.get('monthly_spend', 0))
            satisfaction   = float(data.get('satisfaction_score', 0))
            treatment      = int(data.get('treatment', 0))
        except (TypeError, ValueError):
            return jsonify({'error': 'All fields must be valid numbers.'}), 400

        # Validate ranges (from real dataset stats)
        errors = []
        if not (18 <= age <= 75):
            errors.append(f'Age must be 18–75 (got {int(age)})')
        if not (10 <= monthly_spend <= 2489):
            errors.append(f'Monthly Spend must be ₹10–₹2,489 (got ₹{monthly_spend:.0f})')
        if not (1 <= satisfaction <= 5):
            errors.append(f'Satisfaction must be 1–5 (got {satisfaction})')
        if treatment not in (0, 1):
            errors.append('Treatment must be 0 (Control) or 1 (Treated)')

        if errors:
            return jsonify({'error': ' | '.join(errors), 'type': 'validation'}), 422

        # Predict
        features = {
            'age': age,
            'monthly_spend': monthly_spend,
            'satisfaction_score': satisfaction,
            'treatment': treatment
        }
        df       = pd.DataFrame([features])
        X_scaled = scaler.transform(df)

        prediction    = model.predict(X_scaled)[0]
        probabilities = model.predict_proba(X_scaled)[0]
        churn_prob    = round(float(probabilities[1]) * 100, 2)
        result_text   = "High Churn Risk" if prediction == 1 else "Low Churn Risk"

        return jsonify({
            'prediction': result_text,
            'probability': churn_prob,
            'raw_prediction': int(prediction)
        })

    except Exception as e:
        print(f"Prediction error: {e}")
        return jsonify({'error': str(e)}), 400


@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        csv_path = os.path.join(BASE, 'churn_uplift_synthetic_dataset (2).csv')
        df = pd.read_csv(csv_path).head(500)
        customers = []
        for _, row in df.iterrows():
            customers.append({
                'id': str(row.get('customer_id', '')),
                'age': int(row['age']) if pd.notna(row.get('age')) else 0,
                'region': str(row.get('region', '')),
                'income': str(row.get('income_bracket', '')),
                'spend': round(float(row['monthly_spend']), 2) if pd.notna(row.get('monthly_spend')) else 0,
                'satisfaction': int(row['satisfaction_score']) if pd.notna(row.get('satisfaction_score')) else 0,
                'treatment': int(row['treatment']) if pd.notna(row.get('treatment')) else 0,
                'offer': str(row.get('offer_type', '')),
                'segment': str(row.get('uplift_segment', '')),
                'churn': int(row['churn']) if pd.notna(row.get('churn')) else 0
            })
        return jsonify(customers)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/export', methods=['GET'])
def export_report():
    try:
        csv_path = os.path.join(BASE, 'churn_uplift_synthetic_dataset (2).csv')
        df = pd.read_csv(csv_path).fillna('')
        df = df.rename(columns={
            'customer_id': 'Customer ID', 'age': 'Age', 'gender': 'Gender',
            'region': 'Region', 'education': 'Education',
            'income_bracket': 'Income Bracket', 'tenure_months': 'Tenure (Months)',
            'num_products': 'Num Products', 'monthly_spend': 'Monthly Spend',
            'payment_delay_days': 'Payment Delay (Days)',
            'support_tickets_6mo': 'Support Tickets (6mo)',
            'login_frequency_monthly': 'Login Frequency (Monthly)',
            'last_interaction_days': 'Last Interaction (Days)',
            'satisfaction_score': 'Satisfaction Score',
            'contract_type': 'Contract Type',
            'has_loyalty_program': 'Has Loyalty Program',
            'referral_count': 'Referral Count', 'treatment': 'Treatment',
            'offer_type': 'Offer Type', 'uplift_segment': 'Uplift Segment',
            'churn': 'Churn'
        })
        response = make_response(df.to_csv(index=False))
        response.headers['Content-Type'] = 'text/csv; charset=utf-8'
        response.headers['Content-Disposition'] = 'attachment; filename=churn_report_full.csv'
        response.headers['Cache-Control'] = 'no-cache'
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
