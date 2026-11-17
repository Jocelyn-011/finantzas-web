(() => {
  "use strict";

  const currency = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
  const initialState = {
    profile: { name: "Usuario", email: "usuario@email.com" },
    budget: 600000,
    accounts: [
      { id: "account-demo-1", institution: "BancoEstado", name: "Cuenta principal", lastFour: "4829", balance: 760000, updatedAt: "Actualizada hoy" },
      { id: "account-demo-2", institution: "Banco Santander", name: "Cuenta para gastos", lastFour: "1506", balance: 184000, updatedAt: "Actualizada hoy" }
    ],
    budgets: { "Global": 600000, "Vivienda": 400000, "Alimentación": 280000, "Transporte": 110000, "Micro-compras": 90000, "Entretenimiento": 25000 },
    transactions: [{ id: "seed-1", name: "Prueba presupuesto", amount: 190000, category: "Vivienda y servicios", payment: "Débito", frequency: "Mensual fijo", micro: false, createdAt: "16 nov 2026" }],
    savingsRate: 50,
    theme: "dark"
  };
  const stored = localStorage.getItem("finantzas-state");
  const state = stored ? { ...initialState, ...JSON.parse(stored), budgets: { ...initialState.budgets, ...JSON.parse(stored).budgets } } : initialState;
  let selectedFilter = "Todos";
  let supabaseClient = null;

  if (window.supabase && window.FINANTZAS_SUPABASE_URL && window.FINANTZAS_SUPABASE_ANON_KEY) {
    supabaseClient = window.supabase.createClient(window.FINANTZAS_SUPABASE_URL, window.FINANTZAS_SUPABASE_ANON_KEY);
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const money = (amount) => currency.format(Math.max(0, Number(amount) || 0));
  const cleanMoney = (amount) => money(amount);
  const percentage = (value, total) => total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  const save = () => localStorage.setItem("finantzas-state", JSON.stringify(state));
  const spent = () => state.transactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const microSpent = () => state.transactions.filter((transaction) => transaction.micro).reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  function toast(message) {
    const toastEl = $("#toast");
    toastEl.textContent = message;
    toastEl.classList.add("show");
    window.clearTimeout(toast.timeout);
    toast.timeout = window.setTimeout(() => toastEl.classList.remove("show"), 3000);
  }

  function renderTransaction(transaction, compact = false) {
    const icon = transaction.micro ? "△" : "$";
    return `<div class="transaction">
      <span class="transaction-icon">${icon}</span>
      <div class="transaction-main"><b>${escapeHTML(transaction.name)}</b><span>${escapeHTML(transaction.createdAt)} · ${escapeHTML(transaction.category)} · ${escapeHTML(transaction.payment)}</span>${compact ? "" : transaction.micro ? '<em class="tag">Hormiga</em>' : '<em class="tag">Esencial</em>'}</div>
      <div class="transaction-amount">-${cleanMoney(transaction.amount)} CLP<small>${escapeHTML(transaction.frequency)}</small></div>
    </div>`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);
  }

  function renderTransactions() {
    const visible = selectedFilter === "Todos" ? state.transactions : state.transactions.filter((item) => {
      if (selectedFilter === "Hormiga") return item.micro;
      if (selectedFilter === "Suscripciones") return item.frequency === "Mensual fijo";
      return item.payment === "Débito";
    });
    $("#recentTransactions").innerHTML = state.transactions.slice(0, 2).map((item) => renderTransaction(item, true)).join("") || '<p class="empty-state">Aún no tienes movimientos.</p>';
    $("#transactionList").innerHTML = visible.map((item) => renderTransaction(item)).join("") || '<p class="empty-state">No hay transacciones en este filtro.</p>';
    $("#transactionCount").textContent = state.transactions.length;
  }

  function renderDashboard() {
    const totalSpent = spent();
    const used = percentage(totalSpent, state.budget);
    const uniqueCategories = new Set(state.transactions.map((item) => item.category)).size;
    $("#budgetTotal").innerHTML = `${money(state.budget)} <small>CLP</small>`;
    $("#spentTotal").textContent = `${money(totalSpent)} CLP`;
    $("#spentPercent").textContent = `${used}%`;
    $("#budgetStatus").textContent = `${used < 70 ? "Controlado" : used < 90 ? "Atención" : "Límite cercano"} · ${used}%`;
    $("#budgetProgress").style.width = `${used}%`;
    $("#categoryCount").textContent = uniqueCategories;
    $("#microSpent").textContent = `${money(microSpent())} CLP`;
    $$("[data-user-name]").forEach((element) => element.textContent = state.profile.name);
    $("#userEmail").textContent = state.profile.email;
    $("#profileBudget").textContent = `${money(state.budget)} CLP`;
    renderSavings(state.savingsRate);
  }

  function renderSavings(rate) {
    state.savingsRate = rate;
    const annual = Math.round((state.budget - spent()) * (rate / 100));
    const monthly = Math.round(annual / 12);
    $("#previewRate").textContent = rate;
    $("#previewSavings").textContent = `${money(annual)} CLP`;
    $("#analysisSavings").textContent = `${money(annual)} CLP`;
    $("#projectionRate").textContent = rate;
    $("#monthlySavings").textContent = `${money(monthly)} CLP`;
    $$("[data-savings-segment]").forEach((control) => {
      $$("button", control).forEach((button) => button.classList.toggle("selected", Number(button.dataset.rate) === rate));
    });
    save();
  }

  function renderAnalytics() {
    const totalSpent = spent();
    const leak = microSpent();
    const essential = totalSpent - leak;
    $("#analysisSpent").textContent = `${money(totalSpent)} CLP`;
    $("#categoryDonut").textContent = money(totalSpent);
    $("#paymentDonut").textContent = money(totalSpent);
    $("#leakPercent").textContent = `${percentage(leak, totalSpent)}%`;
    $("#leakAmount").textContent = new Intl.NumberFormat("es-CL").format(leak);
    $("#flowIncome").textContent = `${money(totalSpent)} CLP`;
    $("#flowLeak").textContent = `${money(leak)} CLP (${percentage(leak, totalSpent)}%)`;
    $("#flowEssential").textContent = `${money(essential)} CLP (${percentage(essential, totalSpent)}%)`;
    $("#budgetCards").innerHTML = Object.entries(state.budgets).map(([name, limit]) => {
      const categoryNames = name === "Global" ? state.transactions.map((item) => item.category) : state.transactions.filter((item) => item.category.startsWith(name)).map((item) => item.category);
      const amount = name === "Global" ? totalSpent : state.transactions.filter((item) => item.category.startsWith(name)).reduce((sum, item) => sum + Number(item.amount), 0);
      const used = percentage(amount, limit);
      return `<article class="card budget-card"><div class="budget-head"><b>${name}</b><b>${used}% consumido</b></div><p>Gastado: ${money(amount)} / Límite: ${money(limit)} CLP</p><div class="progress"><span style="width:${used}%"></span></div><div class="budget-input"><label>Límite mensual CLP<input type="number" min="0" value="${limit}" data-budget-input="${name}" /></label><button class="primary-button" data-save-budget="${name}">Guardar</button></div></article>`;
    }).join("");
  }

  function renderAccounts() {
    const accounts = Array.isArray(state.accounts) ? state.accounts : [];
    const total = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
    $("#totalAccountBalance").textContent = `${money(total)} CLP`;
    $("#accountCount").textContent = accounts.length;
    $("#accountSyncStatus").textContent = accounts.length ? "Datos actualizados hoy" : "Sin cuentas vinculadas";
    $("#accountsList").innerHTML = accounts.map((account) => `<article class="card account-card">
      <span class="account-brand">${escapeHTML(account.institution)}</span>
      <h3>${escapeHTML(account.name)}</h3>
      <strong>${money(account.balance)} <small>CLP</small></strong>
      <span class="account-number">•••• ${escapeHTML(account.lastFour)}</span>
      <footer><span>● ${escapeHTML(account.updatedAt || "Actualizada hoy")}</span><button data-disconnect-account="${account.id}">Desconectar</button></footer>
    </article>`).join("") || '<article class="card empty-state">Aún no hay cuentas vinculadas. Usa “Vincular cuenta” para comenzar.</article>';
  }

  function renderAll() {
    document.body.classList.toggle("light", state.theme === "light");
    $("#darkTheme").classList.toggle("selected", state.theme === "dark");
    $("#lightTheme").classList.toggle("selected", state.theme === "light");
    renderTransactions();
    renderDashboard();
    renderAnalytics();
    renderAccounts();
  }

  function navigate(view) {
    $$(".view").forEach((section) => section.classList.toggle("active", section.id === view));
    $$(".bottom-nav button, .side-nav button").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  async function persistTransaction(transaction) {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.from("transactions").insert({
      description: transaction.name, amount: transaction.amount, category: transaction.category, payment_method: transaction.payment, frequency: transaction.frequency, is_micro_expense: transaction.micro
    });
    if (error) console.warn("Supabase no sincronizó el movimiento:", error.message);
  }

  function updateProjection() {
    const rate = Number($("#reductionRange").value);
    const months = Number($("#monthsRange").value);
    const annual = Math.round((state.budget - spent()) * (rate / 100));
    $("#reductionValue").textContent = `${rate}%`;
    $("#monthsValue").textContent = `${months} meses`;
    $("#chartMonths").textContent = months;
    $("#projectionMonths").textContent = months;
    $("#projectionRate").textContent = rate;
    $("#monthlySavings").textContent = `${money(Math.round(annual / 12))} CLP`;
    $("#annualSavings").textContent = `${money(Math.round((annual / 12) * months))} / ${money(annual)} CLP`;
  }

  $$("[data-view]").forEach((button) => button.addEventListener("click", () => navigate(button.dataset.view)));
  $$("[data-savings-segment] button").forEach((button) => button.addEventListener("click", () => renderSavings(Number(button.dataset.rate))));
  $("#transactionFilters").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    selectedFilter = button.dataset.filter;
    $$("#transactionFilters button").forEach((filter) => filter.classList.toggle("selected", filter === button));
    renderTransactions();
  });
  $("#expenseAmount").addEventListener("input", (event) => { $("#monthlyImpact").textContent = `${money(event.target.value)} CLP`; });
  $("#expenseForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const transaction = { id: crypto.randomUUID(), name: $("#expenseName").value.trim(), amount: Number($("#expenseAmount").value), category: $("#expenseCategory").value, payment: $("#expensePayment").value, frequency: $("#expenseFrequency").value, micro: $("#microToggle").checked, createdAt: new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()) };
    state.transactions.unshift(transaction);
    save(); renderAll(); event.target.reset(); $("#monthlyImpact").textContent = "$0 CLP";
    persistTransaction(transaction); toast("Gasto registrado correctamente");
  });
  $("#showConnectAccount").addEventListener("click", () => { $("#connectAccountPanel").hidden = false; $("#accountName").focus(); });
  $("#hideConnectAccount").addEventListener("click", () => { $("#connectAccountPanel").hidden = true; });
  $("#accountForm").addEventListener("submit", (event) => {
    event.preventDefault();
    state.accounts.unshift({ id: crypto.randomUUID(), institution: $("#accountInstitution").value, name: $("#accountName").value.trim(), lastFour: $("#accountLastFour").value.trim().padStart(4, "•"), balance: Number($("#accountBalance").value), updatedAt: "Actualizada recién" });
    save(); renderAccounts(); event.target.reset(); $("#connectAccountPanel").hidden = true;
    toast("Cuenta agregada en modo demostración");
  });
  $("#accountsList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-disconnect-account]"); if (!button) return;
    state.accounts = state.accounts.filter((account) => account.id !== button.dataset.disconnectAccount); save(); renderAccounts(); toast("Cuenta desconectada de este panel");
  });
  const syncMessage = () => { $("#accountSyncStatus").textContent = "Actualizado recién"; toast("Saldos actualizados en modo demostración"); };
  $("#syncAccounts").addEventListener("click", syncMessage); $("#refreshAccounts").addEventListener("click", syncMessage);
  $("#securityInfo").addEventListener("click", () => toast("Las conexiones reales se autorizan con OAuth y consentimiento bancario."));
  $("#reductionRange").addEventListener("input", updateProjection); $("#monthsRange").addEventListener("input", updateProjection);
  $("#budgetCards").addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-budget]"); if (!button) return;
    const name = button.dataset.saveBudget; const input = $(`[data-budget-input="${name}"]`);
    state.budgets[name] = Number(input.value) || 0; if (name === "Global") state.budget = state.budgets[name]; save(); renderAll(); toast(`Presupuesto de ${name} guardado`);
  });
  $("#darkTheme").addEventListener("click", () => { state.theme = "dark"; save(); renderAll(); });
  $("#lightTheme").addEventListener("click", () => { state.theme = "light"; save(); renderAll(); });
  $("#editProfileBtn").addEventListener("click", () => {
    const name = window.prompt("Nombre para tu cuenta:", state.profile.name); if (!name?.trim()) return;
    state.profile.name = name.trim(); save(); renderAll(); toast("Perfil actualizado");
  });
  $("#signOutBtn").addEventListener("click", async () => { if (supabaseClient) await supabaseClient.auth.signOut(); toast("Sesión cerrada en este dispositivo"); });
  $("#notificationBtn").addEventListener("click", () => toast("Sin alertas nuevas. Tu presupuesto está bajo control."));

  renderAll();
  updateProjection();
})();
