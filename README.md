# 🔮 RetentionAI — Causal Uplift-Aware Customer Churn Prediction
### Full-Stack Machine Learning Web Application

> **Built with:** Python · Flask · scikit-learn · Pandas · Bootstrap 5 · Chart.js · Vanilla JS

---

## 📌 What Is This Project?

**RetentionAI** is a full-stack web application that predicts whether a customer is likely to **churn** (leave your service) using a trained Machine Learning model. It also performs **Uplift Analysis** — meaning it doesn't just ask *"will this customer leave?"* but also *"will this customer respond to a retention offer?"*

This project combines:
- A **pre-trained Random Forest model** (trained on your synthetic customer dataset)
- A **Flask backend** that serves the model as a live REST API
- A **rich interactive dashboard** with charts, a searchable customer table, real-time prediction, and CSV export

---

## 🗂️ Project File Structure

```
churn_frontend/
│
├── app.py                              ← Flask backend server (main entry point)
├── train_model.py                      ← Script to train and save the ML model
├── requirements.txt                    ← Python packages needed to run the project
│
├── model.pkl                           ← Trained Random Forest model (binary file)
├── scaler.pkl                          ← StandardScaler used to normalize inputs
├── label_encoders.pkl                  ← Label encoders for categorical columns
├── model_metadata.json                 ← Stores feature names and label classes
│
├── churn_uplift_synthetic_dataset (2).csv  ← The dataset (3,535 customers, 21 columns)
├── Copy_of_cleaned_data.ipynb          ← Google Colab notebook (original training work)
│
├── templates/
│   └── index.html                      ← Main HTML page (rendered by Flask/Jinja2)
│
└── static/
    ├── style.css                       ← Custom dark theme CSS
    └── script.js                       ← All JavaScript logic (charts, table, fetch, export)
```

---

## 📁 File-By-File Explanation

---

### 🐍 `app.py` — Flask Backend Server

**What it does:**
This is the brain of the backend. It runs a web server using Flask and exposes four routes (URLs) that the browser can talk to.

**Why it exists:**
Without this file, the ML model just sits as a `.pkl` file doing nothing. `app.py` loads the model into memory and wraps it in an HTTP API so that the browser can send customer data and receive predictions.

**Routes explained:**

| Route | Method | What it does |
|---|---|---|
| `GET /` | GET | Renders the `index.html` dashboard page |
| `POST /predict` | POST | Accepts JSON customer data → returns churn prediction + probability |
| `GET /api/customers` | GET | Reads the CSV and returns the top 500 rows as JSON for the table |
| `GET /api/export` | GET | Streams the full 3,535-row CSV as a file download |

**Input validation in `/predict`:**
The predict route does not blindly trust user input. It checks:
- Age must be between 18 and 75
- Monthly Spend must be between ₹10 and ₹2,489
- Satisfaction Score must be between 1 and 5
- Treatment must be 0 or 1

If any value is outside these bounds it returns HTTP `422 Unprocessable Entity` with a human-readable error message. This is critical because **models trained on a certain data range cannot make reliable predictions outside that range** — feeding ₹10,000 as spend would give a statistically meaningless result.

```python
# How the prediction pipeline works inside app.py:
features = {'age': 35, 'monthly_spend': 85, 'satisfaction_score': 3, 'treatment': 0}
df       = pd.DataFrame([features])
X_scaled = scaler.transform(df)          # normalize using saved scaler
pred     = model.predict(X_scaled)       # 0 = Active, 1 = Churned
prob     = model.predict_proba(X_scaled) # e.g. [0.32, 0.68] → 68% churn chance
```

---

### 🧠 `train_model.py` — ML Model Training Script

**What it does:**
Reads the dataset, trains a Random Forest classifier on 4 key features, and saves the trained model and scaler to disk as `.pkl` files.

**Why it exists:**
The model needs to be trained before the app can make predictions. This script is run once (or again if you want to retrain with new data). It produces `model.pkl` and `scaler.pkl`.

**Features used by the model:**

| Feature | Why it matters |
|---|---|
| `age` | Older customers sometimes have different churn patterns |
| `monthly_spend` | High spenders may be more invested or more price-sensitive |
| `satisfaction_score` | The most direct signal of dissatisfaction |
| `treatment` | Whether the customer received a retention offer |

**Why only 4 features?**
To keep the prediction form simple and fast to fill. The model achieves ~61% accuracy with 4 features. Using all 19 features of the dataset raises this to ~80% but requires filling 19 form fields, which is impractical for a quick single-customer prediction.

**How to retrain:**
```bash
python train_model.py
```
This will overwrite `model.pkl` and `scaler.pkl` with freshly trained files.

---

### 📦 `model.pkl` — Trained Machine Learning Model

**What it is:**
A binary file created by `joblib.dump()` that stores the entire trained `RandomForestClassifier` object from scikit-learn. It contains all 150 decision trees, their split rules, and learned weights.

**Why you need it:**
Every time the Flask server starts, it loads this file into memory:
```python
model = joblib.load('model.pkl')
```
Without this file, the app cannot make predictions.

**Important:** If you upgrade scikit-learn to a different version, you must re-run `train_model.py` to regenerate this file. Loading a `.pkl` trained on a different version will cause a warning or silently produce wrong results.

---

### ⚖️ `scaler.pkl` — Feature Normalizer

**What it is:**
A saved `StandardScaler` from scikit-learn. It stores the mean and standard deviation of each feature as measured on the training data.

**Why it exists:**
Machine learning models (especially tree-based ones like Random Forest) perform better when all input features are on a similar numeric scale. Raw values like Age=35, Spend=1500 are on very different scales.

The scaler transforms raw inputs into normalized values:
```
Age=35   → (35 - mean_age) / std_age   = e.g. -0.41
Spend=85 → (85 - mean_spend) / std_spend = e.g. 0.02
```

**Critical rule:** The **same scaler** that was used to transform training data must also be used to transform prediction inputs. If you retrain the model, you must also regenerate the scaler (which `train_model.py` does automatically).

---

### 📊 `churn_uplift_synthetic_dataset (2).csv` — The Dataset

**What it is:**
A synthetic dataset of **3,535 customers** with **21 columns** each. "Synthetic" means it was generated to mimic real customer data patterns — not real customer PII.

**Column summary:**

| Column | Type | Description |
|---|---|---|
| `customer_id` | String | Unique ID like CUST02746 |
| `age` | Integer | Customer age (18–75) |
| `gender` | Categorical | Male / Female / Other |
| `region` | Categorical | East / West / North / South / Central |
| `education` | Categorical | Education level |
| `income_bracket` | Categorical | Low / Mid / High etc. |
| `tenure_months` | Integer | How long they've been a customer |
| `num_products` | Integer | Number of products subscribed |
| `monthly_spend` | Float | Monthly spending (₹10–₹2,489) |
| `payment_delay_days` | Integer | Average days late on payment |
| `support_tickets_6mo` | Integer | Support tickets raised in 6 months |
| `login_frequency_monthly` | Integer | How often they log in per month |
| `last_interaction_days` | Integer | Days since last interaction |
| `satisfaction_score` | Integer | Satisfaction rating 1–5 |
| `contract_type` | Categorical | Month-to-Month / One Year / Two Year |
| `has_loyalty_program` | Binary | 1 = enrolled, 0 = not |
| `referral_count` | Integer | Referrals made |
| `treatment` | Binary | 1 = received retention offer, 0 = control group |
| `offer_type` | Categorical | What offer was given (Discount, Loyalty Bonus, etc.) |
| `uplift_segment` | Categorical | Persuadable / Sleeping Dog / Sure Thing / Lost Cause |
| `churn` | Binary | **Target variable** — 1 = churned, 0 = stayed |

**Uplift Segments explained:**

| Segment | Meaning | Strategy |
|---|---|---|
| **Persuadable** | Will stay IF given an offer | 🎯 Highest priority — target with offers |
| **Sure Thing** | Will stay regardless | Low priority — don't waste budget |
| **Sleeping Dog** | Will leave BECAUSE of offer | Avoid contacting |
| **Lost Cause** | Will leave no matter what | Write off |

---

### 🌐 `templates/index.html` — The Web Dashboard

**What it is:**
The single HTML page that users see in the browser. It is a Jinja2 template rendered by Flask, which means Flask can inject dynamic data into it before sending it to the browser.

**Sections of the page:**

| Section | What it shows |
|---|---|
| **Navbar / Sidebar** | Navigation links to each dashboard section |
| **Topbar** | Global search bar + Export Report button |
| **KPI Cards** | Total Customers, Churned Customers, Treated Customers, Best Target Segment |
| **Churn Status Chart** | Bar chart: Active vs Churned customer counts |
| **Segment Chart** | Doughnut chart of Uplift Segments distribution |
| **Offer Strategy Chart** | Bar chart showing offer type distribution |
| **Region Chart** | Line chart of customers by region |
| **Smart Recommendation** | Text box explaining which segment to target and why |
| **Single Customer Prediction** | Form to input 4 values and get real-time churn prediction |
| **Customer Prediction Table** | Searchable, filterable table of 500 real customers from CSV |

**Why it uses Jinja2 templates:**
Flask uses Jinja2 to render HTML with server-side data. For example, in the prediction form, dropdown option values are injected from the backend label encoder classes — this ensures the dropdowns always match exactly what the model was trained on.

---

### 🎨 `static/style.css` — The Dark Theme Stylesheet

**What it does:**
Defines the entire visual appearance of the dashboard — dark backgrounds, glassmorphism panels, gradient buttons, colored badges, and table styling.

**Key design decisions:**

| Design | Why |
|---|---|
| Dark background `#070b16` | Professional SaaS aesthetic, easier on the eyes |
| Glassmorphism panels (backdrop blur) | Modern premium look |
| Gradient buttons (indigo → violet) | Draws attention to CTAs |
| Color-coded badges | Instant visual signal (green = Active, red = Churned) |
| Bootstrap 5 CSS variable overrides | Without these, Bootstrap forces white table backgrounds |

**Important — Bootstrap 5 table override:**
Bootstrap 5 uses internal CSS variables (`--bs-table-bg`, `--bs-table-color`) that override normal CSS rules. The fix requires overriding those variables directly:
```css
.table {
    --bs-table-bg: transparent;
    --bs-table-color: #f8fafc;
}
.table > :not(caption) > * > * {
    color: #f8fafc !important;
    background-color: transparent !important;
}
```
Without this, the table text is invisible (white text on white background).

---

### ⚡ `static/script.js` — All JavaScript Logic

**What it does:**
Handles every interactive behaviour in the browser without any page reloads. Divided into four sections:

**1. Dashboard Charts (Chart.js)**
```javascript
new Chart(document.getElementById("churnChart"), { ... })
```
Creates 4 animated charts using Chart.js CDN:
- Churn Status Bar Chart
- Uplift Segment Doughnut Chart
- Offer Strategy Bar Chart
- Region Line Chart

**2. Customer Table with Live Search and Filter**
```javascript
async function fetchCustomers() {
    const response = await fetch('/api/customers');
    customers = await response.json();
    renderTable();
}
```
On page load, fetches 500 customers from the Flask API and renders them into the HTML table. Search and segment filter update the table instantly without another server request.

**3. Single Customer Prediction**
```javascript
predictionForm.addEventListener('submit', async (e) => {
    // 1. Validate ranges client-side
    // 2. Send to POST /predict
    // 3. Show result dynamically
})
```
When the user submits the prediction form:
1. JavaScript validates the input ranges immediately (before even sending)
2. Sends a `fetch()` POST request with JSON data to Flask
3. Shows a green/red/orange result box dynamically without page reload

**4. Export Report Button**
```javascript
exportBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = '/api/export';
    link.setAttribute('download', 'churn_report_full.csv');
    link.click();
})
```
Creates a temporary link pointing to `/api/export` and clicks it programmatically. The browser follows the link, hits the Flask route, receives `Content-Disposition: attachment` headers, and saves the file. This is the most reliable cross-browser download method.

---

### 📋 `requirements.txt` — Python Dependencies

```
Flask==3.0.0        ← Web framework — routes, templates, JSON responses
pandas==2.1.1       ← Reads CSV, builds DataFrames for model input
scikit-learn==1.3.1 ← RandomForestClassifier + StandardScaler
joblib==1.3.2       ← Saves and loads .pkl model files
```

**Why exact versions?**
scikit-learn `.pkl` files are version-sensitive. A model saved with `1.3.2` will throw warnings when loaded in `1.3.1` and vice versa. Pinning versions ensures everything works consistently.

**How to install:**
```bash
pip install -r requirements.txt
```

---

## 🚀 How To Run The Project

### Step 1 — Prerequisites
Make sure Python 3.9+ is installed:
```bash
python --version
```

### Step 2 — Install dependencies
```bash
cd churn_frontend
pip install -r requirements.txt
```

### Step 3 — (Re)train the model
Only needed if `model.pkl` or `scaler.pkl` are missing or you want fresh training:
```bash
python train_model.py
```
You should see output like:
```
Loading dataset...
Training model...
Test Accuracy: 61.0%
Saved: model.pkl, scaler.pkl
```

### Step 4 — Start the Flask server
```bash
python app.py
```
You should see:
```
 * Running on http://127.0.0.1:5000
 * Debugger is active!
```

### Step 5 — Open in browser
Navigate to: **http://127.0.0.1:5000**

---

## 🔄 How The Full Prediction Flow Works

```
USER fills form → JS validates ranges → fetch() sends JSON to Flask
     ↓
Flask receives JSON → validates again → builds DataFrame
     ↓
scaler.transform(df) → model.predict(scaled) → returns probability
     ↓
Flask sends JSON response → JS shows result on screen (no page reload)
```

### Example:
- **Input:** Age=30, Spend=₹120, Satisfaction=2, Treatment=Control
- **Scaled:** `[-0.41, 0.48, -1.22, -1.01]`
- **Model output:** `prediction=1`, `probability=0.72`
- **Displayed:** 🔴 High Churn Risk — 72% probability

---

## 🛡️ Input Validation — Why It Matters

The model was trained on a specific dataset. Inputs outside the training range cause **out-of-distribution predictions** — the model guesses blindly because it has never seen such values.

| Field | Valid Range | What happens if exceeded |
|---|---|---|
| Age | 18–75 | Orange warning + request rejected |
| Monthly Spend | ₹10–₹2,489 | Orange warning + request rejected |
| Satisfaction | 1–5 | Orange warning + request rejected |
| Treatment | 0 or 1 | Server returns 422 error |

Validation is done **twice**:
1. **Frontend (JavaScript)** — instant feedback before sending
2. **Backend (Flask)** — security net even if someone bypasses the frontend

---

## 📤 Export Report Feature

Clicking **Export Report** triggers a real server-side file download:

1. Browser navigates to `GET /api/export`
2. Flask reads the entire CSV (3,535 rows, all 21 columns)
3. Flask renames columns to clean human-readable headers
4. Returns response with headers:
   - `Content-Type: text/csv`
   - `Content-Disposition: attachment; filename=churn_report_full.csv`
5. Browser saves the file automatically

The exported CSV includes **all 3,535 customers** and **all 21 columns** — not just the 500 visible in the table.

---

## 📊 Customer Table — How It Works

The table is **fully dynamic** — it is not hardcoded. On every page load:

1. JavaScript calls `fetch('/api/customers')`
2. Flask reads `churn_uplift_synthetic_dataset (2).csv` and returns top 500 rows as JSON
3. JavaScript renders the rows into the HTML table
4. Search bar and Segment Filter immediately filter the in-memory data without another server request

**Why only 500 rows?**
Rendering 3,535 rows in an HTML table causes browser lag. 500 is fast and representative. The full dataset is available via Export.

---

## 🧩 Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| **Backend** | Flask (Python) | Lightweight, easy ML integration, Jinja2 templates |
| **ML Model** | scikit-learn Random Forest | Robust, handles mixed data, fast inference |
| **Data Processing** | Pandas | Reads CSV, builds input DataFrames for model |
| **Model Persistence** | joblib | Efficient binary serialization of sklearn objects |
| **Frontend Structure** | HTML5 + Jinja2 | Server-rendered templates with dynamic data injection |
| **Styling** | Bootstrap 5 + Custom CSS | Responsive grid + dark SaaS aesthetic |
| **Charts** | Chart.js (CDN) | Animated, responsive charts with minimal setup |
| **Interactivity** | Vanilla JavaScript | fetch API, DOM manipulation, no framework needed |
| **Icons** | Bootstrap Icons (CDN) | Clean icon set consistent with Bootstrap |
| **Fonts** | Google Fonts — Inter | Modern, readable sans-serif |

---

## ⚠️ Known Limitations & Future Improvements

| Limitation | Explanation | Suggested Fix |
|---|---|---|
| 4-feature model | Model only uses Age, Spend, Satisfaction, Treatment | Train on all 19 features for ~80% accuracy |
| No authentication | Anyone can access the dashboard | Add Flask-Login for user sessions |
| SQLite instead of CSV | CSV reading is slow at scale | Move to a database (SQLite/PostgreSQL) |
| No pagination | Table shows max 500 rows | Add server-side pagination to `/api/customers` |
| Debug mode on | `app.run(debug=True)` is for development only | Use Gunicorn/uWSGI for production |
| HTTP only | No SSL | Add HTTPS via nginx reverse proxy or Gunicorn |

---

## 📁 Google Colab Notebook

The file `Copy_of_cleaned_data.ipynb` is the original Colab notebook where the model was first developed. It contains:
- Data cleaning steps
- Exploratory data analysis (EDA)
- Feature engineering
- Model training experiments
- Uplift modeling logic

When you have a better model trained in Colab, export `model.pkl` and `scaler.pkl` from Colab and drop them into this project's root folder to replace the current ones.

---

## 🙏 Credits & Acknowledgements

- **Dataset:** Synthetic customer churn uplift dataset
- **ML Framework:** scikit-learn (Random Forest, StandardScaler)
- **Web Framework:** Flask by Pallets Projects
- **UI:** Bootstrap 5, Bootstrap Icons, Chart.js
- **Fonts:** Google Fonts — Inter
- **Full-stack integration:** Built with Antigravity AI assistant

---

*Last updated: May 2026*
