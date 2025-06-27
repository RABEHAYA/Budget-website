const container = document.getElementById("goals-container");
const summaryDiv = document.getElementById("summary");
const ctx = document.getElementById("goal-chart").getContext("2d");

let goalChart;
let goals = [];

function renderChart() {
  if (goalChart) goalChart.destroy();
  goalChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: goals.map(g => g.name),
      datasets: [{
        label: "Saved (MAD)",
        data: goals.map(g => g.saved),
        backgroundColor: "#c084fc"
      }]
    },
    options: {
      scales: { y: { beginAtZero: true } }
    }
  });
}

function updateSummary() {
  const totalSaved = goals.reduce((acc, g) => acc + g.saved, 0);
  summaryDiv.textContent = `💰 Total Saved: ${totalSaved.toFixed(2)} MAD`;
}

function createGoalCard(goal) {
  const card = document.createElement("div");
  card.className = "goal-card";
  card.innerHTML = `
    <h3>${goal.name}</h3>
    <p class="progress-info">Saved: <span class="saved">${goal.saved}</span> / <span class="target">${goal.target}</span> MAD</p>
    <input type="number" placeholder="Add amount..." />
    <div class="progress-bar">
      <div class="progress-bar-inner" style="width: ${getPercent(goal)}%;"></div>
    </div>
  `;
card.querySelector("input").addEventListener("change", async (e) => {
  const amt = parseFloat(e.target.value);
  if (amt > 0) {
    goal.saved += amt;

    // Send updated value to backend
    await fetch(`/api/goals/${goal.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saved: goal.saved })
    });

    updateGoalCard(card, goal);
    updateSummary();
    renderChart();
  }
  e.target.value = "";
});

  container.appendChild(card);
}

function getPercent(goal) {
  return Math.min(100, ((goal.saved / goal.target) * 100).toFixed(2));
}

function updateGoalCard(card, goal) {
  card.querySelector(".saved").textContent = goal.saved;
  card.querySelector(".progress-bar-inner").style.width = `${getPercent(goal)}%`;
}

document.getElementById("add-goal-btn").addEventListener("click", async () => {
  const name = document.getElementById("goal-name").value.trim();
  const target = parseFloat(document.getElementById("goal-target").value);

  if (!name || isNaN(target) || target <= 0) {
    alert("Enter valid goal name and target (MAD).");
    return;
  }

  const res = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, target, saved: 0 }),
  });

  await loadGoals();  // reload all goals
  document.getElementById("goal-name").value = "";
  document.getElementById("goal-target").value = "";
});

async function loadGoals() {
  const res = await fetch("/api/goals");
  goals = await res.json();
  container.innerHTML = "";
  goals.forEach(createGoalCard);
  updateSummary();
  renderChart();
}

document.getElementById("export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(goals, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "saving_goals.json";
  a.click();
});

window.onload = () => {
  loadGoals();
};







