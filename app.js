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
  // Vehicles CRUD state
  vehicles: [],
  vehiclesSearch: "",
  vehiclesTypeFilter: "all",
  vehiclesFrotaFilter: "all",
  vehiclesSort: "created_at_desc",
  vehiclesPage: 0,
  vehiclesPageSize: 30,
  vehiclesTotalCount: 0,
  vehiclesTotalPages: 0,
  vehiclesStats: { total: 0, frota: 0, terceiro: 0, tipos: 0 },

  // Cooperados CRUD state
  cooperados: [],
  cooperadosCrudList: [],
  cooperadosSearch: "",
  cooperadosStatusFilter: "ativo",
  cooperadosContactsFilter: "all",
  cooperadosSort: "nome_asc",
  cooperadoFormContacts: [],
  cooperadosPage: 0,
  cooperadosPageSize: 30,
  cooperadosTotalCount: 0,
  cooperadosTotalPages: 0,
  cooperadosStats: { total: 0, active: 0, inactive: 0, withContacts: 0 },

  veiculosTiposActive: [],

  // Access Control (id_digisac) CRUD state
  accessList: [],
  accessSearch: "",
  accessStatusFilter: "all",
  accessApprovedFilter: "all",
  accessSort: "created_at_desc",
  accessPage: 0,
  accessPageSize: 30,
  accessTotalCount: 0,
  accessTotalPages: 0,
  accessStats: { total: 0, aprovados: 0, pendentes: 0, ativos: 0 },

  // Link Cooperados modal state
  linkingDigisacItem: null,
  stagedCooperadosIds: []
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
  navBtnMovements: document.getElementById("nav-btn-movements"),
  navBtnVehicles: document.getElementById("nav-btn-vehicles"),
  navBtnCooperados: document.getElementById("nav-btn-cooperados"),
  vehiclesCrudSection: document.getElementById("vehicles-crud-section"),
  cooperadosCrudSection: document.getElementById("cooperados-crud-section"),
  movementsTimelineSection: document.getElementById("movements-timeline-section"),
  btnRefreshMovements: document.getElementById("btn-refresh-movements"),
  movementsTimelineContainer: document.getElementById("movements-timeline-container"),
  movementQueueFilter: document.getElementById("movement-queue-filter"),
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
  btnCancelCooperado: document.getElementById("btn-cancel-cooperado"),

  // Vehicles pagination and toolbar elements
  btnRefreshVehicles: document.getElementById("btn-refresh-vehicles"),
  statVehiclesTotal: document.getElementById("stat-vehicles-total"),
  statVehiclesFrota: document.getElementById("stat-vehicles-frota"),
  statVehiclesTerceiro: document.getElementById("stat-vehicles-terceiro"),
  statVehiclesTipos: document.getElementById("stat-vehicles-tipos"),
  crudVehiclesTypeFilter: document.getElementById("crud-vehicles-type-filter"),
  crudVehiclesFrotaFilter: document.getElementById("crud-vehicles-frota-filter"),
  crudVehiclesSortSelect: document.getElementById("crud-vehicles-sort-select"),
  crudVehiclesPagesizeSelect: document.getElementById("crud-vehicles-pagesize-select"),
  btnResetVehiclesFilters: document.getElementById("btn-reset-vehicles-filters"),
  vehiclesPaginationInfo: document.getElementById("vehicles-pagination-info"),
  btnFirstVehiclesPage: document.getElementById("btn-first-vehicles-page"),
  btnPrevVehiclesPage: document.getElementById("btn-prev-vehicles-page"),
  btnNextVehiclesPage: document.getElementById("btn-next-vehicles-page"),
  btnLastVehiclesPage: document.getElementById("btn-last-vehicles-page"),

  // Cooperados pagination and toolbar elements
  btnRefreshCooperados: document.getElementById("btn-refresh-cooperados"),
  statCoopTotal: document.getElementById("stat-coop-total"),
  statCoopActive: document.getElementById("stat-coop-active"),
  statCoopInactive: document.getElementById("stat-coop-inactive"),
  statCoopWithContacts: document.getElementById("stat-coop-with-contacts"),
  crudCooperadosStatusFilter: document.getElementById("crud-cooperados-status-filter"),
  crudCooperadosContactsFilter: document.getElementById("crud-cooperados-contacts-filter"),
  crudCooperadosSortSelect: document.getElementById("crud-cooperados-sort-select"),
  crudCooperadosPagesizeSelect: document.getElementById("crud-cooperados-pagesize-select"),
  btnResetCooperadosFilters: document.getElementById("btn-reset-cooperados-filters"),
  cooperadosPaginationInfo: document.getElementById("cooperados-pagination-info"),
  btnFirstCooperadosPage: document.getElementById("btn-first-cooperados-page"),
  btnPrevCooperadosPage: document.getElementById("btn-prev-cooperados-page"),
  btnNextCooperadosPage: document.getElementById("btn-next-cooperados-page"),
  btnLastCooperadosPage: document.getElementById("btn-last-cooperados-page"),

  // Searchable select elements
  vehicleCooperadoSearch: document.getElementById("vehicle-cooperado-search"),
  vehicleCooperadoDropdown: document.getElementById("vehicle-cooperado-dropdown"),

  // Access Control (id_digisac) elements
  navBtnAccess: document.getElementById("nav-btn-access"),
  accessCrudSection: document.getElementById("access-crud-section"),
  btnRefreshAccess: document.getElementById("btn-refresh-access"),
  btnNewAccess: document.getElementById("btn-new-access"),
  statAccessTotal: document.getElementById("stat-access-total"),
  statAccessApproved: document.getElementById("stat-access-approved"),
  statAccessPending: document.getElementById("stat-access-pending"),
  statAccessActive: document.getElementById("stat-access-active"),
  crudAccessSearchInput: document.getElementById("crud-access-search-input"),
  accessStatusFilter: document.getElementById("access-status-filter"),
  accessApprovedFilter: document.getElementById("access-approved-filter"),
  accessSortSelect: document.getElementById("access-sort-select"),
  accessPagesizeSelect: document.getElementById("access-pagesize-select"),
  btnResetAccessFilters: document.getElementById("btn-reset-access-filters"),
  crudAccessTbody: document.getElementById("crud-access-tbody"),
  accessPaginationInfo: document.getElementById("access-pagination-info"),
  btnFirstAccessPage: document.getElementById("btn-first-access-page"),
  btnPrevAccessPage: document.getElementById("btn-prev-access-page"),
  btnNextAccessPage: document.getElementById("btn-next-access-page"),
  btnLastAccessPage: document.getElementById("btn-last-access-page"),
  accessModalBackdrop: document.getElementById("access-modal-backdrop"),
  accessModalTitle: document.getElementById("access-modal-title"),
  accessModalClose: document.getElementById("access-modal-close"),
  accessForm: document.getElementById("access-form"),
  accessEditMode: document.getElementById("access-edit-mode"),
  accessId: document.getElementById("access-id"),
  accessIdHint: document.getElementById("access-id-hint"),
  btnGenerateUuid: document.getElementById("btn-generate-uuid"),
  accessNome: document.getElementById("access-nome"),
  accessNumero: document.getElementById("access-numero"),
  accessStatus: document.getElementById("access-status"),
  accessAprovado: document.getElementById("access-aprovado"),
  btnCancelAccess: document.getElementById("btn-cancel-access"),
  btnSaveAccess: document.getElementById("btn-save-access"),

  // Link Cooperados Modal Elements
  linkCooperadosModalBackdrop: document.getElementById("link-cooperados-modal-backdrop"),
  linkCooperadosModalClose: document.getElementById("link-cooperados-modal-close"),
  linkCooperadosContactInfo: document.getElementById("link-cooperados-contact-info"),
  linkCooperadoSearchInput: document.getElementById("link-cooperado-search-input"),
  linkCooperadoSelectedId: document.getElementById("link-cooperado-selected-id"),
  linkCooperadoDropdown: document.getElementById("link-cooperado-dropdown"),
  btnAddCooperadoLink: document.getElementById("btn-add-cooperado-link"),
  linkCooperadosCountBadge: document.getElementById("link-cooperados-count-badge"),
  linkCooperadosListContainer: document.getElementById("link-cooperados-list-container"),
  btnClearAllCooperadoLinks: document.getElementById("btn-clear-all-cooperado-links"),
  btnCancelLinkCooperados: document.getElementById("btn-cancel-link-cooperados"),
  btnSaveLinkCooperados: document.getElementById("btn-save-link-cooperados")
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

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
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
      els.navBtnVehicles.classList.remove("hidden");
      els.navBtnCooperados.classList.remove("hidden");
      els.navBtnAccess.classList.remove("hidden");
      loadAdminAuxiliaryData();
    } else {
      appState.isAdmin = false;
      document.querySelector(".user-role").textContent = "Operador";
      els.sidebarAdminNav.classList.remove("hidden");
      els.navBtnVehicles.classList.add("hidden");
      els.navBtnCooperados.classList.add("hidden");
      els.navBtnAccess.classList.add("hidden");
      switchView("queues");
    }
  } catch (err) {
    console.error("Erro ao verificar papel do usuario:", err);
    appState.isAdmin = false;
    document.querySelector(".user-role").textContent = "Operador";
    els.sidebarAdminNav.classList.remove("hidden");
    els.navBtnVehicles.classList.add("hidden");
    els.navBtnCooperados.classList.add("hidden");
    els.navBtnAccess.classList.add("hidden");
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
  appState.accessList = [];

  stopAutoRefresh();
  els.authSection.classList.remove("hidden");
  els.dashboardSection.classList.add("hidden");

  // Reset navigation states
  els.navBtnQueues.classList.add("active");
  els.navBtnMovements.classList.remove("active");
  els.navBtnVehicles.classList.remove("active");
  els.navBtnCooperados.classList.remove("active");
  els.navBtnAccess.classList.remove("active");
  els.vehiclesCrudSection.classList.add("hidden");
  els.cooperadosCrudSection.classList.add("hidden");
  els.accessCrudSection.classList.add("hidden");
  els.movementsTimelineSection.classList.add("hidden");
  els.queuesViewport.classList.remove("hidden");
  const controlBar = document.querySelector(".control-bar");
  if (controlBar) controlBar.classList.remove("hidden");

  // Clear sensitive UI elements
  els.queuesViewport.innerHTML = "";
  els.crudVehiclesTbody.innerHTML = "";
  els.crudCooperadosTbody.innerHTML = "";
  els.crudAccessTbody.innerHTML = "";
  els.loginEmail.value = "";
  els.loginPass.value = "";
}

// THEME HANDLING
function setupTheme() {
  const savedTheme = localStorage.getItem("cfc_theme") || "light";
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
  els.navBtnMovements.addEventListener("click", () => switchView("movements"));
  els.navBtnVehicles.addEventListener("click", () => switchView("vehicles"));
  els.navBtnCooperados.addEventListener("click", () => switchView("cooperados"));
  els.btnRefreshMovements.addEventListener("click", () => loadMovementsData());
  els.movementQueueFilter.addEventListener("change", () => loadMovementsData());

  // Vehicle Modal Open/Close
  els.btnNewVehicle.addEventListener("click", () => openVehicleModal());
  els.vehicleModalClose.addEventListener("click", closeVehicleModal);
  els.btnCancelVehicle.addEventListener("click", closeVehicleModal);
  els.vehicleModalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.vehicleModalBackdrop) closeVehicleModal();
  });

  // Vehicle Form Submit
  els.vehicleForm.addEventListener("submit", handleVehicleFormSubmit);

  // Vehicle Refresh & Filters
  if (els.btnRefreshVehicles) els.btnRefreshVehicles.addEventListener("click", () => loadVehiclesData(true));
  if (els.crudVehiclesTypeFilter) {
    els.crudVehiclesTypeFilter.addEventListener("change", (e) => {
      appState.vehiclesTypeFilter = e.target.value;
      appState.vehiclesPage = 0;
      loadVehiclesData();
    });
  }
  if (els.crudVehiclesFrotaFilter) {
    els.crudVehiclesFrotaFilter.addEventListener("change", (e) => {
      appState.vehiclesFrotaFilter = e.target.value;
      appState.vehiclesPage = 0;
      loadVehiclesData();
    });
  }
  if (els.crudVehiclesSortSelect) {
    els.crudVehiclesSortSelect.addEventListener("change", (e) => {
      appState.vehiclesSort = e.target.value;
      appState.vehiclesPage = 0;
      loadVehiclesData();
    });
  }
  if (els.crudVehiclesPagesizeSelect) {
    els.crudVehiclesPagesizeSelect.addEventListener("change", (e) => {
      appState.vehiclesPageSize = parseInt(e.target.value, 10) || 30;
      appState.vehiclesPage = 0;
      loadVehiclesData();
    });
  }
  if (els.btnResetVehiclesFilters) els.btnResetVehiclesFilters.addEventListener("click", resetVehiclesFilters);

  // Vehicle Search Input (Database-level with Debounce)
  els.crudSearchInput.addEventListener("input", debounce((e) => {
    appState.vehiclesSearch = e.target.value.trim();
    appState.vehiclesPage = 0;
    loadVehiclesData();
  }, 300));

  // Vehicles 4-Button Pagination Event Listeners
  if (els.btnFirstVehiclesPage) els.btnFirstVehiclesPage.addEventListener("click", () => navigateVehiclesPage("first"));
  els.btnPrevVehiclesPage.addEventListener("click", () => navigateVehiclesPage(-1));
  els.btnNextVehiclesPage.addEventListener("click", () => navigateVehiclesPage(1));
  if (els.btnLastVehiclesPage) els.btnLastVehiclesPage.addEventListener("click", () => navigateVehiclesPage("last"));

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

  // Cooperado Refresh & Filters
  if (els.btnRefreshCooperados) els.btnRefreshCooperados.addEventListener("click", () => loadCooperadosData(true));
  if (els.crudCooperadosStatusFilter) {
    els.crudCooperadosStatusFilter.addEventListener("change", (e) => {
      appState.cooperadosStatusFilter = e.target.value;
      appState.cooperadosPage = 0;
      loadCooperadosData();
    });
  }
  if (els.crudCooperadosContactsFilter) {
    els.crudCooperadosContactsFilter.addEventListener("change", (e) => {
      appState.cooperadosContactsFilter = e.target.value;
      appState.cooperadosPage = 0;
      loadCooperadosData();
    });
  }
  if (els.crudCooperadosSortSelect) {
    els.crudCooperadosSortSelect.addEventListener("change", (e) => {
      appState.cooperadosSort = e.target.value;
      appState.cooperadosPage = 0;
      loadCooperadosData();
    });
  }
  if (els.crudCooperadosPagesizeSelect) {
    els.crudCooperadosPagesizeSelect.addEventListener("change", (e) => {
      appState.cooperadosPageSize = parseInt(e.target.value, 10) || 30;
      appState.cooperadosPage = 0;
      loadCooperadosData();
    });
  }
  if (els.btnResetCooperadosFilters) els.btnResetCooperadosFilters.addEventListener("click", resetCooperadosFilters);

  // Cooperado Search Input (Database-level with Debounce)
  els.crudCooperadosSearchInput.addEventListener("input", debounce((e) => {
    appState.cooperadosSearch = e.target.value.trim();
    appState.cooperadosPage = 0;
    loadCooperadosData();
  }, 300));

  // Cooperados 4-Button Pagination Event Listeners
  if (els.btnFirstCooperadosPage) els.btnFirstCooperadosPage.addEventListener("click", () => navigateCooperadosPage("first"));
  els.btnPrevCooperadosPage.addEventListener("click", () => navigateCooperadosPage(-1));
  els.btnNextCooperadosPage.addEventListener("click", () => navigateCooperadosPage(1));
  if (els.btnLastCooperadosPage) els.btnLastCooperadosPage.addEventListener("click", () => navigateCooperadosPage("last"));

  // Searchable Select (Combobox) Event Listeners
  els.vehicleCooperadoSearch.addEventListener("input", filterCooperadosDropdown);
  els.vehicleCooperadoSearch.addEventListener("focus", showCooperadosDropdown);
  document.addEventListener("click", handleSearchableSelectClickOutside);

  // Access Control Navigation & CRUD
  els.navBtnAccess.addEventListener("click", () => switchView("access"));
  els.btnRefreshAccess.addEventListener("click", () => loadAccessData(true));
  els.btnNewAccess.addEventListener("click", () => openAccessModal());
  els.accessModalClose.addEventListener("click", closeAccessModal);
  els.btnCancelAccess.addEventListener("click", closeAccessModal);
  els.accessModalBackdrop.addEventListener("click", (e) => {
    if (e.target === els.accessModalBackdrop) closeAccessModal();
  });
  els.btnGenerateUuid.addEventListener("click", () => {
    els.accessId.value = crypto.randomUUID();
    els.accessId.focus();
  });
  els.accessForm.addEventListener("submit", handleAccessFormSubmit);

  // Access Search Input (Database-level with Debounce)
  els.crudAccessSearchInput.addEventListener("input", debounce((e) => {
    appState.accessSearch = e.target.value.trim();
    appState.accessPage = 0;
    loadAccessData();
  }, 300));

  // Access Filter Event Listeners
  els.accessStatusFilter.addEventListener("change", (e) => {
    appState.accessStatusFilter = e.target.value;
    appState.accessPage = 0;
    loadAccessData();
  });

  els.accessApprovedFilter.addEventListener("change", (e) => {
    appState.accessApprovedFilter = e.target.value;
    appState.accessPage = 0;
    loadAccessData();
  });

  els.accessSortSelect.addEventListener("change", (e) => {
    appState.accessSort = e.target.value;
    appState.accessPage = 0;
    loadAccessData();
  });

  els.accessPagesizeSelect.addEventListener("change", (e) => {
    appState.accessPageSize = parseInt(e.target.value, 10) || 30;
    appState.accessPage = 0;
    loadAccessData();
  });

  els.btnResetAccessFilters.addEventListener("click", resetAccessFilters);

  // Access Pagination Event Listeners
  els.btnFirstAccessPage.addEventListener("click", () => navigateAccessPage("first"));
  els.btnPrevAccessPage.addEventListener("click", () => navigateAccessPage(-1));
  els.btnNextAccessPage.addEventListener("click", () => navigateAccessPage(1));
  els.btnLastAccessPage.addEventListener("click", () => navigateAccessPage("last"));

  // Link Cooperados Modal Event Listeners
  if (els.linkCooperadosModalClose) els.linkCooperadosModalClose.addEventListener("click", closeLinkCooperadosModal);
  if (els.btnCancelLinkCooperados) els.btnCancelLinkCooperados.addEventListener("click", closeLinkCooperadosModal);
  if (els.linkCooperadosModalBackdrop) {
    els.linkCooperadosModalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.linkCooperadosModalBackdrop) closeLinkCooperadosModal();
    });
  }
  if (els.btnAddCooperadoLink) els.btnAddCooperadoLink.addEventListener("click", addSelectedCooperadoToStage);
  if (els.btnClearAllCooperadoLinks) els.btnClearAllCooperadoLinks.addEventListener("click", clearAllCooperadoLinks);
  if (els.btnSaveLinkCooperados) els.btnSaveLinkCooperados.addEventListener("click", handleSaveCooperadosLinks);
  if (els.linkCooperadoSearchInput) {
    els.linkCooperadoSearchInput.addEventListener("input", filterLinkCooperadosDropdown);
    els.linkCooperadoSearchInput.addEventListener("focus", showLinkCooperadosDropdown);
    els.linkCooperadoSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSelectedCooperadoToStage();
      }
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeVehicleModal();
      closeCooperadoModal();
      closeAccessModal();
      closeLinkCooperadosModal();
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
  if ((view === "vehicles" || view === "cooperados" || view === "access") && !appState.isAdmin) {
    Toast.show("Acesso Negado", "Apenas administradores possuem este acesso.", "error");
    return;
  }

  appState.currentView = view;
  const controlBar = document.querySelector(".control-bar");

  // Reset all views to hidden
  els.queuesViewport.classList.add("hidden");
  els.vehiclesCrudSection.classList.add("hidden");
  els.cooperadosCrudSection.classList.add("hidden");
  els.accessCrudSection.classList.add("hidden");
  els.movementsTimelineSection.classList.add("hidden");
  if (controlBar) controlBar.classList.add("hidden");

  // Reset active navigation styles
  els.navBtnQueues.classList.remove("active");
  els.navBtnMovements.classList.remove("active");
  els.navBtnVehicles.classList.remove("active");
  els.navBtnCooperados.classList.remove("active");
  els.navBtnAccess.classList.remove("active");

  if (view === "vehicles") {
    els.vehiclesCrudSection.classList.remove("hidden");
    els.navBtnVehicles.classList.add("active");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadVehiclesData(true);
  } else if (view === "cooperados") {
    els.cooperadosCrudSection.classList.remove("hidden");
    els.navBtnCooperados.classList.add("active");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadCooperadosData(true);
  } else if (view === "access") {
    els.accessCrudSection.classList.remove("hidden");
    els.navBtnAccess.classList.add("active");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadAccessData(true);
  } else if (view === "movements") {
    els.movementsTimelineSection.classList.remove("hidden");
    els.navBtnMovements.classList.add("active");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadMovementsData();
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
  // Vehicle types modal dropdown
  els.vehicleTipo.innerHTML = '<option value="">Selecione um Tipo...</option>';
  // Filter vehicle type dropdown
  if (els.crudVehiclesTypeFilter) {
    els.crudVehiclesTypeFilter.innerHTML = '<option value="all">Todos os Tipos</option>';
  }
  appState.veiculosTiposActive.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type.nome;
    opt.textContent = type.nome;
    els.vehicleTipo.appendChild(opt);

    if (els.crudVehiclesTypeFilter) {
      const filterOpt = document.createElement("option");
      filterOpt.value = type.nome;
      filterOpt.textContent = type.nome;
      els.crudVehiclesTypeFilter.appendChild(filterOpt);
    }
  });
}

function getCooperadoName(cooperadoId) {
  if (!cooperadoId) return "Não associado";
  const coop = appState.cooperados.find(c => c.id === cooperadoId);
  return coop ? coop.nome : "Carregando...";
}

async function loadVehiclesData(fetchStats = false) {
  els.crudVehiclesTbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 2.5rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        <span style="color: var(--text-muted); font-size: 0.85rem;">Carregando veículos...</span>
      </td>
    </tr>
  `;

  const page = appState.vehiclesPage;
  const limit = appState.vehiclesPageSize || 30;
  const from = page * limit;
  const to = from + limit - 1;
  const search = appState.vehiclesSearch;
  const typeFilter = appState.vehiclesTypeFilter;
  const frotaFilter = appState.vehiclesFrotaFilter;
  const sort = appState.vehiclesSort;

  try {
    let query = supabaseClient
      .from("veiculos")
      .select("*", { count: "exact" })
      .or("status.is.null,status.neq.inativo");

    // Search filter
    if (search) {
      // Find matching cooperados to search by owner name (limit to 20 to avoid large URL query string)
      const { data: coops } = await supabaseClient
        .from("cooperado")
        .select("id")
        .ilike("nome", `%${search}%`)
        .limit(20);
      
      const coopIds = coops && coops.length > 0 ? coops.map(c => c.id) : [];

      if (coopIds.length > 0) {
        const idsList = coopIds.map(id => `cooperado.eq.${id}`).join(",");
        query = query.or(`placa.ilike.%${search}%,placa2.ilike.%${search}%,placa3.ilike.%${search}%,${idsList}`);
      } else {
        query = query.or(`placa.ilike.%${search}%,placa2.ilike.%${search}%,placa3.ilike.%${search}%`);
      }
    }

    // Vehicle Type filter
    if (typeFilter && typeFilter !== "all") {
      query = query.eq("tipo", typeFilter);
    }

    // Frota / Terceiro filter
    if (frotaFilter === "true") {
      query = query.eq("frota", true);
    } else if (frotaFilter === "false") {
      query = query.eq("frota", false);
    }

    // Sorting
    switch (sort) {
      case "created_at_asc":
        query = query.order("created_at", { ascending: true, nullsFirst: false });
        break;
      case "placa_asc":
        query = query.order("placa", { ascending: true, nullsFirst: false });
        break;
      case "placa_desc":
        query = query.order("placa", { ascending: false, nullsFirst: false });
        break;
      case "created_at_desc":
      default:
        query = query.order("created_at", { ascending: false, nullsFirst: false });
        break;
    }

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    appState.vehicles = data || [];
    appState.vehiclesTotalCount = count || 0;
    appState.vehiclesTotalPages = Math.ceil((count || 0) / limit) || 1;

    updateVehiclesPaginationUI();
    renderVehiclesTable();

    if (fetchStats) {
      loadVehiclesStats();
    }
  } catch (err) {
    console.error("Erro ao carregar veículos:", err);
    Toast.show("Erro ao carregar veículos", err.message || "Tente novamente mais tarde.", "error");
    els.crudVehiclesTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao obter lista de veículos: ${err.message || "Erro desconhecido"}
        </td>
      </tr>
    `;
  }
}

function renderVehiclesTable() {
  els.crudVehiclesTbody.innerHTML = "";

  const filtered = appState.vehicles;

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

async function openVehicleModal(vehicle = null) {
  // Ensure aux data is loaded
  if (appState.cooperados.length === 0 || appState.veiculosTiposActive.length === 0) {
    await loadAdminAuxiliaryData();
  } else {
    populateModalDropdowns();
  }

  els.vehicleForm.reset();
  els.vehicleId.value = "";
  els.vehicleCooperadoSearch.value = "";
  els.vehicleCooperado.value = "";
  comboboxState.selectedId = "";
  comboboxState.selectedName = "";

  if (vehicle) {
    els.vehicleModalTitle.textContent = "Editar Veículo";
    els.vehicleId.value = vehicle.id;
    els.vehiclePlaca.value = vehicle.placa || "";
    els.vehiclePlaca2.value = vehicle.placa2 || "";
    els.vehiclePlaca3.value = vehicle.placa3 || "";

    els.vehicleTipo.value = vehicle.tipo || "";
    els.vehicleFrota.value = String(vehicle.frota);

    // Set searchable select values
    const coopName = getCooperadoName(vehicle.cooperado);
    if (vehicle.cooperado && coopName !== "Carregando...") {
      selectCooperadoCombobox(vehicle.cooperado, coopName);
    }
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
    if (!id) {
      // Check if vehicle with this plate already exists
      const { data: existingVehicles, error: checkError } = await supabaseClient
        .from("veiculos")
        .select("*")
        .eq("placa", placa);

      if (checkError) throw checkError;

      if (existingVehicles && existingVehicles.length > 0) {
        const inactiveVehicle = existingVehicles.find(v => v.status === 'inativo');
        const activeVehicle = existingVehicles.find(v => v.status !== 'inativo');

        if (activeVehicle) {
          Toast.show(
            "Placa já cadastrada",
            `O veículo com a placa ${placa} já está cadastrado e ativo.`,
            "warning"
          );
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalHtml;
          return;
        }

        if (inactiveVehicle) {
          const confirmReactivate = confirm(
            `O veículo com a placa ${placa} já existe cadastrado e está inativado. Deseja reativá-lo com estes dados?`
          );
          if (confirmReactivate) {
            // Update the existing inactive vehicle instead of inserting a new one
            const { error: updateError } = await supabaseClient
              .from("veiculos")
              .update(payload)
              .eq("id", inactiveVehicle.id);

            if (updateError) throw updateError;

            Toast.show(
              "Veículo Reativado",
              `O veículo placa ${placa} foi reativado com sucesso.`,
              "success"
            );

            closeVehicleModal();
            loadVehiclesData(true);
            return;
          } else {
            // User chose not to reactivate, cancel save operation
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalHtml;
            return;
          }
        }
      }
    }

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
    loadVehiclesData(true);
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
    loadVehiclesData(true);
  } catch (err) {
    console.error("Erro ao deletar veículo:", err);
    Toast.show("Erro ao excluir", err.message || "Tente novamente mais tarde.", "error");
  }
}

// ==========================================
// COOPERADOS CRUD SYSTEM FUNCTIONS
// ==========================================

async function loadCooperadosData(fetchStats = false) {
  els.crudCooperadosTbody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center; padding: 2.5rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        <span style="color: var(--text-muted); font-size: 0.85rem;">Carregando cooperados...</span>
      </td>
    </tr>
  `;

  const page = appState.cooperadosPage;
  const limit = appState.cooperadosPageSize || 30;
  const from = page * limit;
  const to = from + limit - 1;
  const search = appState.cooperadosSearch;
  const statusFilter = appState.cooperadosStatusFilter;
  const contactsFilter = appState.cooperadosContactsFilter;
  const sort = appState.cooperadosSort;

  try {
    let query = supabaseClient
      .from("cooperado")
      .select("*", { count: "exact" });

    // Status filter
    if (statusFilter === "ativo") {
      query = query.or("status.is.null,status.neq.inativo");
    } else if (statusFilter === "inativo") {
      query = query.eq("status", "inativo");
    }

    // Search filter
    if (search) {
      const cleanSearch = search.replace(/[^A-Za-z0-9]/g, "");
      if (cleanSearch && cleanSearch.length >= 3) {
        query = query.or(`nome.ilike.%${search}%,idContatos.cs.{"${cleanSearch}"}`);
      } else {
        query = query.ilike("nome", `%${search}%`);
      }
    }

    // Contacts filter
    if (contactsFilter === "with_contacts") {
      query = query.not("idContatos", "is", null).neq("idContatos", "{}");
    } else if (contactsFilter === "without_contacts") {
      query = query.or("idContatos.is.null,idContatos.eq.{}");
    }

    // Sorting
    switch (sort) {
      case "nome_desc":
        query = query.order("nome", { ascending: false, nullsFirst: false });
        break;
      case "created_at_desc":
        query = query.order("created_at", { ascending: false, nullsFirst: false });
        break;
      case "nome_asc":
      default:
        query = query.order("nome", { ascending: true, nullsFirst: false });
        break;
    }

    const { data, count, error } = await query.range(from, to);
    if (error) {
      // Fallback to name search if array query failed
      if (search) {
        let fallbackQuery = supabaseClient
          .from("cooperado")
          .select("*", { count: "exact" })
          .ilike("nome", `%${search}%`);

        if (statusFilter === "ativo") fallbackQuery = fallbackQuery.or("status.is.null,status.neq.inativo");
        else if (statusFilter === "inativo") fallbackQuery = fallbackQuery.eq("status", "inativo");

        fallbackQuery = fallbackQuery.order("nome", { ascending: sort !== "nome_desc" });
        const retryResult = await fallbackQuery.range(from, to);
        if (retryResult.error) throw retryResult.error;

        appState.cooperadosCrudList = retryResult.data || [];
        appState.cooperadosTotalCount = retryResult.count || 0;
        appState.cooperadosTotalPages = Math.ceil((retryResult.count || 0) / limit) || 1;
        updateCooperadosPaginationUI();
        renderCooperadosTable();
        if (fetchStats) loadCooperadosStats();
        return;
      }
      throw error;
    }

    appState.cooperadosCrudList = data || [];
    appState.cooperadosTotalCount = count || 0;
    appState.cooperadosTotalPages = Math.ceil((count || 0) / limit) || 1;

    updateCooperadosPaginationUI();
    renderCooperadosTable();

    if (fetchStats) {
      loadCooperadosStats();
    }
  } catch (err) {
    console.error("Erro ao carregar cooperados:", err);
    Toast.show("Erro ao carregar cooperados", err.message || "Tente novamente mais tarde.", "error");
    els.crudCooperadosTbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao obter lista de cooperados: ${err.message || "Erro desconhecido"}
        </td>
      </tr>
    `;
  }
}

function renderCooperadosTable() {
  els.crudCooperadosTbody.innerHTML = "";

  const filtered = appState.cooperadosCrudList;

  if (filtered.length === 0) {
    els.crudCooperadosTbody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Nenhum cooperado cadastrado ou correspondente aos filtros.
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

    // Status (Interactive toggle)
    const tdStatus = document.createElement("td");
    tdStatus.style.textAlign = "center";
    const statusBadge = document.createElement("span");
    const isStatusActive = (c.status !== "inativo");
    statusBadge.className = `badge-status ${isStatusActive ? "active" : "inactive"}`;
    statusBadge.title = isStatusActive ? "Clique para inativar cooperado" : "Clique para ativar cooperado";
    statusBadge.innerHTML = `
      <span class="badge-dot"></span>
      <span>${isStatusActive ? "Ativo" : "Inativo"}</span>
    `;
    statusBadge.addEventListener("click", () => toggleCooperadoStatus(c.id, isStatusActive, c.nome));
    tdStatus.appendChild(statusBadge);
    row.appendChild(tdStatus);

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
    btnDel.title = isStatusActive ? "Inativar" : "Excluir";
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
    loadCooperadosData(true);
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
  const cooperado = appState.cooperadosCrudList.find(c => c.id === id);
  if (cooperado) {
    openCooperadoModal(cooperado);
  }
}

async function deleteCooperado(id) {
  const cooperado = appState.cooperadosCrudList.find(c => c.id === id);
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
    loadCooperadosData(true);
    // Refresh vehicle dropdown values in memory
    loadAdminAuxiliaryData();
  } catch (err) {
    console.error("Erro ao inativar cooperado:", err);
    Toast.show("Erro ao inativar", err.message || "Tente novamente mais tarde.", "error");
  }
}

// ==========================================
// ACCESS CONTROL (ID_DIGISAC) FUNCTIONS
// ==========================================

async function loadAccessData(fetchStats = false) {
  els.crudAccessTbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 2.5rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        <span style="color: var(--text-muted); font-size: 0.85rem;">Carregando registros do Digisac...</span>
      </td>
    </tr>
  `;

  const page = appState.accessPage;
  const limit = appState.accessPageSize || 30;
  const from = page * limit;
  const to = from + limit - 1;
  const search = appState.accessSearch;
  const statusFilter = appState.accessStatusFilter;
  const approvedFilter = appState.accessApprovedFilter;
  const sort = appState.accessSort;

  try {
    let query = supabaseClient
      .from("id_digisac")
      .select("*", { count: "exact" });

    // Apply Search
    if (search) {
      query = query.or(`nome.ilike.%${search}%,numero.ilike.%${search}%`);
    }

    // Apply Status Filter
    if (statusFilter === "true") {
      query = query.eq("status", true);
    } else if (statusFilter === "false") {
      query = query.eq("status", false);
    }

    // Apply Approved Filter
    if (approvedFilter === "true") {
      query = query.eq("aprovado", true);
    } else if (approvedFilter === "false") {
      query = query.eq("aprovado", false);
    }

    // Apply Sorting
    switch (sort) {
      case "created_at_asc":
        query = query.order("created_at", { ascending: true, nullsFirst: false });
        break;
      case "nome_asc":
        query = query.order("nome", { ascending: true, nullsFirst: false });
        break;
      case "nome_desc":
        query = query.order("nome", { ascending: false, nullsFirst: false });
        break;
      case "numero_asc":
        query = query.order("numero", { ascending: true, nullsFirst: false });
        break;
      case "created_at_desc":
      default:
        query = query.order("created_at", { ascending: false, nullsFirst: false });
        break;
    }

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    appState.accessList = data || [];
    appState.accessTotalCount = count || 0;
    appState.accessTotalPages = Math.ceil((count || 0) / limit) || 1;

    updateAccessPaginationUI();
    renderAccessTable();

    if (fetchStats) {
      loadAccessStats();
    }
  } catch (err) {
    console.error("Erro ao carregar registros do Digisac:", err);
    Toast.show("Erro ao carregar registros", err.message || "Tente novamente mais tarde.", "error");
    els.crudAccessTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--danger);">
          Erro ao obter registros da tabela id_digisac: ${err.message || "Erro desconhecido"}
        </td>
      </tr>
    `;
  }
}

async function loadAccessStats() {
  try {
    // Total count
    const { count: total, error: errTotal } = await supabaseClient
      .from("id_digisac")
      .select("*", { count: "exact", head: true });

    // Approved count
    const { count: aprovados, error: errAp } = await supabaseClient
      .from("id_digisac")
      .select("*", { count: "exact", head: true })
      .eq("aprovado", true);

    // Pending/Not approved count
    const { count: pendentes, error: errPend } = await supabaseClient
      .from("id_digisac")
      .select("*", { count: "exact", head: true })
      .eq("aprovado", false);

    // Active count
    const { count: ativos, error: errAtivos } = await supabaseClient
      .from("id_digisac")
      .select("*", { count: "exact", head: true })
      .eq("status", true);

    if (!errTotal && total !== null) els.statAccessTotal.textContent = total.toLocaleString("pt-BR");
    if (!errAp && aprovados !== null) els.statAccessApproved.textContent = aprovados.toLocaleString("pt-BR");
    if (!errPend && pendentes !== null) els.statAccessPending.textContent = pendentes.toLocaleString("pt-BR");
    if (!errAtivos && ativos !== null) els.statAccessActive.textContent = ativos.toLocaleString("pt-BR");
  } catch (e) {
    console.error("Erro ao carregar estatísticas do Digisac:", e);
  }
}

function renderAccessTable() {
  els.crudAccessTbody.innerHTML = "";

  const list = appState.accessList;

  if (list.length === 0) {
    els.crudAccessTbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <div style="font-size: 1.1rem; font-weight: 500; margin-bottom: 6px;">Nenhum registro encontrado</div>
          <div style="font-size: 0.8rem; opacity: 0.7;">Tente ajustar os filtros ou adicione um novo registro clicando em "Novo Acesso".</div>
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(item => {
    const row = document.createElement("tr");

    // Nome (com Avatar de Iniciais)
    const tdNome = document.createElement("td");
    const userCell = document.createElement("div");
    userCell.className = "access-user-cell";

    const avatar = document.createElement("div");
    avatar.className = "access-user-avatar";
    const initials = item.nome
      ? item.nome.trim().split(" ").filter(Boolean).map(n => n[0]).slice(0, 2).join("").toUpperCase()
      : "?";
    avatar.textContent = initials;

    const info = document.createElement("div");
    info.className = "access-user-info";

    const nameSpan = document.createElement("span");
    nameSpan.className = "access-user-name";
    nameSpan.textContent = item.nome || "Não informado";

    const idSpan = document.createElement("span");
    idSpan.className = "access-user-id";
    idSpan.textContent = item.id ? `ID: ${item.id.substring(0, 8)}...` : "";

    info.appendChild(nameSpan);
    if (item.id) info.appendChild(idSpan);

    userCell.appendChild(avatar);
    userCell.appendChild(info);
    tdNome.appendChild(userCell);
    row.appendChild(tdNome);

    // Número
    const tdNumero = document.createElement("td");
    if (item.numero) {
      tdNumero.innerHTML = `
        <span class="contact-number-badge" title="Número / Contato Digisac">
          <i data-lucide="phone" style="width: 12px; height: 12px;"></i>
          <span>${item.numero}</span>
        </span>
      `;
    } else {
      tdNumero.innerHTML = `<span class="contact-empty-badge">Não cadastrado</span>`;
    }
    row.appendChild(tdNumero);

    // Cooperados Vinculados (Coluna & Badge clicável)
    const tdCooperados = document.createElement("td");
    const cooperadosList = Array.isArray(item.cooperados) ? item.cooperados : [];
    const coopCount = cooperadosList.length;

    const btnPill = document.createElement("button");
    btnPill.type = "button";
    btnPill.className = `btn-link-pill ${coopCount > 0 ? "filled" : "empty"}`;
    btnPill.title = coopCount > 0 
      ? `${coopCount} cooperado(s) vinculado(s). Clique para gerenciar vínculos.` 
      : "Nenhum cooperado vinculado. Clique para vincular.";
    
    if (coopCount > 0) {
      btnPill.innerHTML = `
        <i data-lucide="users"></i>
        <span>${coopCount} vinculado${coopCount > 1 ? "s" : ""}</span>
      `;
    } else {
      btnPill.innerHTML = `
        <i data-lucide="user-plus"></i>
        <span>Vincular</span>
      `;
    }
    btnPill.addEventListener("click", () => openLinkCooperadosModal(item.id));
    tdCooperados.appendChild(btnPill);
    row.appendChild(tdCooperados);

    // Status (Interactive toggle)
    const tdStatus = document.createElement("td");
    tdStatus.style.textAlign = "center";
    const statusBadge = document.createElement("span");
    const isStatusActive = (item.status === true);
    statusBadge.className = `badge-status ${isStatusActive ? "active" : "inactive"}`;
    statusBadge.title = isStatusActive ? "Clique para desativar status" : "Clique para ativar status";
    statusBadge.innerHTML = `
      <span class="badge-dot"></span>
      <span>${isStatusActive ? "Ativo" : "Inativo"}</span>
    `;
    statusBadge.addEventListener("click", () => toggleAccessStatus(item.id, isStatusActive, item.nome));
    tdStatus.appendChild(statusBadge);
    row.appendChild(tdStatus);

    // Aprovação (Interactive toggle)
    const tdAprovado = document.createElement("td");
    tdAprovado.style.textAlign = "center";
    const approvedBadge = document.createElement("span");
    const isApproved = (item.aprovado === true);
    approvedBadge.className = `badge-approved ${isApproved ? "approved" : "pending"}`;
    approvedBadge.title = isApproved ? "Clique para revogar aprovação" : "Clique para aprovar";
    approvedBadge.innerHTML = `
      <span class="badge-dot"></span>
      <span>${isApproved ? "Aprovado" : "Pendente"}</span>
    `;
    approvedBadge.addEventListener("click", () => toggleAccessApproved(item.id, isApproved, item.nome));
    tdAprovado.appendChild(approvedBadge);
    row.appendChild(tdAprovado);

    // Data de Cadastro
    const tdData = document.createElement("td");
    if (item.created_at) {
      const dt = new Date(item.created_at);
      const dateStr = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
      const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      tdData.innerHTML = `
        <div class="access-date-cell">
          <span>${dateStr}</span>
          <span class="access-date-time">${timeStr}</span>
        </div>
      `;
    } else {
      tdData.innerHTML = `<span style="color: var(--text-muted); opacity: 0.5;">-</span>`;
    }
    row.appendChild(tdData);

    // Ações
    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "center";

    const divActions = document.createElement("div");
    divActions.className = "crud-action-buttons";
    divActions.style.justifyContent = "center";

    const btnLink = document.createElement("button");
    btnLink.className = "btn btn-sm btn-secondary";
    btnLink.innerHTML = `<i data-lucide="users" style="width:13px;height:13px;"></i>`;
    btnLink.title = "Vincular Cooperados";
    btnLink.addEventListener("click", () => openLinkCooperadosModal(item.id));

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn btn-sm btn-secondary";
    btnEdit.innerHTML = `<i data-lucide="edit" style="width:12px;height:12px;"></i>`;
    btnEdit.title = "Editar Registro";
    btnEdit.addEventListener("click", () => editAccess(item.id));

    const btnDel = document.createElement("button");
    btnDel.className = "btn btn-sm btn-danger";
    btnDel.innerHTML = `<i data-lucide="trash-2" style="width:12px;height:12px;"></i>`;
    btnDel.title = "Excluir Registro";
    btnDel.addEventListener("click", () => deleteAccess(item.id));

    divActions.appendChild(btnLink);
    divActions.appendChild(btnEdit);
    divActions.appendChild(btnDel);
    tdActions.appendChild(divActions);
    row.appendChild(tdActions);

    els.crudAccessTbody.appendChild(row);
  });

  lucide.createIcons();
}

function updateAccessPaginationUI() {
  const page = appState.accessPage;
  const limit = appState.accessPageSize || 30;
  const total = appState.accessTotalCount;
  const totalPages = Math.max(1, appState.accessTotalPages);

  const startRecord = total === 0 ? 0 : page * limit + 1;
  const endRecord = Math.min(total, (page + 1) * limit);

  els.accessPaginationInfo.textContent = `Exibindo ${startRecord}–${endRecord} de ${total.toLocaleString("pt-BR")} registros (Pág. ${page + 1} de ${totalPages})`;

  els.btnFirstAccessPage.disabled = (page === 0);
  els.btnPrevAccessPage.disabled = (page === 0);
  els.btnNextAccessPage.disabled = (page >= totalPages - 1);
  els.btnLastAccessPage.disabled = (page >= totalPages - 1);
}

function navigateAccessPage(direction) {
  const totalPages = appState.accessTotalPages || 1;

  if (direction === "first") {
    appState.accessPage = 0;
  } else if (direction === "last") {
    appState.accessPage = Math.max(0, totalPages - 1);
  } else {
    appState.accessPage += direction;
    if (appState.accessPage < 0) appState.accessPage = 0;
    if (appState.accessPage >= totalPages) appState.accessPage = totalPages - 1;
  }

  loadAccessData();
}

function resetAccessFilters() {
  appState.accessSearch = "";
  appState.accessStatusFilter = "all";
  appState.accessApprovedFilter = "all";
  appState.accessSort = "created_at_desc";
  appState.accessPage = 0;

  els.crudAccessSearchInput.value = "";
  els.accessStatusFilter.value = "all";
  els.accessApprovedFilter.value = "all";
  els.accessSortSelect.value = "created_at_desc";

  loadAccessData(true);
}

function openAccessModal(item = null) {
  els.accessForm.reset();
  els.accessId.value = "";

  if (item) {
    els.accessModalTitle.textContent = "Editar Acesso";
    els.accessEditMode.value = "true";
    els.accessId.value = item.id;
    els.accessId.readOnly = true;
    els.accessId.style.opacity = "0.75";
    els.accessId.style.cursor = "default";
    els.btnGenerateUuid.style.display = "none";
    if (els.accessIdHint) els.accessIdHint.textContent = "Chave primária UUID (somente leitura na edição)";
    els.accessNome.value = item.nome || "";
    els.accessNumero.value = item.numero || "";
    els.accessStatus.value = item.status === true ? "true" : "false";
    els.accessAprovado.value = item.aprovado === true ? "true" : "false";
    els.accessNome.focus();
  } else {
    els.accessModalTitle.textContent = "Novo Acesso";
    els.accessEditMode.value = "false";
    els.accessId.readOnly = false;
    els.accessId.style.opacity = "1";
    els.accessId.style.cursor = "text";
    els.btnGenerateUuid.style.display = "flex";
    if (els.accessIdHint) els.accessIdHint.textContent = 'Insira o código UUID manualmente ou clique em "Gerar UUID"';
    els.accessStatus.value = "true";
    els.accessAprovado.value = "true";
    els.accessId.focus();
  }

  els.accessModalBackdrop.classList.add("show");
}

function closeAccessModal() {
  els.accessModalBackdrop.classList.remove("show");
  els.accessForm.reset();
  els.accessId.value = "";
  els.accessEditMode.value = "false";
}

async function handleAccessFormSubmit(e) {
  e.preventDefault();

  const isEdit = els.accessEditMode.value === "true";
  const id = els.accessId.value.trim().toLowerCase();
  const nome = els.accessNome.value.trim();
  const numero = els.accessNumero.value.trim() || null;
  const status = els.accessStatus.value === "true";
  const aprovado = els.accessAprovado.value === "true";

  // UUID regex validation (8-4-4-4-12 hex format)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id) {
    Toast.show("Campo Obrigatório", "O ID / UUID do contato é obrigatório.", "warning");
    els.accessId.focus();
    return;
  }

  if (!uuidRegex.test(id)) {
    Toast.show("UUID Inválido", "O ID deve estar no formato UUID válido (ex: cbb379d2-be8d-4a55-a4ba-e9546469dd64).", "warning");
    els.accessId.focus();
    return;
  }

  if (!nome) {
    Toast.show("Campo Obrigatório", "O nome é obrigatório.", "warning");
    els.accessNome.focus();
    return;
  }

  const saveBtn = els.btnSaveAccess;
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="spinner"></div><span>Salvando...</span>`;

  try {
    if (isEdit) {
      // Update by ID
      const { error } = await supabaseClient
        .from("id_digisac")
        .update({
          nome,
          numero,
          status,
          aprovado
        })
        .eq("id", id);
      if (error) throw error;
    } else {
      // Insert with explicit manual or generated ID
      const payload = {
        id,
        nome,
        numero,
        status,
        aprovado
      };

      const { error } = await supabaseClient
        .from("id_digisac")
        .insert([payload]);
      if (error) throw error;
    }

    Toast.show(
      isEdit ? "Acesso Atualizado" : "Acesso Cadastrado",
      `O registro de ${nome} foi salvo com sucesso.`,
      "success"
    );

    closeAccessModal();
    loadAccessData(true);
  } catch (err) {
    console.error("Erro ao salvar acesso:", err);
    Toast.show("Erro ao salvar", err.message || "Verifique os dados informados.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
}

function editAccess(id) {
  const item = appState.accessList.find(a => a.id === id);
  if (item) {
    openAccessModal(item);
  }
}

async function deleteAccess(id) {
  const item = appState.accessList.find(a => a.id === id);
  const identifier = item ? (item.nome || item.numero || id) : id;

  const confirmDelete = confirm(`Deseja realmente EXCLUIR permanentemente o registro de "${identifier}"? Esta ação não pode ser desfeita.`);
  if (!confirmDelete) return;

  try {
    const { error } = await supabaseClient
      .from("id_digisac")
      .delete()
      .eq("id", id);

    if (error) throw error;

    Toast.show("Registro Excluído", `O registro "${identifier}" foi excluído com sucesso.`, "success");
    loadAccessData(true);
  } catch (err) {
    console.error("Erro ao excluir registro:", err);
    Toast.show("Erro ao excluir", err.message || "Tente novamente mais tarde.", "error");
  }
}

async function toggleAccessStatus(id, currentStatus, nome) {
  const nextVal = !currentStatus;
  try {
    const { error } = await supabaseClient
      .from("id_digisac")
      .update({ status: nextVal })
      .eq("id", id);

    if (error) throw error;

    Toast.show(
      "Status Alterado",
      `${nome || "Registro"} agora está ${nextVal ? "ATIVO" : "INATIVO"}.`,
      "info"
    );

    // Update in memory and re-render
    const item = appState.accessList.find(a => a.id === id);
    if (item) item.status = nextVal;
    renderAccessTable();
    loadAccessStats();
  } catch (err) {
    console.error("Erro ao alterar status:", err);
    Toast.show("Erro ao alterar status", err.message || "Falha na comunicação com o banco.", "error");
  }
}

async function toggleAccessApproved(id, currentApproved, nome) {
  const nextVal = !currentApproved;
  try {
    const { error } = await supabaseClient
      .from("id_digisac")
      .update({ aprovado: nextVal })
      .eq("id", id);

    if (error) throw error;

    Toast.show(
      "Aprovação Alterada",
      `${nome || "Registro"} agora está ${nextVal ? "APROVADO" : "NÃO APROVADO / PENDENTE"}.`,
      "info"
    );

    // Update in memory and re-render
    const item = appState.accessList.find(a => a.id === id);
    if (item) item.aprovado = nextVal;
    renderAccessTable();
    loadAccessStats();
  } catch (err) {
    console.error("Erro ao alterar aprovação:", err);
    Toast.show("Erro ao alterar aprovação", err.message || "Falha na comunicação com o banco.", "error");
  }
}

// ==========================================
// VÍNCULO DE COOPERADOS MODAL & SYSTEM
// ==========================================

async function openLinkCooperadosModal(digisacId) {
  // Ensure cooperados data is loaded
  if (!appState.cooperados || appState.cooperados.length === 0) {
    await loadAdminAuxiliaryData();
  }

  const item = appState.accessList.find(a => a.id === digisacId);
  if (!item) {
    Toast.show("Registro não encontrado", "Não foi possível carregar os dados deste registro.", "error");
    return;
  }

  appState.linkingDigisacItem = item;
  appState.stagedCooperadosIds = Array.isArray(item.cooperados) ? [...item.cooperados] : [];

  // Update header contact info
  if (els.linkCooperadosContactInfo) {
    const contactText = item.nome || "Sem nome";
    const phoneText = item.numero ? ` (${item.numero})` : "";
    els.linkCooperadosContactInfo.textContent = `Contato: ${contactText}${phoneText}`;
  }

  // Reset search & combobox
  if (els.linkCooperadoSearchInput) els.linkCooperadoSearchInput.value = "";
  if (els.linkCooperadoSelectedId) els.linkCooperadoSelectedId.value = "";
  if (els.btnAddCooperadoLink) els.btnAddCooperadoLink.disabled = true;
  if (els.linkCooperadoDropdown) els.linkCooperadoDropdown.classList.remove("show");

  // Render the current list of staged cooperados
  renderLinkedCooperadosList();

  // Show modal
  if (els.linkCooperadosModalBackdrop) {
    els.linkCooperadosModalBackdrop.classList.add("show");
  }

  if (els.linkCooperadoSearchInput) {
    setTimeout(() => els.linkCooperadoSearchInput.focus(), 150);
  }

  lucide.createIcons();
}

function closeLinkCooperadosModal() {
  if (els.linkCooperadosModalBackdrop) {
    els.linkCooperadosModalBackdrop.classList.remove("show");
  }
  appState.linkingDigisacItem = null;
  appState.stagedCooperadosIds = [];
  if (els.linkCooperadoSearchInput) els.linkCooperadoSearchInput.value = "";
  if (els.linkCooperadoSelectedId) els.linkCooperadoSelectedId.value = "";
  if (els.linkCooperadoDropdown) els.linkCooperadoDropdown.classList.remove("show");
}

function renderLinkedCooperadosList() {
  if (!els.linkCooperadosListContainer) return;
  els.linkCooperadosListContainer.innerHTML = "";

  const ids = appState.stagedCooperadosIds || [];
  const count = ids.length;

  if (els.linkCooperadosCountBadge) {
    els.linkCooperadosCountBadge.textContent = `${count} selecionado${count === 1 ? "" : "s"}`;
    els.linkCooperadosCountBadge.className = `badge-status ${count > 0 ? "active" : "inactive"}`;
  }

  if (count === 0) {
    els.linkCooperadosListContainer.innerHTML = `
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-muted); background: rgba(0,0,0,0.1); border-radius: 8px; border: 1px dashed var(--border-color);">
        <i data-lucide="users" style="width: 24px; height: 24px; opacity: 0.4; margin: 0 auto 6px auto; display: block;"></i>
        <span style="font-size: 0.85rem; font-weight: 500;">Nenhum cooperado vinculado</span>
        <span style="display: block; font-size: 0.75rem; opacity: 0.7; margin-top: 2px;">Pesquise um cooperado no campo acima e clique em Adicionar</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  ids.forEach(coopId => {
    const coop = appState.cooperados.find(c => c.id === coopId);
    const coopNome = coop ? coop.nome : `Cooperado (${coopId.substring(0, 8)}...)`;
    const coopStatus = coop ? (coop.status || "ativo") : "desconhecido";

    const itemEl = document.createElement("div");
    itemEl.className = "linked-cooperado-item";

    itemEl.innerHTML = `
      <div class="linked-coop-left">
        <div class="linked-coop-avatar">
          <i data-lucide="user"></i>
        </div>
        <div style="min-width: 0;">
          <div class="linked-coop-name" title="${coopNome}">${coopNome}</div>
          <div style="display: flex; gap: 6px; align-items: center; margin-top: 2px;">
            <span class="linked-coop-status ${coopStatus === 'ativo' ? 'ativo' : 'inativo'}">
              ${coopStatus === 'ativo' ? 'Ativo' : 'Inativo'}
            </span>
            <span style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">ID: ${coopId.substring(0, 8)}...</span>
          </div>
        </div>
      </div>
      <button type="button" class="btn-remove-link" title="Remover este vínculo">
        <i data-lucide="x" style="width: 14px; height: 14px;"></i>
        <span>Remover</span>
      </button>
    `;

    const btnRemove = itemEl.querySelector(".btn-remove-link");
    btnRemove.addEventListener("click", () => {
      removeCooperadoFromStage(coopId);
    });

    els.linkCooperadosListContainer.appendChild(itemEl);
  });

  lucide.createIcons();
}

function filterLinkCooperadosDropdown() {
  if (!els.linkCooperadoSearchInput || !els.linkCooperadoDropdown) return;
  const query = els.linkCooperadoSearchInput.value.trim().toLowerCase();

  // Cooperados not yet in stagedCooperadosIds
  const staged = new Set(appState.stagedCooperadosIds || []);
  const available = (appState.cooperados || []).filter(c => !staged.has(c.id));

  const filtered = query
    ? available.filter(c => c.nome && c.nome.toLowerCase().includes(query))
    : available;

  renderLinkCooperadosDropdown(filtered);
}

function renderLinkCooperadosDropdown(list) {
  if (!els.linkCooperadoDropdown) return;
  els.linkCooperadoDropdown.innerHTML = "";

  if (list.length === 0) {
    els.linkCooperadoDropdown.innerHTML = `<div class="searchable-select-item no-results">Nenhum cooperado disponível</div>`;
    els.linkCooperadoDropdown.classList.add("show");
    return;
  }

  // Render up to 40 items
  list.slice(0, 40).forEach(c => {
    const div = document.createElement("div");
    div.className = "searchable-select-item";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "space-between";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = c.nome;

    const statusBadge = document.createElement("span");
    statusBadge.className = `linked-coop-status ${c.status === 'ativo' ? 'ativo' : 'inativo'}`;
    statusBadge.textContent = c.status === 'ativo' ? 'Ativo' : 'Inativo';

    div.appendChild(nameSpan);
    div.appendChild(statusBadge);

    div.addEventListener("click", () => {
      selectCooperadoForLink(c.id, c.nome);
    });

    els.linkCooperadoDropdown.appendChild(div);
  });

  els.linkCooperadoDropdown.classList.add("show");
}

function showLinkCooperadosDropdown() {
  filterLinkCooperadosDropdown();
}

function hideLinkCooperadosDropdown() {
  if (els.linkCooperadoDropdown) els.linkCooperadoDropdown.classList.remove("show");
}

function selectCooperadoForLink(id, nome) {
  if (els.linkCooperadoSearchInput) els.linkCooperadoSearchInput.value = nome;
  if (els.linkCooperadoSelectedId) els.linkCooperadoSelectedId.value = id;
  if (els.btnAddCooperadoLink) els.btnAddCooperadoLink.disabled = false;
  hideLinkCooperadosDropdown();
}

function addSelectedCooperadoToStage() {
  let coopId = els.linkCooperadoSelectedId ? els.linkCooperadoSelectedId.value : "";
  const query = els.linkCooperadoSearchInput ? els.linkCooperadoSearchInput.value.trim().toLowerCase() : "";

  // If no ID selected but input typed, try exact or best match
  if (!coopId && query) {
    const staged = new Set(appState.stagedCooperadosIds || []);
    const available = (appState.cooperados || []).filter(c => !staged.has(c.id));
    const match = available.find(c => c.nome && c.nome.toLowerCase() === query) ||
                  available.find(c => c.nome && c.nome.toLowerCase().includes(query));
    if (match) {
      coopId = match.id;
    }
  }

  if (!coopId) {
    Toast.show("Selecione um cooperado", "Escolha um cooperado da lista para adicionar.", "warning");
    return;
  }

  if (appState.stagedCooperadosIds.includes(coopId)) {
    Toast.show("Já vinculado", "Este cooperado já está presente na lista.", "info");
    return;
  }

  appState.stagedCooperadosIds.push(coopId);

  // Clear inputs
  if (els.linkCooperadoSearchInput) els.linkCooperadoSearchInput.value = "";
  if (els.linkCooperadoSelectedId) els.linkCooperadoSelectedId.value = "";
  if (els.btnAddCooperadoLink) els.btnAddCooperadoLink.disabled = true;
  hideLinkCooperadosDropdown();

  renderLinkedCooperadosList();

  const coopObj = appState.cooperados.find(c => c.id === coopId);
  Toast.show("Cooperado Adicionado", `${coopObj ? coopObj.nome : "Cooperado"} foi incluído na lista temporária. Clique em Salvar para gravar.`, "info");
}

function removeCooperadoFromStage(coopId) {
  appState.stagedCooperadosIds = appState.stagedCooperadosIds.filter(id => id !== coopId);
  renderLinkedCooperadosList();
}

function clearAllCooperadoLinks() {
  if (!appState.stagedCooperadosIds || appState.stagedCooperadosIds.length === 0) return;
  const confirmClear = confirm("Deseja realmente desvincular todos os cooperados deste contato?");
  if (!confirmClear) return;

  appState.stagedCooperadosIds = [];
  renderLinkedCooperadosList();
  Toast.show("Lista Limpa", "Todos os cooperados foram desvinculados da lista temporária. Clique em Salvar para gravar.", "info");
}

async function handleSaveCooperadosLinks() {
  if (!appState.linkingDigisacItem) return;

  const targetId = appState.linkingDigisacItem.id;
  const contactName = appState.linkingDigisacItem.nome || "Contato";
  const updatedList = [...appState.stagedCooperadosIds];

  const saveBtn = els.btnSaveLinkCooperados;
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = `<div class="spinner"></div><span>Salvando...</span>`;

  try {
    const payloadValue = updatedList.length > 0 ? updatedList : null;

    const { error } = await supabaseClient
      .from("id_digisac")
      .update({ cooperados: payloadValue })
      .eq("id", targetId);

    if (error) throw error;

    // Update in local memory
    appState.linkingDigisacItem.cooperados = payloadValue;
    const accessItem = appState.accessList.find(a => a.id === targetId);
    if (accessItem) accessItem.cooperados = payloadValue;

    Toast.show(
      "Vínculos Salvos",
      `Os vínculos de cooperados para "${contactName}" foram atualizados com sucesso (${updatedList.length} vinculados).`,
      "success"
    );

    closeLinkCooperadosModal();
    renderAccessTable();
  } catch (err) {
    console.error("Erro ao salvar vínculos de cooperados:", err);
    Toast.show("Erro ao salvar vínculos", err.message || "Falha na comunicação com o banco.", "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = originalHtml;
  }
}

// ==========================================
// PAGINATION & STATS HELPERS (VEHICLES & COOPERADOS)
// ==========================================

async function loadVehiclesStats() {
  try {
    const { count: total } = await supabaseClient
      .from("veiculos")
      .select("*", { count: "exact", head: true })
      .or("status.is.null,status.neq.inativo");

    const { count: frota } = await supabaseClient
      .from("veiculos")
      .select("*", { count: "exact", head: true })
      .or("status.is.null,status.neq.inativo")
      .eq("frota", true);

    const { count: terceiro } = await supabaseClient
      .from("veiculos")
      .select("*", { count: "exact", head: true })
      .or("status.is.null,status.neq.inativo")
      .eq("frota", false);

    const tipos = appState.veiculosTiposActive.length;

    if (els.statVehiclesTotal && total !== null) els.statVehiclesTotal.textContent = total.toLocaleString("pt-BR");
    if (els.statVehiclesFrota && frota !== null) els.statVehiclesFrota.textContent = frota.toLocaleString("pt-BR");
    if (els.statVehiclesTerceiro && terceiro !== null) els.statVehiclesTerceiro.textContent = terceiro.toLocaleString("pt-BR");
    if (els.statVehiclesTipos) els.statVehiclesTipos.textContent = tipos.toString();
  } catch (e) {
    console.error("Erro ao carregar estatísticas de veículos:", e);
  }
}

function updateVehiclesPaginationUI() {
  const page = appState.vehiclesPage;
  const limit = appState.vehiclesPageSize || 30;
  const total = appState.vehiclesTotalCount;
  const totalPages = Math.max(1, appState.vehiclesTotalPages);

  const startRecord = total === 0 ? 0 : page * limit + 1;
  const endRecord = Math.min(total, (page + 1) * limit);

  els.vehiclesPaginationInfo.textContent = `Exibindo ${startRecord}–${endRecord} de ${total.toLocaleString("pt-BR")} veículos (Pág. ${page + 1} de ${totalPages})`;

  if (els.btnFirstVehiclesPage) els.btnFirstVehiclesPage.disabled = (page === 0);
  els.btnPrevVehiclesPage.disabled = (page === 0);
  els.btnNextVehiclesPage.disabled = (page >= totalPages - 1);
  if (els.btnLastVehiclesPage) els.btnLastVehiclesPage.disabled = (page >= totalPages - 1);
}

function navigateVehiclesPage(direction) {
  const totalPages = appState.vehiclesTotalPages || 1;

  if (direction === "first") {
    appState.vehiclesPage = 0;
  } else if (direction === "last") {
    appState.vehiclesPage = Math.max(0, totalPages - 1);
  } else {
    appState.vehiclesPage += direction;
    if (appState.vehiclesPage < 0) appState.vehiclesPage = 0;
    if (appState.vehiclesPage >= totalPages) appState.vehiclesPage = totalPages - 1;
  }

  loadVehiclesData();
}

function resetVehiclesFilters() {
  appState.vehiclesSearch = "";
  appState.vehiclesTypeFilter = "all";
  appState.vehiclesFrotaFilter = "all";
  appState.vehiclesSort = "created_at_desc";
  appState.vehiclesPage = 0;

  els.crudSearchInput.value = "";
  if (els.crudVehiclesTypeFilter) els.crudVehiclesTypeFilter.value = "all";
  if (els.crudVehiclesFrotaFilter) els.crudVehiclesFrotaFilter.value = "all";
  if (els.crudVehiclesSortSelect) els.crudVehiclesSortSelect.value = "created_at_desc";

  loadVehiclesData(true);
}

async function loadCooperadosStats() {
  try {
    const { count: total } = await supabaseClient
      .from("cooperado")
      .select("*", { count: "exact", head: true });

    const { count: active } = await supabaseClient
      .from("cooperado")
      .select("*", { count: "exact", head: true })
      .or("status.is.null,status.neq.inativo");

    const { count: inactive } = await supabaseClient
      .from("cooperado")
      .select("*", { count: "exact", head: true })
      .eq("status", "inativo");

    const { count: withContacts } = await supabaseClient
      .from("cooperado")
      .select("*", { count: "exact", head: true })
      .not("idContatos", "is", null)
      .neq("idContatos", "{}");

    if (els.statCoopTotal && total !== null) els.statCoopTotal.textContent = total.toLocaleString("pt-BR");
    if (els.statCoopActive && active !== null) els.statCoopActive.textContent = active.toLocaleString("pt-BR");
    if (els.statCoopInactive && inactive !== null) els.statCoopInactive.textContent = inactive.toLocaleString("pt-BR");
    if (els.statCoopWithContacts && withContacts !== null) els.statCoopWithContacts.textContent = withContacts.toLocaleString("pt-BR");
  } catch (e) {
    console.error("Erro ao carregar estatísticas de cooperados:", e);
  }
}

function updateCooperadosPaginationUI() {
  const page = appState.cooperadosPage;
  const limit = appState.cooperadosPageSize || 30;
  const total = appState.cooperadosTotalCount;
  const totalPages = Math.max(1, appState.cooperadosTotalPages);

  const startRecord = total === 0 ? 0 : page * limit + 1;
  const endRecord = Math.min(total, (page + 1) * limit);

  els.cooperadosPaginationInfo.textContent = `Exibindo ${startRecord}–${endRecord} de ${total.toLocaleString("pt-BR")} cooperados (Pág. ${page + 1} de ${totalPages})`;

  if (els.btnFirstCooperadosPage) els.btnFirstCooperadosPage.disabled = (page === 0);
  els.btnPrevCooperadosPage.disabled = (page === 0);
  els.btnNextCooperadosPage.disabled = (page >= totalPages - 1);
  if (els.btnLastCooperadosPage) els.btnLastCooperadosPage.disabled = (page >= totalPages - 1);
}

function navigateCooperadosPage(direction) {
  const totalPages = appState.cooperadosTotalPages || 1;

  if (direction === "first") {
    appState.cooperadosPage = 0;
  } else if (direction === "last") {
    appState.cooperadosPage = Math.max(0, totalPages - 1);
  } else {
    appState.cooperadosPage += direction;
    if (appState.cooperadosPage < 0) appState.cooperadosPage = 0;
    if (appState.cooperadosPage >= totalPages) appState.cooperadosPage = totalPages - 1;
  }

  loadCooperadosData();
}

function resetCooperadosFilters() {
  appState.cooperadosSearch = "";
  appState.cooperadosStatusFilter = "ativo";
  appState.cooperadosContactsFilter = "all";
  appState.cooperadosSort = "nome_asc";
  appState.cooperadosPage = 0;

  els.crudCooperadosSearchInput.value = "";
  if (els.crudCooperadosStatusFilter) els.crudCooperadosStatusFilter.value = "ativo";
  if (els.crudCooperadosContactsFilter) els.crudCooperadosContactsFilter.value = "all";
  if (els.crudCooperadosSortSelect) els.crudCooperadosSortSelect.value = "nome_asc";

  loadCooperadosData(true);
}

async function toggleCooperadoStatus(id, currentActive, nome) {
  const nextVal = currentActive ? "inativo" : "ativo";
  try {
    const { error } = await supabaseClient
      .from("cooperado")
      .update({ status: nextVal })
      .eq("id", id);

    if (error) throw error;

    Toast.show(
      "Status Alterado",
      `${nome || "Cooperado"} agora está ${nextVal.toUpperCase()}.`,
      "info"
    );

    const coop = appState.cooperadosCrudList.find(c => c.id === id);
    if (coop) coop.status = nextVal;
    renderCooperadosTable();
    loadCooperadosStats();
    loadAdminAuxiliaryData();
  } catch (err) {
    console.error("Erro ao alterar status do cooperado:", err);
    Toast.show("Erro ao alterar status", err.message || "Falha na comunicação com o banco.", "error");
  }
}

// ==========================================
// SEARCHABLE SELECT (COMBOBOX) HELPERS
// ==========================================

let comboboxState = {
  selectedId: "",
  selectedName: ""
};

function filterCooperadosDropdown() {
  const query = els.vehicleCooperadoSearch.value.trim().toLowerCase();

  // Show dropdown
  els.vehicleCooperadoDropdown.classList.add("show");

  // Filter active cooperados in appState.cooperados
  const activeCoops = appState.cooperados.filter(c => c.status !== 'inativo');

  const filtered = activeCoops.filter(c => {
    return c.nome && c.nome.toLowerCase().includes(query);
  });

  renderCooperadosDropdown(filtered);
}

function renderCooperadosDropdown(list) {
  els.vehicleCooperadoDropdown.innerHTML = "";

  if (list.length === 0) {
    els.vehicleCooperadoDropdown.innerHTML = `<div class="searchable-select-item no-results">Nenhum cooperado encontrado</div>`;
    return;
  }

  // Render up to 50 items for performance
  list.slice(0, 50).forEach(c => {
    const div = document.createElement("div");
    div.className = "searchable-select-item";
    div.textContent = c.nome;
    div.addEventListener("click", () => {
      selectCooperadoCombobox(c.id, c.nome);
    });
    els.vehicleCooperadoDropdown.appendChild(div);
  });
}

function selectCooperadoCombobox(id, name) {
  comboboxState.selectedId = id;
  comboboxState.selectedName = name;

  els.vehicleCooperadoSearch.value = name;
  els.vehicleCooperado.value = id;

  hideCooperadosDropdown();
}

function showCooperadosDropdown() {
  els.vehicleCooperadoDropdown.classList.add("show");
  filterCooperadosDropdown();
}

function hideCooperadosDropdown() {
  els.vehicleCooperadoDropdown.classList.remove("show");
}

function handleSearchableSelectClickOutside(e) {
  // Vehicle Cooperado Combobox
  const vehicleWrapper = els.vehicleCooperadoSearch ? els.vehicleCooperadoSearch.closest(".searchable-select-wrapper") : null;
  if (vehicleWrapper && !vehicleWrapper.contains(e.target)) {
    hideCooperadosDropdown();

    if (!els.vehicleCooperadoSearch.value.trim()) {
      els.vehicleCooperado.value = "";
      comboboxState.selectedId = "";
      comboboxState.selectedName = "";
    } else if (comboboxState.selectedName) {
      els.vehicleCooperadoSearch.value = comboboxState.selectedName;
      els.vehicleCooperado.value = comboboxState.selectedId;
    } else {
      els.vehicleCooperadoSearch.value = "";
      els.vehicleCooperado.value = "";
    }
  }

  // Link Cooperado Combobox
  const linkWrapper = els.linkCooperadoSearchInput ? els.linkCooperadoSearchInput.closest(".searchable-select-wrapper") : null;
  if (linkWrapper && !linkWrapper.contains(e.target)) {
    hideLinkCooperadosDropdown();
  }
}

// ==========================================
// MOVEMENTS TIMELINE FUNCTIONS
// ==========================================

async function loadMovementsData() {
  els.movementsTimelineContainer.innerHTML = `
    <div style="text-align: center; padding: 3rem;">
      <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
      <div>Carregando histórico de movimentações...</div>
    </div>
  `;

  const selectedQueue = els.movementQueueFilter ? els.movementQueueFilter.value : "";

  try {
    // Dynamically check if column is named 'none' or 'nome'
    let columnName = "none";
    const { error: testNoneError } = await supabaseClient
      .from("vw_last_movimentos")
      .select("none")
      .limit(1);

    if (testNoneError) {
      columnName = "nome";
    }

    // Fetch unique queues from recent history independent of current filter
    const { data: recentMovementsForFilter, error: filterFetchError } = await supabaseClient
      .from("vw_last_movimentos")
      .select(columnName)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!filterFetchError && recentMovementsForFilter) {
      populateMovementQueueFilter(recentMovementsForFilter, columnName);
    }

    let query = supabaseClient
      .from("vw_last_movimentos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (selectedQueue) {
      query = query.eq(columnName, selectedQueue);
    }

    const { data, error } = await query;

    if (error) throw error;

    renderMovementsTimeline(data || []);
  } catch (err) {
    console.error("Erro ao obter dados de movimentações:", err);
    Toast.show("Erro ao carregar", err.message || "Tente novamente mais tarde.", "error");
    els.movementsTimelineContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--danger);">
        <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 10px; display: inline-block;"></i>
        <div>Erro ao carregar movimentações do banco de dados.</div>
      </div>
    `;
    lucide.createIcons();
  }
}

function renderMovementsTimeline(data) {
  const container = els.movementsTimelineContainer;
  container.innerHTML = "";

  if (data.length === 0) {
    container.innerHTML = `
      <div class="empty-queue" style="width: 100%; height: 250px;">
        <i data-lucide="history"></i>
        <div class="empty-queue-text">Nenhuma movimentação registrada recentemente.</div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const timeline = document.createElement("div");
  timeline.className = "timeline-container";

  data.forEach(item => {
    const isProgramado = item.tipo === "programado";
    const typeClass = isProgramado ? "programado" : "retirada";
    const badgeIcon = isProgramado ? "calendar" : "truck";
    const actionLabel = isProgramado ? "Programado" : "Retirada";
    const locationName = item.none || item.nome || "Fila não identificada";

    const itemEl = document.createElement("div");
    itemEl.className = "timeline-item";

    itemEl.innerHTML = `
      <div class="timeline-badge ${typeClass}">
        <i data-lucide="${badgeIcon}"></i>
      </div>
      <div class="timeline-content">
        <div class="timeline-header">
          <div class="timeline-title-area">
            <span class="timeline-action ${typeClass}">${actionLabel}</span>
            ${renderPlateBadge(item.placa)}
          </div>
          <span class="timeline-date">${formatDateTime(item.created_at)}</span>
        </div>
        <div class="timeline-body">
          ${item.motivo || "Movimentação registrada"}
        </div>
        <div class="timeline-details">
          <div class="timeline-detail-item">
            <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
            <span>${locationName}</span>
          </div>
          ${item.carga ? `
            <div class="timeline-detail-item">
              <i data-lucide="package" style="width: 12px; height: 12px;"></i>
              <span>Carga: ${item.carga}</span>
            </div>
          ` : ""}
          ${item.idRef ? `
            <div class="timeline-detail-item">
              <i data-lucide="hash" style="width: 12px; height: 12px;"></i>
              <span>ID Ref: ${item.idRef}</span>
            </div>
          ` : ""}
        </div>
      </div>
    `;
    timeline.appendChild(itemEl);
  });

  container.appendChild(timeline);
  lucide.createIcons();
}

function populateMovementQueueFilter(movementsData, columnName) {
  if (!els.movementQueueFilter || !movementsData) return;

  // Extract unique queue names from the actual recent movements data
  const queueNames = new Set();
  movementsData.forEach(item => {
    const loc = item[columnName];
    if (loc) queueNames.add(loc);
  });

  const sortedQueues = Array.from(queueNames).sort();
  const currentVal = els.movementQueueFilter.value;

  els.movementQueueFilter.innerHTML = '<option value="">Filtrar por Fila (Todas)</option>';
  sortedQueues.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    els.movementQueueFilter.appendChild(opt);
  });

  if (sortedQueues.includes(currentVal)) {
    els.movementQueueFilter.value = currentVal;
  }
}



