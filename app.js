// Central de Fretes Cootravale - Core Application Logic

// Configuration
const SUPABASE_URL = "https://ebnquccajiphgfnvuehx.supabase.co";
const SUPABASE_KEY = "sb_publishable_rbNRNEKmmEvKqKMpFmCAtg_2JezrKUZ";

// Initialize Supabase Client
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

// Application State
let appState = {
  user: null,
  queues: [], // Raw view data
  filteredQueues: {}, // Grouped and filtered view data
  vehicleTypes: [], // List of unique vehicle types for filtering
  filters: {
    search: "",
    vehicleType: "",
    frota: "all"
  },
  theme: "dark",
  sidebarCollapsed: false,
  autoRefresh: {
    active: true,
    intervalId: null,
    countdown: 30,
    maxSeconds: 30
  }
};

// UI Elements
const els = {
  authSection: document.getElementById("auth-section"),
  dashboardSection: document.getElementById("dashboard-section"),
  loginForm: document.getElementById("login-form"),
  loginEmail: document.getElementById("login-email"),
  loginPass: document.getElementById("login-password"),
  loginBtn: document.getElementById("login-btn"),
  
  // Dashboard
  sidebar: document.getElementById("sidebar"),
  toggleSidebarBtn: document.getElementById("toggle-sidebar-btn"),
  themeToggleBtn: document.getElementById("theme-toggle-btn"),
  logoutBtn: document.getElementById("logout-btn"),
  userEmailDisplay: document.getElementById("user-email"),
  userAvatarDisplay: document.getElementById("user-avatar"),
  
  // Toolbar
  searchInput: document.getElementById("search-input"),
  vehicleTypeFilter: document.getElementById("vehicle-type-filter"),
  frotaFilter: document.getElementById("frota-filter"),
  btnRefresh: document.getElementById("btn-refresh"),
  btnToggleAutoRefresh: document.getElementById("btn-toggle-auto-refresh"),
  refreshCountdownText: document.getElementById("refresh-countdown-text"),
  refreshIndicatorDot: document.getElementById("refresh-indicator-dot"),
  
  // Stats
  statTotalQueues: document.getElementById("stat-total-queues"),
  statTotalVehicles: document.getElementById("stat-total-vehicles"),
  statTotalFrota: document.getElementById("stat-total-frota"),
  statTotalRecusas: document.getElementById("stat-total-recusas"),
  
  // Content View
  queuesViewport: document.getElementById("queues-viewport"),
  
  // Modal
  modalBackdrop: document.getElementById("modal-backdrop"),
  modalTitle: document.getElementById("modal-title"),
  modalBody: document.getElementById("modal-body"),
  modalCloseBtn: document.getElementById("modal-close")
};

// TOAST SYSTEM
const Toast = {
  container: null,
  
  init() {
    this.container = document.getElementById("toast-container");
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      document.body.appendChild(this.container);
    }
  },
  
  show(title, message, type = "info", duration = 4000) {
    if (!this.container) this.init();
    
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    // Choose icon based on toast type
    let iconHTML = "";
    if (type === "success") {
      iconHTML = `<i data-lucide="check-circle" class="toast-icon"></i>`;
    } else if (type === "error") {
      iconHTML = `<i data-lucide="x-circle" class="toast-icon"></i>`;
    } else if (type === "warning") {
      iconHTML = `<i data-lucide="alert-triangle" class="toast-icon"></i>`;
    } else {
      iconHTML = `<i data-lucide="info" class="toast-icon"></i>`;
    }
    
    toast.innerHTML = `
      ${iconHTML}
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close"><i data-lucide="x"></i></button>
    `;
    
    this.container.appendChild(toast);
    lucide.createIcons();
    
    // Auto-remove
    const removeTimeout = setTimeout(() => {
      this.remove(toast);
    }, duration);
    
    // Close button event
    toast.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(removeTimeout);
      this.remove(toast);
    });
  },
  
  remove(toast) {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
};

// DATE FORMATTING HELPERS
function formatDateTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getRelativeTime(isoString) {
  if (!isoString) return "";
  const start = new Date(isoString);
  const now = new Date();
  const diffMs = now - start;
  
  if (diffMs < 0) return "Entrou agora";
  
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) {
    return `${diffMins} min`;
  }
  
  const diffHours = Math.floor(diffMins / 60);
  const remainingMins = diffMins % 60;
  if (diffHours < 24) {
    return `${diffHours}h ${remainingMins}m`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;
  return `${diffDays}d ${remainingHours}h`;
}

// INITIALIZATION & STATE LISTENERS
document.addEventListener("DOMContentLoaded", async () => {
  Toast.init();
  setupTheme();
  setupEventListeners();
  
  // Check active Supabase session
  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (session) {
    handleSignIn(session.user);
  } else {
    handleSignOut();
  }
  
  // Listen to Auth Changes
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      handleSignIn(session.user);
    } else {
      handleSignOut();
    }
  });
});

// AUTHENTICATION FUNCTIONS
function handleSignIn(user) {
  appState.user = user;
  els.userEmailDisplay.textContent = user.email;
  els.userAvatarDisplay.textContent = user.email.substring(0, 2).toUpperCase();
  
  els.authSection.classList.add("hidden");
  els.dashboardSection.classList.remove("hidden");
  
  // Load sidebar collapsed state
  const sidebarSaved = localStorage.getItem("cfc_sidebar_collapsed");
  if (sidebarSaved === "true") {
    appState.sidebarCollapsed = true;
    els.sidebar.classList.add("collapsed");
  }
  
  // Load data
  loadQueuesData(true);
  startAutoRefresh();
}

function handleSignOut() {
  appState.user = null;
  stopAutoRefresh();
  els.authSection.classList.remove("hidden");
  els.dashboardSection.classList.add("hidden");
  
  // Clear sensitive UI elements
  els.queuesViewport.innerHTML = "";
  els.loginEmail.value = "";
  els.loginPass.value = "";
}

// THEME HANDLING
function setupTheme() {
  const savedTheme = localStorage.getItem("cfc_theme") || "dark";
  setTheme(savedTheme);
}

function setTheme(theme) {
  appState.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("cfc_theme", theme);
  
  // Update theme toggle icon
  if (theme === "light") {
    els.themeToggleBtn.innerHTML = `<i data-lucide="moon"></i>`;
  } else {
    els.themeToggleBtn.innerHTML = `<i data-lucide="sun"></i>`;
  }
  lucide.createIcons();
}

// EVENTS ATTACHMENTS
function setupEventListeners() {
  // Login Form
  els.loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = els.loginEmail.value.trim();
    const password = els.loginPass.value;
    
    if (!email || !password) {
      Toast.show("Campos Vazios", "Por favor preencha email e senha.", "warning");
      return;
    }
    
    els.loginBtn.disabled = true;
    els.loginBtn.innerHTML = `<div class="spinner"></div><span>Entrando...</span>`;
    
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      Toast.show("Bem-vindo!", "Autenticação realizada com sucesso.", "success");
    } catch (error) {
      Toast.show("Erro ao entrar", error.message || "Credenciais inválidas.", "error");
      els.loginBtn.disabled = false;
      els.loginBtn.innerHTML = `<span>Entrar</span>`;
    }
  });
  
  // Logout
  els.logoutBtn.addEventListener("click", async () => {
    try {
      await supabaseClient.auth.signOut();
      Toast.show("Sessão Encerrada", "Você saiu do sistema.", "info");
    } catch (error) {
      Toast.show("Erro ao Sair", "Ocorreu um erro no logout.", "error");
    }
  });
  
  // Toggle Sidebar
  els.toggleSidebarBtn.addEventListener("click", () => {
    appState.sidebarCollapsed = !appState.sidebarCollapsed;
    els.sidebar.classList.toggle("collapsed", appState.sidebarCollapsed);
    localStorage.setItem("cfc_sidebar_collapsed", appState.sidebarCollapsed);
  });
  
  // Toggle Theme
  els.themeToggleBtn.addEventListener("click", () => {
    const newTheme = appState.theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    Toast.show(
      "Tema Alterado", 
      `Interface ajustada para o modo ${newTheme === "dark" ? "escuro" : "claro"}.`, 
      "info"
    );
  });
  
  // Manual Refresh
  els.btnRefresh.addEventListener("click", () => {
    loadQueuesData(false);
  });
  
  // Toggle Auto Refresh
  els.btnToggleAutoRefresh.addEventListener("click", () => {
    appState.autoRefresh.active = !appState.autoRefresh.active;
    if (appState.autoRefresh.active) {
      startAutoRefresh();
      Toast.show("Atualização Automática", "Timer reativado.", "success");
    } else {
      stopAutoRefresh();
      Toast.show("Atualização Automática", "Timer pausado.", "info");
    }
    updateAutoRefreshUI();
  });
  
  // Search & Filters inputs
  els.searchInput.addEventListener("input", (e) => {
    appState.filters.search = e.target.value.toLowerCase().trim();
    applyFiltersAndRender();
  });
  
  els.vehicleTypeFilter.addEventListener("change", (e) => {
    appState.filters.vehicleType = e.target.value;
    applyFiltersAndRender();
  });
  
  els.frotaFilter.addEventListener("change", (e) => {
    appState.filters.frota = e.target.value;
    applyFiltersAndRender();
  });
  
  // Modal close
  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.modalBackdrop) closeModal();
  });
  
  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

// DATA QUERYING & PROCESSING
async function loadQueuesData(showLoadingIndicator = false) {
  if (showLoadingIndicator) {
    renderSkeletons();
  }
  
  try {
    const { data, error } = await supabaseClient
      .from("vw_filas")
      .select("*");
      
    if (error) throw error;
    
    appState.queues = data || [];
    
    // Extract unique vehicle types for filter select
    const typesSet = new Set();
    appState.queues.forEach(item => {
      if (item.tipo) typesSet.add(item.tipo);
    });
    appState.vehicleTypes = Array.from(typesSet).sort();
    
    // Populate vehicle type dropdown if we just loaded or it's empty
    populateVehicleTypeSelect();
    
    // Apply filters and render
    applyFiltersAndRender();
    updateStats();
    
    // Reset auto-refresh timer to max seconds upon successful data load
    appState.autoRefresh.countdown = appState.autoRefresh.maxSeconds;
    updateAutoRefreshUI();
    
  } catch (error) {
    console.error("Erro ao carregar dados do supabase:", error);
    Toast.show("Erro ao carregar dados", error.message || "Verifique sua conexão ou permissões.", "error");
  }
}

// POPULATE DROPDOWN
function populateVehicleTypeSelect() {
  const currentVal = els.vehicleTypeFilter.value;
  els.vehicleTypeFilter.innerHTML = '<option value="">Todos os tipos</option>';
  
  appState.vehicleTypes.forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    els.vehicleTypeFilter.appendChild(option);
  });
  
  // Restore value if still present
  if (appState.vehicleTypes.includes(currentVal)) {
    els.vehicleTypeFilter.value = currentVal;
  } else {
    appState.filters.vehicleType = "";
  }
}

// FILTERING & GROUPING LOGIC
function applyFiltersAndRender() {
  const search = appState.filters.search;
  const vType = appState.filters.vehicleType;
  const frota = appState.filters.frota;
  
  // 1. Filter raw records
  const filteredRecords = appState.queues.filter(item => {
    // Search text (checks plates, cooperator name, or queue name)
    const plateMatch = (item.placa && item.placa.toLowerCase().includes(search)) ||
                       (item.placa2 && item.placa2.toLowerCase().includes(search)) ||
                       (item.placa3 && item.placa3.toLowerCase().includes(search));
    const coopMatch = item.nomeCooperado && item.nomeCooperado.toLowerCase().includes(search);
    const queueMatch = item.descFila && item.descFila.toLowerCase().includes(search);
    
    const searchMatch = !search || plateMatch || coopMatch || queueMatch;
    
    // Vehicle Type
    const typeMatch = !vType || item.tipo === vType;
    
    // Frota status
    let frotaMatch = true;
    if (frota === "frota") {
      frotaMatch = item.frota === true;
    } else if (frota === "terceiro") {
      frotaMatch = item.frota === false;
    }
    
    return searchMatch && typeMatch && frotaMatch;
  });
  
  // 2. Group by descFila
  const grouped = {};
  filteredRecords.forEach(item => {
    const queueName = item.descFila || "Fila não especificada";
    if (!grouped[queueName]) {
      grouped[queueName] = [];
    }
    grouped[queueName].push(item);
  });
  
  // 3. Sort items inside each queue by dthRef ascending
  for (const queueName in grouped) {
    grouped[queueName].sort((a, b) => {
      const dateA = a.dthRef ? new Date(a.dthRef) : new Date(0);
      const dateB = b.dthRef ? new Date(b.dthRef) : new Date(0);
      return dateA - dateB;
    });
  }
  
  appState.filteredQueues = grouped;
  renderQueuesGrid();
}

// STATS GENERATION
function updateStats() {
  const queuesCount = Object.keys(appState.filteredQueues).length;
  
  let totalVehicles = 0;
  let totalFrota = 0;
  let totalRecusas = 0;
  
  // Calculate stats from raw queues based on current local view
  appState.queues.forEach(item => {
    totalVehicles++;
    if (item.frota) totalFrota++;
    if (item.recusas && Array.isArray(item.recusas)) {
      totalRecusas += item.recusas.length;
    }
  });
  
  els.statTotalQueues.textContent = queuesCount;
  els.statTotalVehicles.textContent = totalVehicles;
  els.statTotalFrota.textContent = totalFrota;
  els.statTotalRecusas.textContent = totalRecusas;
}

// RENDERING SKELETONS (LOADING VIEW)
function renderSkeletons() {
  els.queuesViewport.innerHTML = "";
  
  // Create 3 skeleton columns
  for (let i = 0; i < 3; i++) {
    const col = document.createElement("div");
    col.className = "queue-column";
    col.innerHTML = `
      <div class="queue-column-header">
        <div class="skeleton" style="width: 140px; height: 16px;"></div>
        <div class="skeleton" style="width: 32px; height: 18px; border-radius: 10px;"></div>
      </div>
      <div class="queue-body-wrapper">
        <table class="queue-table">
          <thead>
            <tr>
              <th style="width: 32px;">Pos</th>
              <th style="width: 110px;">Placas</th>
              <th>Veículo / Cooperado</th>
              <th style="width: 70px;">Vínculo</th>
              <th style="width: 48px; text-align: center;">Rec.</th>
            </tr>
          </thead>
          <tbody>
            ${Array(4).fill(0).map(() => `
              <tr class="skeleton-row">
                <td><div class="skeleton sk-pos"></div></td>
                <td><div class="skeleton sk-plate"></div></td>
                <td>
                  <div class="skeleton sk-type" style="margin-bottom: 4px;"></div>
                  <div class="skeleton" style="width: 80px; height: 12px;"></div>
                </td>
                <td><div class="skeleton sk-frota"></div></td>
                <td><div class="skeleton sk-rec"></div></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    els.queuesViewport.appendChild(col);
  }
}

// RENDER REAL QUEUES TABLE GRID
function renderQueuesGrid() {
  els.queuesViewport.innerHTML = "";
  
  const queueNames = Object.keys(appState.filteredQueues).sort();
  
  if (queueNames.length === 0) {
    els.queuesViewport.innerHTML = `
      <div class="empty-queue" style="width: 100%; height: 250px;">
        <i data-lucide="search-x"></i>
        <div class="empty-queue-text">Nenhuma fila encontrada com os filtros atuais.</div>
      </div>
    `;
    lucide.createIcons();
    return;
  }
  
  queueNames.forEach(queueName => {
    const vehicles = appState.filteredQueues[queueName];
    
    const col = document.createElement("div");
    col.className = "queue-column";
    
    // Column Header
    const header = document.createElement("div");
    header.className = "queue-column-header";
    header.innerHTML = `
      <div class="queue-title-wrapper" title="${queueName}">
        <span class="queue-title">${queueName}</span>
      </div>
      <span class="queue-badge">${vehicles.length}</span>
    `;
    col.appendChild(header);
    
    // Column Table Body
    const bodyWrapper = document.createElement("div");
    bodyWrapper.className = "queue-body-wrapper";
    
    const table = document.createElement("table");
    table.className = "queue-table";
    
    // Headers
    table.innerHTML = `
      <thead>
        <tr>
          <th class="pos-cell">Pos</th>
          <th class="plate-cell">Placas</th>
          <th class="vehicle-cell">Veículo / Cooperado</th>
          <th>Vínculo</th>
          <th class="recusa-cell">Rec.</th>
        </tr>
      </thead>
    `;
    
    const tbody = document.createElement("tbody");
    
    if (vehicles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="empty-queue">
              <i data-lucide="truck"></i>
              <div class="empty-queue-text">Fila vazia</div>
            </div>
          </td>
        </tr>
      `;
    } else {
      vehicles.forEach((vehicle, index) => {
        const row = document.createElement("tr");
        
        // Position Column
        const posCell = document.createElement("td");
        posCell.className = "pos-cell";
        posCell.innerHTML = `<span class="pos-badge">${index + 1}</span>`;
        row.appendChild(posCell);
        
        // Plates Stack Column (Render Plate styles)
        const plateCell = document.createElement("td");
        plateCell.className = "plate-cell";
        
        const platesStack = document.createElement("div");
        platesStack.className = "plates-stack";
        
        // Render Main Plate (placa)
        const mainPlateHTML = renderPlateBadge(vehicle.placa);
        platesStack.innerHTML = mainPlateHTML;
        
        // Render trailers (placa2, placa3) if present
        if (vehicle.placa2) {
          platesStack.innerHTML += renderPlateBadge(vehicle.placa2, true);
        }
        if (vehicle.placa3) {
          platesStack.innerHTML += renderPlateBadge(vehicle.placa3, true);
        }
        
        plateCell.appendChild(platesStack);
        row.appendChild(plateCell);
        
        // Vehicle Type and Cooperado
        const vCell = document.createElement("td");
        vCell.className = "vehicle-cell";
        vCell.innerHTML = `
          <div class="vehicle-type" title="${vehicle.tipo || 'N/D'}">${vehicle.tipo || 'N/D'}</div>
          <div class="cooperado-name" title="${vehicle.nomeCooperado || 'N/D'}">${vehicle.nomeCooperado || 'N/D'}</div>
          <div class="history-date" style="font-size: 0.65rem; margin-top: 4px;" title="Entrada na fila: ${formatDateTime(vehicle.dthRef)}">
            Entrou há: ${getRelativeTime(vehicle.dthRef)}
          </div>
        `;
        row.appendChild(vCell);
        
        // Frota status
        const fCell = document.createElement("td");
        if (vehicle.frota) {
          fCell.innerHTML = `<span class="frota-badge frota" title="Frota própria da Cootravale"><i data-lucide="shield-check" style="width:10px;height:10px;"></i> Frota</span>`;
        } else {
          fCell.innerHTML = `<span class="frota-badge terceiro" title="Veículo Terceirizado"><i data-lucide="user" style="width:10px;height:10px;"></i> Terceiro</span>`;
        }
        row.appendChild(fCell);
        
        // Refusals cell
        const recCell = document.createElement("td");
        recCell.className = "recusa-cell";
        const recCount = vehicle.recusas && Array.isArray(vehicle.recusas) ? vehicle.recusas.length : 0;
        
        if (recCount > 0) {
          const recBadge = document.createElement("span");
          recBadge.className = "recusa-badge";
          recBadge.textContent = recCount;
          recBadge.title = `Visualizar ${recCount} recusa(s) de frete`;
          
          recBadge.addEventListener("click", () => {
            openRefusalsModal(vehicle);
          });
          
          recCell.appendChild(recBadge);
        } else {
          recCell.innerHTML = `<span style="color:var(--text-muted); opacity: 0.3;">-</span>`;
        }
        row.appendChild(recCell);
        
        tbody.appendChild(row);
      });
    }
    
    table.appendChild(tbody);
    bodyWrapper.appendChild(table);
    col.appendChild(bodyWrapper);
    
    els.queuesViewport.appendChild(col);
  });
  
  // Re-generate lucide icons in dynamically created elements
  lucide.createIcons();
}

// BRAZILIAN PLATE FORMAT GENERATOR
function renderPlateBadge(plateString, isTrailer = false) {
  if (!plateString) return "";
  const cleanedPlate = plateString.toUpperCase().replace(/[^A-Z0-9]/g, "");
  
  // Format standard or Mercosul plates with a dash for readability
  let formattedPlate = cleanedPlate;
  if (cleanedPlate.length === 7) {
    formattedPlate = cleanedPlate.substring(0, 3) + "-" + cleanedPlate.substring(3);
  }
  
  const badgeClass = isTrailer ? "plate-badge-trailer" : "plate-badge-main";
  const titleText = isTrailer ? "Reboque" : "Placa Principal";
  
  return `
    <span class="plate-badge ${badgeClass}" title="${titleText}">${formattedPlate}</span>
  `;
}

// REFUSALS MODAL RENDERING
function openRefusalsModal(vehicle) {
  els.modalTitle.textContent = `Histórico de Recusas - Placa: ${vehicle.placa}`;
  els.modalBody.innerHTML = "";
  
  const timeline = document.createElement("div");
  timeline.className = "history-timeline";
  
  const recusas = vehicle.recusas || [];
  
  // Sort refusals by date descending (newest first)
  const sortedRecusas = [...recusas].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  sortedRecusas.forEach(rec => {
    const item = document.createElement("div");
    
    // Parse description to find "# Fim de fila: true/false"
    const textDesc = rec.descricao || "";
    
    let isFimFila = false;
    let hasFimFilaInfo = false;
    
    if (textDesc.includes("Fim de fila: true") || textDesc.includes("Fim de fila:  true")) {
      isFimFila = true;
      hasFimFilaInfo = true;
    } else if (textDesc.includes("Fim de fila: false") || textDesc.includes("Fim de fila:  false")) {
      isFimFila = false;
      hasFimFilaInfo = true;
    }
    
    // Clean up description (remove the "# Fim de fila" block from main text if desired, or format nicely)
    const cleanedDesc = textDesc.replace(/# Fim de fila:.*$/m, "").trim();
    
    // Set custom classes for timeline color
    let statusClass = "";
    let badgeHTML = "";
    if (hasFimFilaInfo) {
      if (isFimFila) {
        statusClass = "fim-fila-true";
        badgeHTML = `<span class="refusal-badge-in-desc red"><i data-lucide="arrow-down-right" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Enviado para o fim da fila</span>`;
      } else {
        statusClass = "fim-fila-false";
        badgeHTML = `<span class="refusal-badge-in-desc yellow"><i data-lucide="check" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Posição preservada</span>`;
      }
    }
    
    item.className = `history-item ${statusClass}`;
    item.innerHTML = `
      <div class="history-bullet"></div>
      <div class="history-date">${formatDateTime(rec.created_at)}</div>
      <div class="history-desc">${cleanedDesc}</div>
      ${badgeHTML}
    `;
    timeline.appendChild(item);
  });
  
  els.modalBody.appendChild(timeline);
  els.modalBackdrop.classList.add("show");
  
  lucide.createIcons();
}

function closeModal() {
  els.modalBackdrop.classList.remove("show");
}

// AUTO REFRESH TIMER MECHANISMS
function startAutoRefresh() {
  if (appState.autoRefresh.intervalId) clearInterval(appState.autoRefresh.intervalId);
  
  appState.autoRefresh.countdown = appState.autoRefresh.maxSeconds;
  updateAutoRefreshUI();
  
  appState.autoRefresh.intervalId = setInterval(() => {
    appState.autoRefresh.countdown--;
    
    if (appState.autoRefresh.countdown <= 0) {
      loadQueuesData(false); // Fetch silently (no loading skeletons)
      appState.autoRefresh.countdown = appState.autoRefresh.maxSeconds;
    }
    updateAutoRefreshUI();
  }, 1000);
}

function stopAutoRefresh() {
  if (appState.autoRefresh.intervalId) {
    clearInterval(appState.autoRefresh.intervalId);
    appState.autoRefresh.intervalId = null;
  }
  updateAutoRefreshUI();
}

function updateAutoRefreshUI() {
  if (appState.autoRefresh.active) {
    els.btnToggleAutoRefresh.innerHTML = `<i data-lucide="pause"></i>`;
    els.refreshCountdownText.textContent = `Atualizando em ${appState.autoRefresh.countdown}s`;
    els.refreshIndicatorDot.className = "indicator-dot active";
  } else {
    els.btnToggleAutoRefresh.innerHTML = `<i data-lucide="play"></i>`;
    els.refreshCountdownText.textContent = `Atualização pausada`;
    els.refreshIndicatorDot.className = "indicator-dot inactive";
  }
  lucide.createIcons();
}
