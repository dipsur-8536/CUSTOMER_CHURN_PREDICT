# ⚡ Quick Start Guide

## Run The Project In 3 Steps

---

### Option A — One Click (Windows)

Double-click **`start.bat`** in the project folder.

That's it. It will install dependencies, train the model, and open the app in your browser automatically.

---

### Option B — Manual (Any OS)

Open a terminal in the `churn_frontend` folder, then run these 3 commands **in order**:

```bash
# Step 1 — Install required packages
pip install -r requirements.txt

# Step 2 — Train and save the ML model
python train_model.py

# Step 3 — Start the web server
python app.py
```

Then open your browser and go to:

> **http://127.0.0.1:5000**

---

## ✅ What You Should See

After `python app.py` runs, your terminal will show:

```
Model, scaler loaded successfully.
 * Running on http://127.0.0.1:5000
 * Debugger is active!
```

The browser will show the **RetentionAI Churn Dashboard**.

---

## 🛑 To Stop The Server

Press `Ctrl + C` in the terminal.

---

## ❓ Common Problems

| Problem | Fix |
|---|---|
| `ModuleNotFoundError: flask` | Run `pip install -r requirements.txt` first |
| `model.pkl not found` | Run `python train_model.py` first |
| Port 5000 already in use | Stop other apps using port 5000, or change `app.run(port=5001)` in `app.py` |
| Table shows no data | Make sure the CSV file `churn_uplift_synthetic_dataset (2).csv` is in the same folder as `app.py` |

---

*See `README.md` for the full project documentation.*
