const dashboardData = {
  churn: { labels: ["Not Churned", "Churned"], data: [1944, 1591] },
  segments: { labels: ["Sleeping Dog", "Persuadable", "Sure Thing", "Lost Cause"], data: [1077, 981, 872, 605] },
  offers: { labels: ["No Offer", "Discount", "Loyalty Bonus", "Free Upgrade", "Personal Outreach"], data: [1810, 590, 443, 430, 262] },
  regions: { labels: ["East", "North", "South", "West", "Central"], data: [781, 754, 728, 684, 588] }
};

let customers = [];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#e5e7eb" } } },
  scales: {
    x: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,.08)" } },
    y: { ticks: { color: "#cbd5e1" }, grid: { color: "rgba(255,255,255,.08)" } }
  }
};

new Chart(document.getElementById("churnChart"), {
  type: "bar",
  data: { labels: dashboardData.churn.labels, datasets: [{ label: "Customers", data: dashboardData.churn.data, backgroundColor: ["#22c55e", "#ef4444"], borderRadius: 12 }] },
  options: chartOptions
});

new Chart(document.getElementById("segmentChart"), {
  type: "doughnut",
  data: { labels: dashboardData.segments.labels, datasets: [{ data: dashboardData.segments.data, backgroundColor: ["#06b6d4", "#f59e0b", "#22c55e", "#ef4444"], borderColor: "#111827", borderWidth: 3 }] },
  options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"bottom", labels:{color:"#e5e7eb"}}} }
});

new Chart(document.getElementById("offerChart"), {
  type: "bar",
  data: { labels: dashboardData.offers.labels, datasets: [{ label: "Customers", data: dashboardData.offers.data, backgroundColor: ["#64748b", "#6366f1", "#22c55e", "#06b6d4", "#f59e0b"], borderRadius: 10 }] },
  options: chartOptions
});

new Chart(document.getElementById("regionChart"), {
  type: "line",
  data: { labels: dashboardData.regions.labels, datasets: [{ label: "Customers", data: dashboardData.regions.data, borderColor: "#8b5cf6", backgroundColor: "rgba(139,92,246,.2)", fill: true, tension: .35, pointBackgroundColor: "#8b5cf6" }] },
  options: chartOptions
});

const tbody = document.getElementById("customerBody");
const tableSearch = document.getElementById("tableSearch");
const globalSearch = document.getElementById("globalSearch");
const segmentFilter = document.getElementById("segmentFilter");

function badge(text, type){ return `<span class="badge-soft ${type}">${text}</span>`; }

function renderTable(){
  const search = (tableSearch.value || globalSearch.value || "").toLowerCase();
  const selectedSegment = segmentFilter.value;
  tbody.innerHTML = customers
    .filter(c => selectedSegment === "all" || c.segment === selectedSegment)
    .filter(c => Object.values(c).join(" ").toLowerCase().includes(search))
    .map(c => `
      <tr>
        <td>${c.id}</td><td>${c.age}</td><td>${c.region}</td><td>${c.income}</td><td>₹${c.spend}</td><td>${c.satisfaction}/5</td>
        <td>${c.offer}</td><td>${c.segment}</td>
        <td>${c.churn ? badge("Churned","badge-churn") : badge("Active","badge-active")}</td>
      </tr>`).join("");
}

tableSearch.addEventListener("input", renderTable);
globalSearch.addEventListener("input", renderTable);
segmentFilter.addEventListener("change", renderTable);

async function fetchCustomers() {
  try {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4"><span class="spinner-border spinner-border-sm me-2"></span> Loading customer data...</td></tr>';
    const response = await fetch('/api/customers');
    if (response.ok) {
      customers = await response.json();
      renderTable();
    } else {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-4">Failed to load customer data.</td></tr>';
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center text-danger py-4">Error connecting to server.</td></tr>';
  }
}

fetchCustomers();

// Prediction Form Handling
const predictionForm = document.getElementById('predictionForm');
const predictionResult = document.getElementById('predictionResult');

if (predictionForm) {
  predictionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const val = id => document.getElementById(id)?.value ?? '';

    const age   = parseFloat(val('formAge'));
    const spend = parseFloat(val('formSpend'));
    const sat   = parseFloat(val('formSatisfaction'));

    // Client-side range validation (mirrors backend)
    const errors = [];
    if (isNaN(age)   || age < 18   || age > 75)    errors.push('Age must be 18–75');
    if (isNaN(spend) || spend < 10 || spend > 2489) errors.push('Monthly Spend must be ₹10–₹2,489');
    if (isNaN(sat)   || sat < 1    || sat > 5)     errors.push('Satisfaction must be 1–5');

    predictionResult.classList.remove('d-none', 'bg-success', 'bg-danger', 'bg-secondary', 'bg-warning');
    predictionResult.style.removeProperty('background');

    if (errors.length > 0) {
      predictionResult.style.background = 'rgba(245,158,11,0.18)';
      predictionResult.style.border = '1px solid rgba(245,158,11,0.5)';
      predictionResult.style.color = '#fde68a';
      predictionResult.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2" style="color:#f59e0b"></i><strong>Invalid Input:</strong> ${errors.join(' &nbsp;|&nbsp; ')}`;
      return;
    }

    predictionResult.style.removeProperty('background');
    predictionResult.style.removeProperty('border');
    predictionResult.style.removeProperty('color');
    predictionResult.classList.add('bg-secondary', 'text-white');
    predictionResult.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span> Predicting...';

    const data = {
      age:               age,
      monthly_spend:     spend,
      satisfaction_score: sat
    };


    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      predictionResult.classList.remove('bg-secondary');
      predictionResult.style.removeProperty('background');
      predictionResult.style.removeProperty('border');
      predictionResult.style.removeProperty('color');

      if (response.ok) {
        if (result.raw_prediction === 1) {
          predictionResult.classList.add('bg-danger', 'text-white');
          predictionResult.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>${result.prediction} &nbsp;—&nbsp; ${result.probability}% probability`;
        } else {
          predictionResult.classList.add('bg-success', 'text-white');
          predictionResult.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>${result.prediction} &nbsp;—&nbsp; ${result.probability}% probability`;
        }
      } else {
        // Validation error (422) or server error — show in orange
        predictionResult.style.background = 'rgba(245,158,11,0.18)';
        predictionResult.style.border = '1px solid rgba(245,158,11,0.5)';
        predictionResult.style.color = '#fde68a';
        predictionResult.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2" style="color:#f59e0b"></i>${result.error || 'Validation failed'}`;
      }
    } catch (error) {
      predictionResult.classList.remove('bg-secondary');
      predictionResult.classList.add('bg-danger', 'text-white');
      predictionResult.textContent = 'Failed to connect to the server.';
    }
  });
}

// ── Export Report (CSV) ──────────────────────────────────────────────────────
const exportBtn = document.getElementById('exportReportBtn');

function getCurrentFilteredCustomers() {
  const search = (tableSearch.value || globalSearch.value || '').toLowerCase();
  const selectedSegment = segmentFilter.value;
  return customers
    .filter(c => selectedSegment === 'all' || c.segment === selectedSegment)
    .filter(c => Object.values(c).join(' ').toLowerCase().includes(search));
}

function escapeCsv(val) {
  const str = val === null || val === undefined ? '' : String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"` : str;
}

function downloadCSV(rows) {
  const headers = ['Customer ID','Age','Region','Income Bracket','Monthly Spend','Satisfaction','Offer Type','Uplift Segment','Churn'];
  const csvLines = [
    headers.join(','),
    ...rows.map(c => [
      escapeCsv(c.id),
      escapeCsv(c.age),
      escapeCsv(c.region),
      escapeCsv(c.income),
      escapeCsv(c.spend),
      escapeCsv(c.satisfaction),
      escapeCsv(c.offer && c.offer !== 'nan' ? c.offer : 'No Offer'),
      escapeCsv(c.segment),
      escapeCsv(c.churn === 1 ? 'Churned' : 'Active')
    ].join(','))
  ];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  link.download = `churn_report_${ts}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function showToast(msg, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;display:flex;flex-direction:column;gap:10px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const color = type === 'success' ? '#22c55e' : '#ef4444';
  const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
  toast.style.cssText = `background:#1e293b;border:1px solid ${color};color:#f8fafc;padding:14px 22px;border-radius:16px;display:flex;align-items:center;gap:12px;font-weight:600;font-size:15px;box-shadow:0 8px 32px rgba(0,0,0,.4);`;
  toast.innerHTML = `<i class="bi ${icon}" style="color:${color};font-size:18px;"></i>${msg}`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .4s'; setTimeout(() => toast.remove(), 400); }, 3500);
}

if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    // Show loading state
    exportBtn.disabled = true;
    exportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Preparing...';

    // Trigger a real server-side download — the browser opens it as a file save dialog
    // This is guaranteed to work across all browsers, no Blob API needed
    const link = document.createElement('a');
    link.href = '/api/export';
    link.setAttribute('download', 'churn_report_full.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Downloading full churn dataset (3,536 rows)...', 'success');

    setTimeout(() => {
      exportBtn.disabled = false;
      exportBtn.innerHTML = '<i class="bi bi-download me-1"></i>Export Report';
    }, 2000);
  });
}
// ────────────────────────────────────────────────────────────────────────────
