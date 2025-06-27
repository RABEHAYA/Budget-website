// ----------------- BILLS -----------------
async function fetchAndRenderBills() {
  const res = await fetch('/api/bills');
  const bills = await res.json();
  const billList = document.getElementById("bill-list");
  billList.innerHTML = "";

  bills.forEach((bill) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${bill.name} - ${bill.amount} MAD - Due: ${bill.due_date}</span>
      <button onclick="deleteBill(${bill.id})">🗑️</button>
    `;
    billList.appendChild(li);
  });
}

document.getElementById("bill-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const name = document.getElementById("bill-name").value.trim();
  const date = document.getElementById("bill-date").value;
  const amount = document.getElementById("bill-amount").value.trim();

  if (!name || !date || !amount) return;

  await fetch("/api/bills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, due_date: date, amount }),
  });

  this.reset();
  fetchAndRenderBills();
});

async function deleteBill(id) {
  await fetch(`/api/bills/${id}`, {
    method: "DELETE",
  });
  fetchAndRenderBills();
}


// ----------------- TASKS -----------------
async function fetchAndRenderTasks() {
  const res = await fetch("/api/tasks");
  const tasks = await res.json();
  const list = document.getElementById("todo-list");
  list.innerHTML = "";

  tasks.forEach((t, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${t.description}</span>
      <button onclick="deleteTask(${index})">🗑️</button>
    `;
    list.appendChild(li);
  });
}

document.getElementById("todo-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const task = document.getElementById("todo-input").value.trim();
  if (!task) return;

  await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description: task }),
  });

  this.reset();
  fetchAndRenderTasks();
});

async function deleteTask(index) {
  await fetch(`/api/tasks/${index}`, { method: "DELETE" });
  fetchAndRenderTasks();
}

// ----------------- REMINDERS -----------------
async function fetchAndRenderReminders() {
  const res = await fetch("/api/reminders");
  const reminders = await res.json();
  const list = document.getElementById("reminder-list");
  list.innerHTML = "";

  reminders.forEach((r) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${r.text} - ${r.date}</span>
      <button onclick="deleteReminder(${r.id})">🗑️</button>
    `;
    list.appendChild(li);
  });
}

document.getElementById("reminder-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const text = document.getElementById("reminder-text").value.trim();
  const date = document.getElementById("reminder-date").value;
  if (!text || !date) return;

  await fetch("/api/reminders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, date }),
  });

  this.reset();
  fetchAndRenderReminders();
});

async function deleteReminder(id) {
  await fetch(`/api/reminders/${id}`, {
    method: "DELETE",
  });
  fetchAndRenderReminders();
}


// ----------------- DEBTS -----------------
async function fetchAndRenderDebts() {
  const res = await fetch("/api/debts");
  const debts = await res.json();
  const list = document.getElementById("debt-list");
  list.innerHTML = "";

  debts.forEach((d, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${d.person} owes for ${d.reason} - ${d.amount} MAD due on ${d.date}</span>
      <button onclick="deleteDebt(${index})">🗑️</button>
    `;
    list.appendChild(li);
  });

  // Store debts temporarily to get their IDs
  window._debts = debts;
}

async function deleteDebt(index) {
  const debt = window._debts[index];
  const res = await fetch(`/api/debts/${debt.id}`, {
    method: "DELETE",
  });

  if (res.ok) {
    fetchAndRenderDebts();
  }
}
// Handle debt form submission
document.getElementById("debt-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const person = document.getElementById("debt-person").value.trim();
  const reason = document.getElementById("debt-reason").value.trim();
  const date = document.getElementById("debt-date").value;
  const amount = document.getElementById("debt-amount").value.trim();

  if (!person || !date || !amount) return;

  const response = await fetch("/api/debts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ person, reason, date, amount }),
  });

  if (response.ok) {
    this.reset();
    fetchAndRenderDebts();
  } else {
    console.error("Failed to add debt");
  }
});



// ----------------- INITIAL LOAD -----------------
window.onload = () => {
  fetchAndRenderBills();
  fetchAndRenderReminders();
  fetchAndRenderTasks();
  fetchAndRenderDebts();  // ✅ don't forget this line
};

















