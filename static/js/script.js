let expenses = [];

// Load expenses AND income on page load
window.onload = async () => {
  await loadExpenses();      // Load & render expenses
  await updateSummary();     // Load & render income + remaining
};

// Load expenses from backend
async function loadExpenses() {
  const res = await fetch("/api/expenses");
  expenses = await res.json();
  renderExpenses();
}

// Save new expense to backend
async function addExpense(expense) {
  await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(expense)
  });
  await loadExpenses();
  await updateSummary();  // Recalculate remaining
}

// Submit expense form
document.getElementById("expense-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;
  const date = document.getElementById("date").value;

  if (!description || !amount || !category || !date) return;

  await addExpense({ description, amount, category, date });
  document.getElementById("expense-form").reset();
});

// Render expenses in table
function renderExpenses() {
  const tbody = document.getElementById("expenses-table-body");
  tbody.innerHTML = "";

  expenses.forEach((expense) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${expense.description}</td>
      <td>${expense.amount.toFixed(2)} MAD</td>
      <td>${expense.category}</td>
      <td>${expense.date}</td>
      <td><button class="action-btn" onclick="deleteExpense(${expense.id})">🗑️</button></td>
    `;
    tbody.appendChild(row);
  });
}

// Delete expense by ID
async function deleteExpense(id) {
  await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  await loadExpenses();
  await updateSummary();
}

// Submit income
document.getElementById("income-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const source = document.getElementById("income-source").value;
const amount = parseFloat(document.getElementById("income-amount").value);
const date = document.getElementById("income-date").value;

if (!source || !amount || !date) return;

await fetch("/api/income", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ source, amount, date })
});

  await updateSummary();
  document.getElementById("income-form").reset();
});

// Update total summary
async function updateSummary() {
  const res = await fetch("/api/income");
  const { income } = await res.json();
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = income - totalExpenses;

  document.getElementById("total-expenses").textContent = totalExpenses.toFixed(2) + " MAD";
  document.getElementById("total-income").textContent = income.toFixed(2) + " MAD";
  document.getElementById("remaining-budget").textContent = remaining.toFixed(2) + " MAD";
}



