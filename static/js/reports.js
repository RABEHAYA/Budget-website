async function loadReportData() {
  const [expenseRes, incomeRes, goalRes] = await Promise.all([
    fetch("/api/expenses"),
    fetch("/api/income"),
    fetch("/api/goals")
  ]);

  const expenses = await expenseRes.json();
  const { income } = await incomeRes.json();
  const goals = await goalRes.json();

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSaved = goals.reduce((sum, g) => sum + g.saved, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.target, 0);
  const goalProgress = totalTarget ? (totalSaved / totalTarget) * 100 : 0;
  const ratio = totalExpenses ? ((income / totalExpenses) * 100).toFixed(1) : "N/A";

  const largest = expenses.reduce((max, e) => e.amount > max.amount ? e : max, { amount: 0 });
  const freq = [...expenses.reduce((acc, e) => {
    acc.set(e.category, (acc.get(e.category) || 0) + 1);
    return acc;
  }, new Map()).entries()].sort((a, b) => b[1] - a[1])[0];

  document.getElementById("income-cell").textContent = `${income.toFixed(2)} MAD`;
  document.getElementById("expenses-cell").textContent = `${totalExpenses.toFixed(2)} MAD`;
  document.getElementById("saved-cell").textContent = `${totalSaved.toFixed(2)} MAD`;
  document.getElementById("goal-cell").textContent = `${goalProgress.toFixed(1)}%`;
  document.getElementById("ratio-cell").textContent = `${ratio}%`;
  document.getElementById("largest-cell").textContent = largest.description ? `${largest.description} (${largest.amount} MAD)` : "N/A";
  document.getElementById("frequent-cell").textContent = freq ? freq[0] : "N/A";

  renderMonthlyChart(expenses);
  renderCategoryPie(expenses);
  showTips(totalExpenses, income, goalProgress);
}

function renderMonthlyChart(expenses) {
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString('default', { month: 'short' })
  );
  const monthlyTotals = new Array(12).fill(0);

  expenses.forEach(e => {
    const month = new Date(e.date).getMonth();
    monthlyTotals[month] += e.amount;
  });

  new Chart(document.getElementById("monthly-chart").getContext("2d"), {
    type: "line",
    data: {
      labels: months,
      datasets: [{
        label: "Monthly Expenses (MAD)",
        data: monthlyTotals,
        borderColor: "#c084fc",
        backgroundColor: "#c084fc66",
        fill: true,
        tension: 0.5
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true },
        x: { }
      }
    }
  });
}

function renderCategoryPie(expenses) {
  const categoryMap = {};
  expenses.forEach(e => {
    categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(categoryMap);
  const data = Object.values(categoryMap);

  new Chart(document.getElementById("category-pie").getContext("2d"), {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: ["#d6b4fc", "#f5b8f3", "#ffd6e7", "#d9bfff", "#ffb5c1"] }]
    },
    options: {
      responsive: true,
      cutout: "55%",
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#f1f1f1",
            padding: 15,
            font: { size: 13 }
          }
        }
      }
    }
  });
}

function showTips(expenses, income, goalProgress) {
  const tip = document.getElementById("tip-text");
  if (income === 0) {
    tip.innerHTML = "💡 You haven't added your income yet.";
  } else if (expenses > income) {
    tip.innerHTML = "⚠️ Your expenses exceed your income.";
  } else if ((income - expenses) / income < 0.1) {
    tip.innerHTML = "⚠️ You're saving less than 10% of your income.";
  } else if (goalProgress >= 80) {
    tip.innerHTML = "🌟 You're almost reaching your goal!";
  } else {
    tip.innerHTML = "✅ Great job! You're managing your budget well!";
  }
}

window.onload = loadReportData;





