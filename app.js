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
  isAdmin: false,
  currentView: "queues", // "queues" or "vehicles"
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
  },
  // CRUD state
  vehicles: [],
  cooperados: [],
  veiculosTiposActive: [],
  vehiclesSearch: "",
  cooperadosSearch: "",
  cooperadoFormContacts: []
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
  modalCloseBtn: document.getElementById("modal-close"),

  // Admin and CRUD elements
  sidebarAdminNav: document.getElementById("sidebar-admin-nav"),
  navBtnQueues: document.getElementById("nav-btn-queues"),
  navBtnVehicles: document.getElementById("nav-btn-vehicles"),
  navBtnCooperados: document.getElementById("nav-btn-cooperados"),
  vehiclesCrudSection: document.getElementById("vehicles-crud-section"),
  cooperadosCrudSection: document.getElementById("cooperados-crud-section"),
  btnNewVehicle: document.getElementById("btn-new-vehicle"),
  btnNewCooperado: document.getElementById("btn-new-cooperado"),
  crudSearchInput: document.getElementById("crud-search-input"),
  crudCooperadosSearchInput: document.getElementById("crud-cooperados-search-input"),
  crudVehiclesTbody: document.getElementById("crud-vehicles-tbody"),
  crudCooperadosTbody: document.getElementById("crud-cooperados-tbody"),
  vehicleModalBackdrop: document.getElementById("vehicle-modal-backdrop"),
  cooperadoModalBackdrop: document.getElementById("cooperado-modal-backdrop"),
  vehicleModalTitle: document.getElementById("vehicle-modal-title"),
  cooperadoModalTitle: document.getElementById("cooperado-modal-title"),
  vehicleModalClose: document.getElementById("vehicle-modal-close"),
  cooperadoModalClose: document.getElementById("cooperado-modal-close"),
  vehicleForm: document.getElementById("vehicle-form"),
  cooperadoForm: document.getElementById("cooperado-form"),
  vehicleId: document.getElementById("vehicle-id"),
  cooperadoId: document.getElementById("cooperado-id"),
  vehiclePlaca: document.getElementById("vehicle-placa"),
  cooperadoNome: document.getElementById("cooperado-nome"),
  vehiclePlaca2: document.getElementById("vehicle-placa2"),
  cooperadoContactInput: document.getElementById("cooperado-contact-input"),
  vehiclePlaca3: document.getElementById("vehicle-placa3"),
  btnAddContactTag: document.getElementById("btn-add-contact-tag"),
  cooperadoContactsTagsContainer: document.getElementById("cooperado-contacts-tags-container"),
  vehicleCooperado: document.getElementById("vehicle-cooperado"),
  vehicleTipo: document.getElementById("vehicle-tipo"),
  vehicleFrota: document.getElementById("vehicle-frota"),
  btnCancelVehicle: document.getElementById("btn-cancel-vehicle"),
  btnCancelCooperado: document.getElementById("btn-cancel-cooperado")
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
async function handleSignIn(user) {
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
  
  // Check user role from profiles table
  try {
    const { data: profile, error } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (error) throw error;
    
    if (profile && profile.role === 'admin') {
      appState.isAdmin = true;
      document.querySelector(".user-role").textContent = "Administrador";
      els.sidebarAdminNav.classList.remove("hidden");
      loadAdminAuxiliaryData();
    } else {
      appState.isAdmin = false;
      document.querySelector(".user-role").textContent = "Operador";
      els.sidebarAdminNav.classList.add("hidden");
      switchView("queues");
    }
  } catch (err) {
    console.error("Erro ao verificar papel do usuario:", err);
    appState.isAdmin = false;
    document.querySelector(".user-role").textContent = "Operador";
    els.sidebarAdminNav.classList.add("hidden");
    switchView("queues");
  }
  
  // Load data
  loadQueuesData(true);
  startAutoRefresh();
}

function handleSignOut() {
  appState.user = null;
  appState.isAdmin = false;
  appState.currentView = "queues";
  appState.vehicles = [];
  appState.cooperados = [];
  appState.veiculosTiposActive = [];
  
  stopAutoRefresh();
  els.authSection.classList.remove("hidden");
  els.dashboardSection.classList.add("hidden");
  
  // Reset navigation states
  els.navBtnQueues.classList.add("active");
  els.navBtnVehicles.classList.remove("active");
  els.navBtnCooperados.classList.remove("active");
  els.vehiclesCrudSection.classList.add("hidden");
  els.cooperadosCrudSection.classList.add("hidden");
  els.queuesViewport.classList.remove("hidden");
  const controlBar = document.querySelector(".control-bar");
  if (controlBar) controlBar.classList.remove("hidden");
  
  // Clear sensitive UI elements
  els.queuesViewport.innerHTML = "";
  els.crudVehiclesTbody.innerHTML = "";
  els.crudCooperadosTbody.innerHTML = "";
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
  
  // Admin Navigation event listeners
  els.navBtnQueues.addEventListener("click", () => switchView("queues"));
  els.navBtnVehicles.addEventListener("click", () => switchView("vehicles"));
  els.navBtnCooperados.addEventListener("click", () => switchView("cooperados"));

  // Vehicle Modal Open/Close
  els.btnNewVehicle.addEventListener("click", () => openVehicleModal());
  els.vehicleModalClose.addEventListener("click", closeVehicleModal);
  els.btnCancelVehicle.addEventListener("click", closeVehicleModal);
  els.vehicleModalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.vehicleModalBackdrop) closeVehicleModal();
  });

  // Vehicle Form Submit
  els.vehicleForm.addEventListener("submit", handleVehicleFormSubmit);

  // Vehicle Search Input
  els.crudSearchInput.addEventListener("input", (e) => {
    appState.vehiclesSearch = e.target.value.toLowerCase().trim();
    renderVehiclesTable();
  });

  // Cooperado Modal Open/Close
  els.btnNewCooperado.addEventListener("click", () => openCooperadoModal());
  els.cooperadoModalClose.addEventListener("click", closeCooperadoModal);
  els.btnCancelCooperado.addEventListener("click", closeCooperadoModal);
  els.cooperadoModalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.cooperadoModalBackdrop) closeCooperadoModal();
  });

  // Contact Tag Addition
  els.btnAddContactTag.addEventListener("click", addContactTag);
  els.cooperadoContactInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addContactTag();
    }
  });

  // Cooperado Form Submit
  els.cooperadoForm.addEventListener("submit", handleCooperadoFormSubmit);

  // Cooperado Search Input
  els.crudCooperadosSearchInput.addEventListener("input", (e) => {
    appState.cooperadosSearch = e.target.value.toLowerCase().trim();
    renderCooperadosTable();
  });

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeVehicleModal();
      closeCooperadoModal();
    }
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

// ==========================================
// ADMINISTRATIVE & CRUD SYSTEM FUNCTIONS
// ==========================================

function switchView(view) {
  if ((view === "vehicles" || view === "cooperados") && !appState.isAdmin) {
    Toast.show("Acesso Negado", "Apenas administradores possuem este acesso.", "error");
    return;
  }
  
  appState.currentView = view;
  const controlBar = document.querySelector(".control-bar");
  
  // Reset all views to hidden
  els.queuesViewport.classList.add("hidden");
  els.vehiclesCrudSection.classList.add("hidden");
  els.cooperadosCrudSection.classList.add("hidden");
  if (controlBar) controlBar.classList.add("hidden");
  
  // Reset active navigation styles
  els.navBtnQueues.classList.remove("active");
  els.navBtnVehicles.classList.remove("active");
  els.navBtnCooperados.classList.remove("active");
  
  if (view === "vehicles") {
    els.vehiclesCrudSection.classList.remove("hidden");
    els.navBtnVehicles.classList.add("active");
    
    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";
    
    loadVehiclesData();
  } else if (view === "cooperados") {
    els.cooperadosCrudSection.classList.remove("hidden");
    els.navBtnCooperados.classList.add("active");
    
    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";
    
    loadCooperadosData();
  } else {
    // default/queues view
    els.queuesViewport.classList.remove("hidden");
    if (controlBar) controlBar.classList.remove("hidden");
    els.navBtnQueues.classList.add("active");
    
    if (appState.autoRefresh.active) {
      startAutoRefresh();
    }
    loadQueuesData(true);
  }
}

async function loadAdminAuxiliaryData() {
  try {
    // Fetch Cooperados (selecting status and idContatos)
    const { data: cooperadosData, error: coopError } = await supabaseClient
      .from("cooperado")
      .select("id, nome, status, idContatos")
      .order("nome");
      
    if (coopError) throw coopError;
    appState.cooperados = cooperadosData || [];
    
    // Fetch active Vehicle Types
    const { data: typesData, error: typesError } = await supabaseClient
      .from("veiculosTipos")
      .select("nome")
      .eq("status", "ativo")
      .order("nome");
      
    if (typesError) throw typesError;
    appState.veiculosTiposActive = typesData || [];
    
    populateModalDropdowns();
  } catch (err) {
    console.error("Erro ao carregar dados auxiliares do admin:", err);
  }
}

function populateModalDropdowns() {
  // Cooperado select dropdown (filtering active ones)
  els.vehicleCooperado.innerHTML = '<option value="">Selecione um Cooperado...</option>';
  appState.cooperados.forEach(coop => {
    if (coop.status !== 'inativo') {
      const opt = document.createElement("option");
      opt.value = coop.id;
      opt.textContent = coop.nome;
      els.vehicleCooperado.appendChild(opt);
    }
  });

  // Vehicle types dropdown
  els.vehicleTipo.innerHTML = '<option value="">Selecione um Tipo...</option>';
  appState.veiculosTiposActive.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type.nome;
    opt.textContent = type.nome;
    els.vehicleTipo.appendChild(opt);
  });
}

function getCooperadoName(cooperadoId) {
  if (!cooperadoId) return "Não associado";
  const coop = appState.cooperados.find(c => c.id === cooperadoId);
  return coop ? coop.nome : "Carregando...";
}

async function loadVehiclesData() {
  els.crudVehiclesTbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 2rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        Carregando veículos...
      </td>
    </tr>
  `;
  
  try {
    const { data, error } = await supabaseClient
      .from("veiculos")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    
    // Filter out inactive vehicles (soft deleted)
    appState.vehicles = (data || []).filter(v => v.status !== 'inativo');
    renderVehiclesTable();
  } catch (err) {
    console.error("Erro ao carregar veículos:", err);
    Toast.show("Erro ao carregar veículos", err.message || "Tente novamente mais tarde.", "error");
    els.crudVehiclesTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao obter lista de veículos.
        </td>
      </tr>
    `;
  }
}

function renderVehiclesTable() {
  els.crudVehiclesTbody.innerHTML = "";
  
  const search = appState.vehiclesSearch.toLowerCase();
  
  const filtered = appState.vehicles.filter(v => {
    const coopName = getCooperadoName(v.cooperado).toLowerCase();
    const plateMatch = (v.placa && v.placa.toLowerCase().includes(search)) ||
                       (v.placa2 && v.placa2.toLowerCase().includes(search)) ||
                       (v.placa3 && v.placa3.toLowerCase().includes(search));
    const coopMatch = coopName.includes(search);
    const tipoMatch = (v.tipo && v.tipo.toLowerCase().includes(search));
    
    return !search || plateMatch || coopMatch || tipoMatch;
  });
  
  if (filtered.length === 0) {
    els.crudVehiclesTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhum veículo cadastrado ou correspondente à busca.
        </td>
      </tr>
    `;
    return;
  }
  
  filtered.forEach(v => {
    const row = document.createElement("tr");
    
    // Placa Principal
    const tdPlaca = document.createElement("td");
    tdPlaca.innerHTML = renderPlateBadge(v.placa);
    row.appendChild(tdPlaca);
    
    // Placa Reboque 1
    const tdPlaca2 = document.createElement("td");
    tdPlaca2.innerHTML = v.placa2 ? renderPlateBadge(v.placa2, true) : '<span style="color:var(--text-muted);opacity:0.4;">-</span>';
    row.appendChild(tdPlaca2);
    
    // Placa Reboque 2
    const tdPlaca3 = document.createElement("td");
    tdPlaca3.innerHTML = v.placa3 ? renderPlateBadge(v.placa3, true) : '<span style="color:var(--text-muted);opacity:0.4;">-</span>';
    row.appendChild(tdPlaca3);
    
    // Cooperado
    const tdCoop = document.createElement("td");
    tdCoop.textContent = getCooperadoName(v.cooperado);
    row.appendChild(tdCoop);
    
    // Tipo
    const tdTipo = document.createElement("td");
    tdTipo.textContent = v.tipo || "N/D";
    row.appendChild(tdTipo);
    
    // Vínculo
    const tdVinculo = document.createElement("td");
    if (v.frota) {
      tdVinculo.innerHTML = `<span class="frota-badge frota"><i data-lucide="shield-check" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Frota</span>`;
    } else {
      tdVinculo.innerHTML = `<span class="frota-badge terceiro"><i data-lucide="user" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Terceiro</span>`;
    }
    row.appendChild(tdVinculo);
    
    // Ações
    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "center";
    
    const divActions = document.createElement("div");
    divActions.className = "crud-action-buttons";
    divActions.style.justifyContent = "center";
    
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-sm btn-secondary";
    btnEdit.innerHTML = `<i data-lucide="edit" style="width:12px;height:12px;"></i>`;
    btnEdit.title = "Editar";
    btnEdit.addEventListener("click", () => editVehicle(v.id));
    
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-sm btn-danger";
    btnDel.innerHTML = `<i data-lucide="trash-2" style="width:12px;height:12px;"></i>`;
    btnDel.title = "Excluir";
    btnDel.addEventListener("click", () => deleteVehicle(v.id));
    
    divActions.appendChild(btnEdit);
    divActions.appendChild(btnDel);
    tdActions.appendChild(divActions);
    row.appendChild(tdActions);
    
    els.crudVehiclesTbody.appendChild(row);
  });
  
  lucide.createIcons();
}

function openVehicleModal(vehicle = null) {
  // Ensure aux data is loaded
  if (appState.cooperados.length === 0 || appState.veiculosTiposActive.length === 0) {
    loadAdminAuxiliaryData();
  } else {
    populateModalDropdowns();
  }
  
  els.vehicleForm.reset();
  els.vehicleId.value = "";
  
  if (vehicle) {
    els.vehicleModalTitle.textContent = "Editar Veículo";
    els.vehicleId.value = vehicle.id;
    els.vehiclePlaca.value = vehicle.placa || "";
    els.vehiclePlaca2.value = vehicle.placa2 || "";
    els.vehiclePlaca3.value = vehicle.placa3 || "";
    
    // Select correct values after a brief timeout to let options render if needed
    setTimeout(() => {
      els.vehicleCooperado.value = vehicle.cooperado || "";
      els.vehicleTipo.value = vehicle.tipo || "";
      els.vehicleFrota.value = String(vehicle.frota);
    }, 50);
  } else {
    els.vehicleModalTitle.textContent = "Novo Veículo";
  }
  
  els.vehicleModalBackdrop.classList.add("show");
}

function closeVehicleModal() {
  els.vehicleModalBackdrop.classList.remove("show");
  els.vehicleForm.reset();
  els.vehicleId.value = "";
}

async function handleVehicleFormSubmit(e) {
  e.preventDefault();
  
  const id = els.vehicleId.value;
  const placa = els.vehiclePlaca.value.trim().toUpperCase();
  const placa2 = els.vehiclePlaca2.value.trim().toUpperCase() || null;
  const placa3 = els.vehiclePlaca3.value.trim().toUpperCase() || null;
  const cooperado = els.vehicleCooperado.value;
  const tipo = els.vehicleTipo.value;
  const frota = els.vehicleFrota.value === "true";
  
  const saveBtn = document.getElementById("btn-save-vehicle");
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="spinner"></div><span>Salvando...</span>`;
  
  const payload = {
    placa,
    placa2,
    placa3,
    cooperado,
    tipo,
    frota,
    status: 'ativo'
  };
  
  try {
    if (id) {
      // Update
      const { error } = await supabaseClient
        .from("veiculos")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabaseClient
        .from("veiculos")
        .insert([payload]);
      if (error) throw error;
    }
    
    Toast.show(
      id ? "Veículo Atualizado" : "Veículo Cadastrado",
      `O veículo placa ${placa} foi salvo com sucesso.`,
      "success"
    );
    
    closeVehicleModal();
    loadVehiclesData();
  } catch (err) {
    console.error("Erro ao salvar veículo:", err);
    Toast.show("Erro ao salvar", err.message || "Verifique se as informações estão corretas.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
}

function editVehicle(id) {
  const vehicle = appState.vehicles.find(v => v.id === id);
  if (vehicle) {
    openVehicleModal(vehicle);
  }
}

async function deleteVehicle(id) {
  const vehicle = appState.vehicles.find(v => v.id === id);
  if (!vehicle) return;
  
  const confirmDelete = confirm(`Deseja realmente excluir o veículo com placa ${vehicle.placa}?`);
  if (!confirmDelete) return;
  
  try {
    const { error } = await supabaseClient
      .from("veiculos")
      .update({ status: 'inativo' })
      .eq("id", id);
      
    if (error) throw error;
    
    Toast.show("Veículo Removido", `O veículo com placa ${vehicle.placa} foi removido com sucesso.`, "success");
    loadVehiclesData();
  } catch (err) {
    console.error("Erro ao deletar veículo:", err);
    Toast.show("Erro ao excluir", err.message || "Tente novamente mais tarde.", "error");
  }
}

// ==========================================
// COOPERADOS CRUD SYSTEM FUNCTIONS
// ==========================================

async function loadCooperadosData() {
  els.crudCooperadosTbody.innerHTML = `
    <tr>
      <td colspan="3" style="text-align: center; padding: 2rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        Carregando cooperados...
      </td>
    </tr>
  `;
  
  try {
    const { data, error } = await supabaseClient
      .from("cooperado")
      .select("*")
      .order("nome");
      
    if (error) throw error;
    
    // Filter out inactive cooperados (soft deleted)
    appState.cooperados = (data || []).filter(c => c.status !== 'inativo');
    renderCooperadosTable();
  } catch (err) {
    console.error("Erro ao carregar cooperados:", err);
    Toast.show("Erro ao carregar cooperados", err.message || "Tente novamente mais tarde.", "error");
    els.crudCooperadosTbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao obter lista de cooperados.
        </td>
      </tr>
    `;
  }
}

function renderCooperadosTable() {
  els.crudCooperadosTbody.innerHTML = "";
  
  const search = appState.cooperadosSearch.toLowerCase();
  
  const filtered = appState.cooperados.filter(c => {
    const nameMatch = c.nome && c.nome.toLowerCase().includes(search);
    
    // Check if search term matches any contact ID
    let contactsMatch = false;
    if (c.idContatos && Array.isArray(c.idContatos)) {
      contactsMatch = c.idContatos.some(contact => contact && contact.toLowerCase().includes(search));
    }
    
    return !search || nameMatch || contactsMatch;
  });
  
  if (filtered.length === 0) {
    els.crudCooperadosTbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-muted);">
          Nenhum cooperado cadastrado ou correspondente à busca.
        </td>
      </tr>
    `;
    return;
  }
  
  filtered.forEach(c => {
    const row = document.createElement("tr");
    
    // Nome
    const tdNome = document.createElement("td");
    tdNome.textContent = c.nome || "Sem Nome";
    tdNome.style.fontWeight = "600";
    row.appendChild(tdNome);
    
    // Contatos (idContatos)
    const tdContatos = document.createElement("td");
    const tagsWrapper = document.createElement("div");
    tagsWrapper.className = "contact-tags-list";
    
    const contacts = c.idContatos || [];
    if (contacts.length === 0) {
      tagsWrapper.innerHTML = '<span style="color:var(--text-muted); opacity:0.4;">Nenhum contato</span>';
    } else {
      contacts.forEach(contact => {
        const span = document.createElement("span");
        span.className = "contact-tag";
        span.innerHTML = `<i data-lucide="hash" style="width:10px;height:10px;"></i> ${contact}`;
        tagsWrapper.appendChild(span);
      });
    }
    tdContatos.appendChild(tagsWrapper);
    row.appendChild(tdContatos);
    
    // Ações
    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "center";
    
    const divActions = document.createElement("div");
    divActions.className = "crud-action-buttons";
    divActions.style.justifyContent = "center";
    
    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-sm btn-secondary";
    btnEdit.innerHTML = `<i data-lucide="edit" style="width:12px;height:12px;"></i>`;
    btnEdit.title = "Editar";
    btnEdit.addEventListener("click", () => editCooperado(c.id));
    
    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-sm btn-danger";
    btnDel.innerHTML = `<i data-lucide="trash-2" style="width:12px;height:12px;"></i>`;
    btnDel.title = "Excluir";
    btnDel.addEventListener("click", () => deleteCooperado(c.id));
    
    divActions.appendChild(btnEdit);
    divActions.appendChild(btnDel);
    tdActions.appendChild(divActions);
    row.appendChild(tdActions);
    
    els.crudCooperadosTbody.appendChild(row);
  });
  
  lucide.createIcons();
}

function openCooperadoModal(cooperado = null) {
  els.cooperadoForm.reset();
  els.cooperadoId.value = "";
  appState.cooperadoFormContacts = [];
  
  if (cooperado) {
    els.cooperadoModalTitle.textContent = "Editar Cooperado";
    els.cooperadoId.value = cooperado.id;
    els.cooperadoNome.value = cooperado.nome || "";
    
    if (cooperado.idContatos && Array.isArray(cooperado.idContatos)) {
      appState.cooperadoFormContacts = [...cooperado.idContatos];
    }
  } else {
    els.cooperadoModalTitle.textContent = "Novo Cooperado";
  }
  
  renderFormContactTags();
  els.cooperadoModalBackdrop.classList.add("show");
}

function closeCooperadoModal() {
  els.cooperadoModalBackdrop.classList.remove("show");
  els.cooperadoForm.reset();
  els.cooperadoId.value = "";
  appState.cooperadoFormContacts = [];
}

function addContactTag() {
  const inputVal = els.cooperadoContactInput.value.trim();
  if (!inputVal) return;
  
  // Clean special characters: allow only alphanumeric
  const cleaned = inputVal.replace(/[^A-Za-z0-9]/g, "");
  
  if (!cleaned) {
    Toast.show("Formato inválido", "Apenas caracteres alfanuméricos são permitidos para contatos.", "warning");
    return;
  }
  
  // Check duplicate
  if (appState.cooperadoFormContacts.includes(cleaned)) {
    Toast.show("Contato Duplicado", "Este ID de contato já foi adicionado.", "warning");
    return;
  }
  
  appState.cooperadoFormContacts.push(cleaned);
  renderFormContactTags();
  
  els.cooperadoContactInput.value = "";
  els.cooperadoContactInput.focus();
}

function renderFormContactTags() {
  els.cooperadoContactsTagsContainer.innerHTML = "";
  
  if (appState.cooperadoFormContacts.length === 0) {
    els.cooperadoContactsTagsContainer.innerHTML = '<span style="color:var(--text-muted);font-size:0.75rem;opacity:0.6;padding:4px;">Nenhum contato adicionado ainda.</span>';
    return;
  }
  
  appState.cooperadoFormContacts.forEach(tag => {
    const span = document.createElement("span");
    span.className = "tag-badge";
    span.innerHTML = `
      <span>${tag}</span>
      <button type="button" class="btn-remove-tag" data-tag="${tag}">
        <i data-lucide="x" style="width:10px;height:10px;"></i>
      </button>
    `;
    
    // Remove button listener
    span.querySelector(".btn-remove-tag").addEventListener("click", () => {
      appState.cooperadoFormContacts = appState.cooperadoFormContacts.filter(t => t !== tag);
      renderFormContactTags();
    });
    
    els.cooperadoContactsTagsContainer.appendChild(span);
  });
  
  lucide.createIcons();
}

async function handleCooperadoFormSubmit(e) {
  e.preventDefault();
  
  const id = els.cooperadoId.value;
  const nome = els.cooperadoNome.value.trim();
  const idContatos = appState.cooperadoFormContacts;
  
  if (!nome) {
    Toast.show("Campos Vazios", "O nome do cooperado é obrigatório.", "warning");
    return;
  }
  
  const saveBtn = document.getElementById("btn-save-cooperado");
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="spinner"></div><span>Salvando...</span>`;
  
  const payload = {
    nome,
    idContatos,
    status: 'ativo'
  };
  
  try {
    if (id) {
      // Update
      const { error } = await supabaseClient
        .from("cooperado")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    } else {
      // Insert
      const { error } = await supabaseClient
        .from("cooperado")
        .insert([payload]);
      if (error) throw error;
    }
    
    Toast.show(
      id ? "Cooperado Atualizado" : "Cooperado Cadastrado",
      `O cooperado ${nome} foi salvo com sucesso.`,
      "success"
    );
    
    closeCooperadoModal();
    loadCooperadosData();
    // Refresh vehicle dropdown values in memory
    loadAdminAuxiliaryData();
  } catch (err) {
    console.error("Erro ao salvar cooperado:", err);
    Toast.show("Erro ao salvar", err.message || "Verifique as informações digitadas.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
}

function editCooperado(id) {
  const cooperado = appState.cooperados.find(c => c.id === id);
  if (cooperado) {
    openCooperadoModal(cooperado);
  }
}

async function deleteCooperado(id) {
  const cooperado = appState.cooperados.find(c => c.id === id);
  if (!cooperado) return;
  
  const confirmDelete = confirm(`Deseja realmente inativar o cooperado ${cooperado.nome}?`);
  if (!confirmDelete) return;
  
  try {
    const { error } = await supabaseClient
      .from("cooperado")
      .update({ status: 'inativo' })
      .eq("id", id);
      
    if (error) throw error;
    
    Toast.show("Cooperado Inativado", `O cooperado ${cooperado.nome} foi inativado com sucesso.`, "success");
    loadCooperadosData();
    // Refresh vehicle dropdown values in memory
    loadAdminAuxiliaryData();
  } catch (err) {
    console.error("Erro ao inativar cooperado:", err);
    Toast.show("Erro ao inativar", err.message || "Tente novamente mais tarde.", "error");
  }
}


