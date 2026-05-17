# Project Documentation: AI-Powered Customer Churn Prediction Dashboard

This document provides a comprehensive explanation of the entire project, including its purpose, the technologies used, the machine learning algorithms, and how the backend and frontend interact.

---

## 1. Project Purpose & Overview
The purpose of this project is to provide a comprehensive **Customer Retention and Churn Prediction Dashboard**. 
Customer churn refers to the percentage of customers that stop using a company's product or service during a certain time frame. By predicting which customers are at high risk of churning, businesses can proactively take measures (like offering discounts or outreach) to retain them.

This application allows users to:
- View overall statistics, demographic data, and uplift segments visually using charts.
- Predict the exact churn risk for a single customer in real-time by inputting their profile.
- View and search through a vast table of customer data.
- Export detailed reports for business analysis.

---

## 2. Technology Stack
The project is built using a modern, lightweight tech stack split into Machine Learning, Backend, and Frontend.

### **Machine Learning & Data Processing**
- **Python**: The core programming language used for data manipulation and modeling.
- **Scikit-learn**: The machine learning library used to build the prediction model.
- **Pandas**: Used for reading, cleaning, and manipulating the CSV dataset.
- **Joblib**: Used to serialize (save) and deserialize (load) the trained ML model and scaler.

### **Backend Server**
- **Flask**: A lightweight Python web framework. It acts as the bridge connecting the web browser to the machine learning model.

### **Frontend User Interface**
- **HTML5 & CSS3**: For structuring and styling the web pages.
- **Bootstrap 5**: A CSS framework used to create a responsive, mobile-friendly grid layout and UI components quickly.
- **Vanilla JavaScript**: Handles interactivity, form submissions, and making asynchronous API calls to the backend without reloading the page.
- **Chart.js**: A JavaScript library used to render the interactive graphs (bar charts, line charts, doughnut charts).

---

## 3. Machine Learning Architecture

### **The Algorithm: Random Forest Classifier**
The core prediction engine uses a **Random Forest Classifier**.

**How it works:** 
A Random Forest is an "ensemble" algorithm. Instead of creating just one Decision Tree, it creates an entire "forest" of multiple decision trees (in this case, 150 trees as defined by `n_estimators=150`). Each tree looks at a random subset of the data and makes its own prediction. The final prediction is decided by a majority vote among all the trees.

**Why use Random Forest?**
1. **High Accuracy**: By combining multiple trees, it drastically reduces the chance of errors that a single tree might make.
2. **Prevents Overfitting**: Single decision trees tend to memorize the training data (overfitting). Random Forest uses a technique called "bagging" to prevent this, ensuring it performs well on new, unseen data.
3. **Non-linear Data**: It easily handles complex, non-linear relationships between variables (e.g., how age and monthly spend combined affect churn).

### **Features Used**
The model predicts churn based on 3 core features:
1. `age` (18 - 75)
2. `monthly_spend` (₹10 - ₹2,489)
3. `satisfaction_score` (1 - 5)

### **Data Preprocessing (StandardScaler)**
Before the data is fed to the model, it is passed through a **StandardScaler**.
- **Purpose**: Machine learning models work best when all numbers are on a similar scale. For example, `monthly_spend` goes up to 2,489, while `satisfaction_score` only goes up to 5. Without scaling, the model might mistakenly think `monthly_spend` is hundreds of times more important simply because the raw numbers are bigger. 
- The scaler normalizes the data so every feature has a mean of 0 and a standard deviation of 1.

---

## 4. How the Backend Works

The backend is driven by **Flask** (`app.py`), which exposes several "endpoints" (URLs) that the frontend communicates with.

### **Key Endpoints:**
1. `GET /`: Serves the main HTML interface (`index.html`).
2. `POST /predict`: 
   - **Receives**: JSON data containing the customer's Age, Spend, and Satisfaction.
   - **Validates**: Checks if the numbers are within the realistic ranges of the dataset.
   - **Processes**: Converts the data into a Pandas DataFrame, scales it using `scaler.pkl`, and passes it to the `model.pkl`.
   - **Returns**: The raw prediction (0 or 1) and the probability percentage of the customer churning.
3. `GET /api/customers`: Reads the `churn_uplift_synthetic_dataset (2).csv`, formats the top 500 rows into a JSON list, and sends it to the frontend to populate the customer table.
4. `GET /api/export`: Reads the full dataset, renames the columns to human-readable formats, and forces a file download in the browser to export the data as `churn_report_full.csv`.

---

## 5. How the Frontend Works

The frontend (`templates/index.html` and `static/script.js`) provides the visual interface.

- **Dashboard Charts**: When the page loads, `Chart.js` reads hardcoded statistical summaries and draws the visual charts.
- **The Prediction Form**: 
  - When the user clicks "Predict Churn", JavaScript intercepts the form submission using `e.preventDefault()`.
  - It runs client-side validation to ensure the inputs aren't empty or completely out of bounds.
  - It uses the modern `fetch()` API to send a background HTTP POST request to the `/predict` backend endpoint.
  - It awaits the response, unpacks the JSON, and dynamically updates the UI to show a green success box (Low Risk) or a red warning box (High Risk) without refreshing the page.
- **Dynamic Table**: JavaScript fetches data from `/api/customers` on load. It includes a search box and a segment dropdown that dynamically filters the table array in real-time.

---

## 6. Full Data Flow Summary (Step-by-Step)

Here is the exact lifecycle of a single prediction:

1. **User Action**: The user types Age `35`, Spend `85`, Satisfaction `4` into the form and clicks "Predict".
2. **Frontend Intercept**: `script.js` gathers these 3 numbers into a JSON object and sends it via network request to `http://127.0.0.1:5000/predict`.
3. **Backend Parsing**: `app.py` receives the JSON, checks that the numbers are valid, and places them into a structured Pandas DataFrame.
4. **Scaling**: The DataFrame is passed through `scaler.transform()` to normalize the numbers.
5. **Prediction**: The normalized numbers are passed into `model.predict()` and `model.predict_proba()`.
6. **Backend Response**: Flask packages the text result (e.g., "Low Churn Risk") and the probability (e.g., "37.36%") into a JSON response and sends it back over the network.
7. **Frontend Display**: `script.js` receives the response and injects the result into the HTML container to display it to the user.
