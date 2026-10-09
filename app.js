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
  profiles: [],
  profilesSearch: "",
  profilesRoleFilter: "all",
  profilesLinkFilter: "all",
  theme: "dark",
  sidebarCollapsed: false,
  autoRefresh: {
    active: true,
    intervalId: null,
    countdown: 180,
    maxSeconds: 180
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
  stagedCooperadosIds: [],

  // Ticket Florestal (xcvt_comprovantes) state
  tickets: [],
  ticketsSearch: "",
  ticketsStatusFilter: "pending",
  ticketsPeriodFilter: "30",
  ticketsRegiaoFilter: "all",
  ticketsSort: "created_at_desc",
  ticketsPage: 0,
  ticketsPageSize: 30,
  ticketsTotalCount: 0,
  ticketsTotalPages: 0,
  ticketsStats: { total: 0, pending: 0, approved: 0, totalPesoLiq: 0 },
  activeViewingTicket: null
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

  // Location / Tracker Modal
  locationModalBackdrop: document.getElementById("location-modal-backdrop"),
  locationModalTitle: document.getElementById("location-modal-title"),
  locationModalSubtitle: document.getElementById("location-modal-subtitle"),
  locationModalBody: document.getElementById("location-modal-body"),
  locationModalClose: document.getElementById("location-modal-close"),

  // Admin and CRUD elements
  sidebarAdminNav: document.getElementById("sidebar-admin-nav"),
  menuCategoryFila: document.getElementById("menu-category-fila"),
  menuCategoryAdmin: document.getElementById("menu-category-admin"),
  menuCategoryComprovantes: document.getElementById("menu-category-comprovantes"),
  navBtnQueues: document.getElementById("nav-btn-queues"),
  navBtnTicketFlorestal: document.getElementById("nav-btn-ticket-florestal"),
  ticketFlorestalSection: document.getElementById("ticket-florestal-section"),
  btnRefreshTicketFlorestal: document.getElementById("btn-refresh-ticket-florestal"),
  navBtnMovements: document.getElementById("nav-btn-movements"),
  navBtnVehicles: document.getElementById("nav-btn-vehicles-admin"),
  navBtnVehiclesAdmin: document.getElementById("nav-btn-vehicles-admin"),
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
  cooperadoCodigo: document.getElementById("cooperado-codigo"),
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
  btnSyncAccess: document.getElementById("btn-sync-access"),
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
  accessEmpresa: document.getElementById("access-empresa"),
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
  btnSaveLinkCooperados: document.getElementById("btn-save-link-cooperados"),

  // Profiles Management Elements
  navBtnProfiles: document.getElementById("nav-btn-profiles"),
  profilesCrudSection: document.getElementById("profiles-crud-section"),
  btnRefreshProfiles: document.getElementById("btn-refresh-profiles"),
  statProfilesTotal: document.getElementById("stat-profiles-total"),
  statProfilesAdmins: document.getElementById("stat-profiles-admins"),
  statProfilesLinked: document.getElementById("stat-profiles-linked"),
  statProfilesUnlinked: document.getElementById("stat-profiles-unlinked"),
  crudProfilesSearchInput: document.getElementById("crud-profiles-search-input"),
  crudProfilesRoleFilter: document.getElementById("crud-profiles-role-filter"),
  crudProfilesLinkFilter: document.getElementById("crud-profiles-link-filter"),
  btnResetProfilesFilters: document.getElementById("btn-reset-profiles-filters"),
  crudProfilesTbody: document.getElementById("crud-profiles-tbody"),
  profileModalBackdrop: document.getElementById("profile-modal-backdrop"),
  profileModalTitle: document.getElementById("profile-modal-title"),
  profileModalClose: document.getElementById("profile-modal-close"),
  profileForm: document.getElementById("profile-form"),
  profileEditId: document.getElementById("profile-edit-id"),
  profileEditEmail: document.getElementById("profile-edit-email"),
  profileEditRole: document.getElementById("profile-edit-role"),
  profileEditUuid: document.getElementById("profile-edit-uuid"),
  profileEditIdContato: document.getElementById("profile-edit-id-contato"),
  btnCancelProfile: document.getElementById("btn-cancel-profile"),
  btnSaveProfile: document.getElementById("btn-save-profile"),

  // Ticket Florestal elements
  btnRefreshTickets: document.getElementById("btn-refresh-tickets"),
  crudTicketsTbody: document.getElementById("crud-tickets-tbody"),
  statTicketsTotal: document.getElementById("stat-tickets-total"),
  statTicketsPending: document.getElementById("stat-tickets-pending"),
  statTicketsApproved: document.getElementById("stat-tickets-approved"),
  statTicketsPesoliq: document.getElementById("stat-tickets-pesoliq"),
  ticketsSearchInput: document.getElementById("tickets-search-input"),
  ticketsStatusFilter: document.getElementById("tickets-status-filter"),
  ticketsPeriodFilter: document.getElementById("tickets-period-filter"),
  ticketsRegiaoFilter: document.getElementById("tickets-regiao-filter"),
  ticketsSortSelect: document.getElementById("tickets-sort-select"),
  ticketsPagesizeSelect: document.getElementById("tickets-pagesize-select"),
  btnResetTicketsFilters: document.getElementById("btn-reset-tickets-filters"),
  ticketsPaginationInfo: document.getElementById("tickets-pagination-info"),
  btnFirstTicketsPage: document.getElementById("btn-first-tickets-page"),
  btnPrevTicketsPage: document.getElementById("btn-prev-tickets-page"),
  btnNextTicketsPage: document.getElementById("btn-next-tickets-page"),
  btnLastTicketsPage: document.getElementById("btn-last-tickets-page"),

  // Ticket Modal elements
  ticketModalBackdrop: document.getElementById("ticket-modal-backdrop"),
  ticketModalCard: document.getElementById("ticket-modal-card"),
  ticketModalTitle: document.getElementById("ticket-modal-title"),
  ticketModalSubtitle: document.getElementById("ticket-modal-subtitle"),
  ticketModalClose: document.getElementById("ticket-modal-close"),
  btnToggleTicketImg: document.getElementById("btn-toggle-ticket-img"),
  btnToggleTicketImgText: document.getElementById("btn-toggle-ticket-img-text"),
  ticketImagePanel: document.getElementById("ticket-image-panel"),
  ticketImageViewport: document.getElementById("ticket-image-viewport"),
  ticketZoomableImg: document.getElementById("ticket-zoomable-img"),
  ticketImgLoading: document.getElementById("ticket-img-loading"),
  ticketImgError: document.getElementById("ticket-img-error"),
  ticketZoomBadge: document.getElementById("ticket-zoom-badge"),
  btnTicketZoomIn: document.getElementById("btn-ticket-zoom-in"),
  btnTicketZoomOut: document.getElementById("btn-ticket-zoom-out"),
  btnTicketZoomReset: document.getElementById("btn-ticket-zoom-reset"),
  btnTicketRotate: document.getElementById("btn-ticket-rotate"),
  btnTicketOpenTab: document.getElementById("btn-ticket-open-tab"),
  btnCancelTicket: document.getElementById("btn-cancel-ticket"),
  ticketForm: document.getElementById("ticket-form"),
  ticketEditId: document.getElementById("ticket-edit-id"),
  ticketAiBox: document.getElementById("ticket-ai-box"),
  ticketAiText: document.getElementById("ticket-ai-text"),
  ticketEditPlaca: document.getElementById("ticket-edit-placa"),
  ticketEditProcesso: document.getElementById("ticket-edit-processo"),
  ticketEditData: document.getElementById("ticket-edit-data"),
  ticketEditRegiao: document.getElementById("ticket-edit-regiao"),
  ticketEditTalhao: document.getElementById("ticket-edit-talhao"),
  ticketEditDestino: document.getElementById("ticket-edit-destino"),
  ticketEditPesoliq: document.getElementById("ticket-edit-pesoliq"),
  ticketEditPesobruto: document.getElementById("ticket-edit-pesobruto"),
  ticketEditNf: document.getElementById("ticket-edit-nf"),
  ticketEditOrigem: document.getElementById("ticket-edit-origem"),
  ticketEditFazenda: document.getElementById("ticket-edit-fazenda"),
  ticketEditAprovado: document.getElementById("ticket-edit-aprovado"),
  btnSaveTicket: document.getElementById("btn-save-ticket"),
  btnSaveApproveTicket: document.getElementById("btn-save-approve-ticket"),

  // Ticket AI Message Modal
  ticketAiModalBackdrop: document.getElementById("ticket-ai-modal-backdrop"),
  ticketAiModalClose: document.getElementById("ticket-ai-modal-close"),
  ticketAiModalSubtitle: document.getElementById("ticket-ai-modal-subtitle"),
  ticketAiModalContent: document.getElementById("ticket-ai-modal-content"),
  btnCloseTicketAiModal: document.getElementById("btn-close-ticket-ai-modal"),
  btnEditFromAiModal: document.getElementById("btn-edit-from-ai-modal")
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

function formatDateTimeWithSeconds(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatPlateString(plateString) {
  if (!plateString) return "";
  const cleanedPlate = plateString.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (cleanedPlate.length === 7) {
    return cleanedPlate.substring(0, 3) + "-" + cleanedPlate.substring(3);
  }
  return cleanedPlate;
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
  lucide.createIcons();

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

    // Categoria de Comprovantes acessível para todos os usuários autenticados
    if (els.menuCategoryComprovantes) els.menuCategoryComprovantes.classList.remove("hidden");

    if (profile && profile.role === 'admin') {
      appState.isAdmin = true;
      document.querySelector(".user-role").textContent = "Administrador";
      els.sidebarAdminNav.classList.remove("hidden");
      if (els.menuCategoryAdmin) els.menuCategoryAdmin.classList.remove("hidden");
      loadAdminAuxiliaryData();
    } else {
      appState.isAdmin = false;
      document.querySelector(".user-role").textContent = "Operador";
      els.sidebarAdminNav.classList.remove("hidden");
      if (els.menuCategoryAdmin) els.menuCategoryAdmin.classList.add("hidden");
    }
  } catch (err) {
    console.error("Erro ao verificar papel do usuario:", err);
    appState.isAdmin = false;
    document.querySelector(".user-role").textContent = "Operador";
    els.sidebarAdminNav.classList.remove("hidden");
    if (els.menuCategoryAdmin) els.menuCategoryAdmin.classList.add("hidden");
    if (els.menuCategoryComprovantes) els.menuCategoryComprovantes.classList.remove("hidden");
  }

  // Check if redirected with specific view in sessionStorage
  const gotoView = sessionStorage.getItem("cfc_goto_view");
  if (gotoView && (appState.isAdmin || gotoView === "ticket-florestal")) {
    sessionStorage.removeItem("cfc_goto_view");
    switchView(gotoView);
  } else {
    // Load data
    loadQueuesData(true);
    startAutoRefresh();
  }
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
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  if (els.navBtnQueues) els.navBtnQueues.classList.add("active");
  els.vehiclesCrudSection.classList.add("hidden");
  els.cooperadosCrudSection.classList.add("hidden");
  els.accessCrudSection.classList.add("hidden");
  els.movementsTimelineSection.classList.add("hidden");
  if (els.ticketFlorestalSection) els.ticketFlorestalSection.classList.add("hidden");
  if (els.menuCategoryComprovantes) els.menuCategoryComprovantes.classList.add("hidden");
  els.queuesViewport.classList.remove("hidden");
  const controlBar = document.querySelector(".control-bar");
  if (controlBar) controlBar.classList.remove("hidden");

  // Clear sensitive UI elements
  els.queuesViewport.innerHTML = "";
  els.crudVehiclesTbody.innerHTML = "";
  els.crudCooperadosTbody.innerHTML = "";
  els.crudAccessTbody.innerHTML = "";
  if (els.crudTicketsTbody) els.crudTicketsTbody.innerHTML = "";
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

  if (els.locationModalClose) {
    els.locationModalClose.addEventListener("click", closeLocationModal);
  }
  if (els.locationModalBackdrop) {
    els.locationModalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.locationModalBackdrop) closeLocationModal();
    });
  }

  // Sub-menu category accordion toggles
  document.querySelectorAll(".menu-category-header").forEach(header => {
    header.addEventListener("click", () => {
      const category = header.closest(".menu-category");
      if (category) {
        category.classList.toggle("is-collapsed");
      }
    });
  });

  // Navigation event listeners
  if (els.navBtnQueues) els.navBtnQueues.addEventListener("click", () => switchView("queues"));
  if (els.navBtnMovements) els.navBtnMovements.addEventListener("click", () => switchView("movements"));
  if (els.navBtnVehiclesAdmin) els.navBtnVehiclesAdmin.addEventListener("click", () => switchView("vehicles"));
  if (els.navBtnCooperados) els.navBtnCooperados.addEventListener("click", () => switchView("cooperados"));
  if (els.navBtnTicketFlorestal) els.navBtnTicketFlorestal.addEventListener("click", () => switchView("ticket-florestal"));
  if (els.btnRefreshTickets) els.btnRefreshTickets.addEventListener("click", () => loadTicketsData(true));
  if (els.btnRefreshMovements) els.btnRefreshMovements.addEventListener("click", () => loadMovementsData());

  // Ticket Florestal Filters & Search
  if (els.ticketsSearchInput) {
    const handleTicketsSearch = debounce(() => {
      appState.ticketsSearch = els.ticketsSearchInput.value.trim();
      appState.ticketsPage = 0;
      loadTicketsData();
    }, 300);
    els.ticketsSearchInput.addEventListener("input", handleTicketsSearch);
  }

  if (els.ticketsStatusFilter) {
    els.ticketsStatusFilter.addEventListener("change", (e) => {
      appState.ticketsStatusFilter = e.target.value;
      appState.ticketsPage = 0;
      loadTicketsData();
    });
  }

  if (els.ticketsPeriodFilter) {
    els.ticketsPeriodFilter.addEventListener("change", (e) => {
      appState.ticketsPeriodFilter = e.target.value;
      appState.ticketsPage = 0;
      loadTicketsData(true);
    });
  }

  if (els.ticketsRegiaoFilter) {
    els.ticketsRegiaoFilter.addEventListener("change", (e) => {
      appState.ticketsRegiaoFilter = e.target.value;
      appState.ticketsPage = 0;
      loadTicketsData();
    });
  }

  if (els.ticketsSortSelect) {
    els.ticketsSortSelect.addEventListener("change", (e) => {
      appState.ticketsSort = e.target.value;
      appState.ticketsPage = 0;
      loadTicketsData();
    });
  }

  if (els.ticketsPagesizeSelect) {
    els.ticketsPagesizeSelect.addEventListener("change", (e) => {
      appState.ticketsPageSize = parseInt(e.target.value, 10) || 30;
      appState.ticketsPage = 0;
      loadTicketsData();
    });
  }

  if (els.btnResetTicketsFilters) {
    els.btnResetTicketsFilters.addEventListener("click", () => {
      appState.ticketsSearch = "";
      appState.ticketsStatusFilter = "pending";
      appState.ticketsPeriodFilter = "30";
      appState.ticketsRegiaoFilter = "all";
      appState.ticketsSort = "created_at_desc";
      appState.ticketsPage = 0;

      if (els.ticketsSearchInput) els.ticketsSearchInput.value = "";
      if (els.ticketsStatusFilter) els.ticketsStatusFilter.value = "pending";
      if (els.ticketsPeriodFilter) els.ticketsPeriodFilter.value = "30";
      if (els.ticketsRegiaoFilter) els.ticketsRegiaoFilter.value = "all";
      if (els.ticketsSortSelect) els.ticketsSortSelect.value = "created_at_desc";
      if (els.ticketsPagesizeSelect) els.ticketsPagesizeSelect.value = "30";

      loadTicketsData(true);
    });
  }

  // Ticket Florestal Pagination Controls
  if (els.btnFirstTicketsPage) {
    els.btnFirstTicketsPage.addEventListener("click", () => {
      if (appState.ticketsPage > 0) {
        appState.ticketsPage = 0;
        loadTicketsData();
      }
    });
  }
  if (els.btnPrevTicketsPage) {
    els.btnPrevTicketsPage.addEventListener("click", () => {
      if (appState.ticketsPage > 0) {
        appState.ticketsPage--;
        loadTicketsData();
      }
    });
  }
  if (els.btnNextTicketsPage) {
    els.btnNextTicketsPage.addEventListener("click", () => {
      if (appState.ticketsPage < appState.ticketsTotalPages - 1) {
        appState.ticketsPage++;
        loadTicketsData();
      }
    });
  }
  if (els.btnLastTicketsPage) {
    els.btnLastTicketsPage.addEventListener("click", () => {
      if (appState.ticketsPage < appState.ticketsTotalPages - 1) {
        appState.ticketsPage = appState.ticketsTotalPages - 1;
        loadTicketsData();
      }
    });
  }

  // Ticket Florestal Modal Controls & Image Viewer Controls
  if (els.ticketModalClose) els.ticketModalClose.addEventListener("click", closeTicketModal);
  if (els.btnCancelTicket) els.btnCancelTicket.addEventListener("click", closeTicketModal);
  if (els.ticketModalBackdrop) {
    els.ticketModalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.ticketModalBackdrop) closeTicketModal();
    });
  }
  if (els.btnToggleTicketImg) {
    els.btnToggleTicketImg.addEventListener("click", () => toggleTicketModalSplitView());
  }
  if (els.btnTicketZoomIn) {
    els.btnTicketZoomIn.addEventListener("click", () => setTicketImageZoom(ticketViewerState.zoom * 1.25, true));
  }
  if (els.btnTicketZoomOut) {
    els.btnTicketZoomOut.addEventListener("click", () => setTicketImageZoom(ticketViewerState.zoom / 1.25, true));
  }
  if (els.btnTicketZoomReset) {
    els.btnTicketZoomReset.addEventListener("click", resetTicketImageTransform);
  }
  if (els.btnTicketRotate) {
    els.btnTicketRotate.addEventListener("click", rotateTicketImage);
  }

  // Image Viewport Wheel and Pan interaction (Strictly contained inside viewport)
  if (els.ticketImageViewport) {
    // Wheel Zoom
    els.ticketImageViewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.18 : 0.85;
      setTicketImageZoom(ticketViewerState.zoom * zoomFactor, true);
    }, { passive: false });

    // Double-click to toggle 2.2x zoom
    els.ticketImageViewport.addEventListener("dblclick", () => {
      if (ticketViewerState.zoom > 1.1) {
        resetTicketImageTransform();
      } else {
        setTicketImageZoom(2.2, true);
      }
    });

    // Mouse drag / Pan
    els.ticketImageViewport.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only left click
      ticketViewerState.isDragging = true;
      ticketViewerState.startX = e.clientX - ticketViewerState.panX;
      ticketViewerState.startY = e.clientY - ticketViewerState.panY;
      els.ticketImageViewport.classList.add("is-panning");
    });

    // Touch support (drag)
    els.ticketImageViewport.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        ticketViewerState.isDragging = true;
        ticketViewerState.startX = e.touches[0].clientX - ticketViewerState.panX;
        ticketViewerState.startY = e.touches[0].clientY - ticketViewerState.panY;
        els.ticketImageViewport.classList.add("is-panning");
      }
    }, { passive: true });

    els.ticketImageViewport.addEventListener("touchmove", (e) => {
      if (!ticketViewerState.isDragging || e.touches.length !== 1) return;
      ticketViewerState.panX = e.touches[0].clientX - ticketViewerState.startX;
      ticketViewerState.panY = e.touches[0].clientY - ticketViewerState.startY;
      applyTicketImageTransform(false);
    }, { passive: true });

    els.ticketImageViewport.addEventListener("touchend", () => {
      ticketViewerState.isDragging = false;
      els.ticketImageViewport.classList.remove("is-panning");
    });
  }

  window.addEventListener("mousemove", (e) => {
    if (!ticketViewerState.isDragging) return;
    e.preventDefault();
    ticketViewerState.panX = e.clientX - ticketViewerState.startX;
    ticketViewerState.panY = e.clientY - ticketViewerState.startY;
    applyTicketImageTransform(false);
  });

  window.addEventListener("mouseup", () => {
    if (ticketViewerState.isDragging) {
      ticketViewerState.isDragging = false;
      if (els.ticketImageViewport) els.ticketImageViewport.classList.remove("is-panning");
    }
  });

  if (els.ticketForm) {
    els.ticketForm.addEventListener("submit", (e) => handleTicketFormSubmit(e, false));
  }
  if (els.btnSaveApproveTicket) {
    els.btnSaveApproveTicket.addEventListener("click", (e) => handleTicketFormSubmit(e, true));
  }

  // Ticket AI Modal Controls
  if (els.ticketAiModalClose) els.ticketAiModalClose.addEventListener("click", closeTicketAiModal);
  if (els.btnCloseTicketAiModal) els.btnCloseTicketAiModal.addEventListener("click", closeTicketAiModal);
  if (els.ticketAiModalBackdrop) {
    els.ticketAiModalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.ticketAiModalBackdrop) closeTicketAiModal();
    });
  }
  if (els.btnEditFromAiModal) {
    els.btnEditFromAiModal.addEventListener("click", () => {
      closeTicketAiModal();
      if (appState.activeViewingTicket) openTicketModal(appState.activeViewingTicket);
    });
  }
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
  if (els.btnSyncAccess) els.btnSyncAccess.addEventListener("click", triggerAccessSync);
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

  // Profiles Management Event Listeners
  if (els.navBtnProfiles) els.navBtnProfiles.addEventListener("click", () => switchView("profiles"));
  if (els.btnRefreshProfiles) els.btnRefreshProfiles.addEventListener("click", () => loadProfilesData(true));
  if (els.profileModalClose) els.profileModalClose.addEventListener("click", closeProfileModal);
  if (els.btnCancelProfile) els.btnCancelProfile.addEventListener("click", closeProfileModal);
  if (els.profileModalBackdrop) {
    els.profileModalBackdrop.addEventListener("click", (e) => {
      if (e.target === els.profileModalBackdrop) closeProfileModal();
    });
  }
  if (els.profileForm) els.profileForm.addEventListener("submit", handleSaveProfile);

  if (els.crudProfilesSearchInput) {
    els.crudProfilesSearchInput.addEventListener("input", debounce((e) => {
      appState.profilesSearch = e.target.value.trim();
      renderProfilesTable();
    }, 250));
  }

  if (els.crudProfilesRoleFilter) {
    els.crudProfilesRoleFilter.addEventListener("change", (e) => {
      appState.profilesRoleFilter = e.target.value;
      renderProfilesTable();
    });
  }

  if (els.crudProfilesLinkFilter) {
    els.crudProfilesLinkFilter.addEventListener("change", (e) => {
      appState.profilesLinkFilter = e.target.value;
      renderProfilesTable();
    });
  }

  if (els.btnResetProfilesFilters) {
    els.btnResetProfilesFilters.addEventListener("click", () => {
      appState.profilesSearch = "";
      appState.profilesRoleFilter = "all";
      appState.profilesLinkFilter = "all";
      if (els.crudProfilesSearchInput) els.crudProfilesSearchInput.value = "";
      if (els.crudProfilesRoleFilter) els.crudProfilesRoleFilter.value = "all";
      if (els.crudProfilesLinkFilter) els.crudProfilesLinkFilter.value = "all";
      renderProfilesTable();
    });
  }

  // ESC key to close modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeLocationModal();
      closeVehicleModal();
      closeCooperadoModal();
      closeAccessModal();
      closeLinkCooperadosModal();
      closeProfileModal();
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

// HELPER: VERIFICA SE O VEÍCULO ESTÁ EM CRÍTICA (emCritica)
function isEmCritica(vehicle) {
  if (!vehicle) return false;
  const val = vehicle.emCritica !== undefined ? vehicle.emCritica : vehicle.em_critica;
  return val === true || val === "true" || val === 1 || val === "1" || val === "S" || val === "s" || val === "sim" || val === "SIM";
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
              <th class="pos-cell">Pos</th>
              <th class="plate-cell">Placas</th>
              <th class="vehicle-cell">Veículo / Cooperado</th>
              <th class="vinculo-cell">Vínculo</th>
              <th class="recusa-cell">Rec.</th>
              <th class="critica-cell" title="Em Crítica">Crítica</th>
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
                <td><div class="skeleton sk-critica"></div></td>
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
          <th class="vinculo-cell">Vínculo</th>
          <th class="recusa-cell">Rec.</th>
          <th class="critica-cell" title="Em Crítica">Crítica</th>
        </tr>
      </thead>
    `;

    const tbody = document.createElement("tbody");

    if (vehicles.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
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

        // Destaque visual por tempo de espera (>18h amarelo leve, >22h vermelho leve, >24h vermelho moderado)
        const refDateStr = vehicle.created_at || vehicle.dthRef;
        if (refDateStr) {
          const startMs = new Date(refDateStr).getTime();
          if (!isNaN(startMs)) {
            const ageHours = (Date.now() - startMs) / (1000 * 60 * 60);
            if (ageHours > 24) {
              row.className = "queue-row-critical";
            } else if (ageHours > 22) {
              row.className = "queue-row-danger";
            } else if (ageHours > 18) {
              row.className = "queue-row-warning";
            }
          }
        }

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

        // Render Main Plate (placa) - clickable to view tracker location
        const mainPlateBadge = document.createElement("span");
        mainPlateBadge.className = "plate-badge plate-badge-main";
        mainPlateBadge.title = "Placa Principal • Clique para ver localização de entrada do rastreador";
        mainPlateBadge.style.cursor = "pointer";
        mainPlateBadge.textContent = formatPlateString(vehicle.placa);
        mainPlateBadge.addEventListener("click", (e) => {
          e.stopPropagation();
          openVehicleLocationModal(vehicle);
        });
        platesStack.appendChild(mainPlateBadge);

        // Render trailers (placa2, placa3) if present
        if (vehicle.placa2) {
          const trailer1 = document.createElement("span");
          trailer1.className = "plate-badge plate-badge-trailer";
          trailer1.title = "Reboque";
          trailer1.textContent = formatPlateString(vehicle.placa2);
          platesStack.appendChild(trailer1);
        }
        if (vehicle.placa3) {
          const trailer2 = document.createElement("span");
          trailer2.className = "plate-badge plate-badge-trailer";
          trailer2.title = "Reboque";
          trailer2.textContent = formatPlateString(vehicle.placa3);
          platesStack.appendChild(trailer2);
        }

        plateCell.appendChild(platesStack);
        row.appendChild(plateCell);

        // Vehicle Type and Cooperado
        const vCell = document.createElement("td");
        vCell.className = "vehicle-cell";
        vCell.innerHTML = `
          <div class="vehicle-type" title="${vehicle.tipo || 'N/D'}">${vehicle.tipo || 'N/D'}</div>
          <div class="cooperado-name" title="${vehicle.nomeCooperado || 'N/D'}">${vehicle.nomeCooperado || 'N/D'}</div>
          <div class="history-date" style="font-size: 0.65rem; margin-top: 4px;" title="Entrada na fila: ${formatDateTime(vehicle.created_at || vehicle.dthRef)}">
            Entrou há: ${getRelativeTime(vehicle.created_at || vehicle.dthRef)}
          </div>
        `;
        row.appendChild(vCell);

        // Frota status
        const fCell = document.createElement("td");
        fCell.className = "vinculo-cell";
        if (vehicle.frota) {
          fCell.innerHTML = `<span class="frota-badge frota" title="Frota própria da Cootravale"><i data-lucide="shield-check" style="width:10px;height:10px;"></i> Frota</span>`;
        } else {
          fCell.innerHTML = `<span class="frota-badge terceiro" title="Veículo Não Frota"><i data-lucide="user" style="width:10px;height:10px;"></i> Não Frota</span>`;
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

        // Status Em Crítica cell (coluna após o contador de recusas)
        const criticaCell = document.createElement("td");
        criticaCell.className = "critica-cell";
        const isCritica = isEmCritica(vehicle);
        criticaCell.innerHTML = `
          <span class="critica-indicator ${isCritica ? 'critica-true' : 'critica-false'}" title="${isCritica ? 'Em Crítica: Sim' : 'Em Crítica: Não'}">
            <i data-lucide="alert-circle" style="width: 16px; height: 16px;"></i>
          </span>
        `;
        row.appendChild(criticaCell);

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

// VEHICLE LOCATION / TRACKER MODAL LOGIC
function openVehicleLocationModal(vehicle) {
  if (!vehicle) return;

  const formattedPlate = formatPlateString(vehicle.placa);
  if (els.locationModalTitle) {
    els.locationModalTitle.textContent = `Localização • ${formattedPlate}`;
  }

  const hasLocation = Boolean(vehicle.local_entrada && String(vehicle.local_entrada).trim() && String(vehicle.local_entrada).trim().toUpperCase() !== "NULL");
  const hasDthLocal = Boolean(vehicle.dth_local && String(vehicle.dth_local).trim() && String(vehicle.dth_local).trim().toUpperCase() !== "NULL");

  const locationText = hasLocation ? String(vehicle.local_entrada).trim() : "Local não registrado pelo rastreador";
  const dthLocalFormatted = hasDthLocal ? formatDateTimeWithSeconds(vehicle.dth_local) : "Data/hora não registrada pelo rastreador";
  const dthLocalRelative = hasDthLocal ? getRelativeTime(vehicle.dth_local) : "";

  const queueEntryDate = vehicle.created_at || vehicle.dthRef;
  const queueEntryFormatted = queueEntryDate ? formatDateTimeWithSeconds(queueEntryDate) : "Não informada";
  const queueEntryRelative = queueEntryDate ? getRelativeTime(queueEntryDate) : "";

  let trailersHTML = "";
  if (vehicle.placa2 || vehicle.placa3) {
    trailersHTML = `
      <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
        ${vehicle.placa2 ? `<span class="plate-badge plate-badge-trailer" style="font-size: 0.7rem;">Reboque 1: ${formatPlateString(vehicle.placa2)}</span>` : ""}
        ${vehicle.placa3 ? `<span class="plate-badge plate-badge-trailer" style="font-size: 0.7rem;">Reboque 2: ${formatPlateString(vehicle.placa3)}</span>` : ""}
      </div>
    `;
  }

  els.locationModalBody.innerHTML = `
    <!-- Header Summary Card -->
    <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 14px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <span class="plate-badge plate-badge-main" style="font-size: 0.92rem; padding: 4px 10px; letter-spacing: 0.05em;">${formattedPlate}</span>
        <span class="frota-badge ${vehicle.frota ? 'frota' : 'terceiro'}" style="font-size: 0.72rem;">
          ${vehicle.frota ? '<i data-lucide="shield-check" style="width:11px;height:11px;"></i> Frota' : '<i data-lucide="user" style="width:11px;height:11px;"></i> Não Frota'}
        </span>
      </div>
      <div style="font-size: 0.86rem; font-weight: 600; color: var(--text-primary); margin-top: 6px;">
        ${vehicle.tipo || 'Tipo não informado'}
      </div>
      <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
        Cooperado: <strong style="color: var(--text-secondary);">${vehicle.nomeCooperado || 'Não informado'}</strong>
      </div>
      ${trailersHTML}
    </div>

    <!-- Location & Tracker Info Cards -->
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <!-- Local de Entrada (Cidade/UF) -->
      <div style="background: ${hasLocation ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${hasLocation ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-color)'}; border-radius: 10px; padding: 12px 14px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <i data-lucide="map-pin" style="width: 16px; height: 16px; color: ${hasLocation ? 'var(--accent)' : 'var(--text-muted)'};"></i>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; color: ${hasLocation ? 'var(--accent)' : 'var(--text-muted)'};">
            Local de Entrada (Cidade / UF)
          </span>
        </div>
        <div style="font-size: 1.05rem; font-weight: 700; color: ${hasLocation ? 'var(--text-primary)' : 'var(--text-muted)'}; padding-left: 24px;">
          ${locationText}
        </div>
      </div>

      <!-- Data/Hora do Rastreador -->
      <div style="background: ${hasDthLocal ? 'rgba(96, 165, 250, 0.08)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${hasDthLocal ? 'rgba(96, 165, 250, 0.35)' : 'var(--border-color)'}; border-radius: 10px; padding: 12px 14px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <i data-lucide="radio" style="width: 16px; height: 16px; color: ${hasDthLocal ? 'var(--info)' : 'var(--text-muted)'};"></i>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; color: ${hasDthLocal ? 'var(--info)' : 'var(--text-muted)'};">
            Data / Hora do Rastreador
          </span>
        </div>
        <div style="display: flex; align-items: baseline; gap: 8px; padding-left: 24px; flex-wrap: wrap;">
          <span style="font-size: 0.95rem; font-weight: 600; color: ${hasDthLocal ? 'var(--text-primary)' : 'var(--text-muted)'};">
            ${dthLocalFormatted}
          </span>
          ${dthLocalRelative ? `<span style="font-size: 0.75rem; color: var(--text-muted);">(${dthLocalRelative})</span>` : ""}
        </div>
      </div>

      <!-- Fila Atual e Entrada no Sistema -->
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px 14px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
          <i data-lucide="layers" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
          <span style="font-size: 0.72rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; color: var(--text-muted);">
            Fila Atual & Entrada no Sistema
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding-left: 24px; font-size: 0.82rem; flex-wrap: wrap; gap: 4px;">
          <span style="color: var(--text-primary); font-weight: 600;">Fila: ${vehicle.descFila || 'Não especificada'}</span>
          <span style="color: var(--text-muted);">Entrou há: <strong style="color: var(--accent);">${queueEntryRelative || 'N/D'}</strong></span>
        </div>
        <div style="padding-left: 24px; font-size: 0.72rem; color: var(--text-muted); margin-top: 4px;">
          Registro no sistema: ${queueEntryFormatted}
        </div>
      </div>
    </div>
  `;

  if (els.locationModalBackdrop) {
    els.locationModalBackdrop.classList.add("show");
  }
  lucide.createIcons();
}

function closeLocationModal() {
  if (els.locationModalBackdrop) {
    els.locationModalBackdrop.classList.remove("show");
  }
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

function formatRefreshCountdown(seconds) {
  if (seconds >= 60) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${seconds}s`;
}

function updateAutoRefreshUI() {
  if (appState.autoRefresh.active) {
    els.btnToggleAutoRefresh.innerHTML = `<i data-lucide="pause"></i>`;
    els.refreshCountdownText.textContent = `Atualizando em ${formatRefreshCountdown(appState.autoRefresh.countdown)}`;
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
  if ((view === "vehicles" || view === "cooperados" || view === "access" || view === "profiles") && !appState.isAdmin) {
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
  if (els.profilesCrudSection) els.profilesCrudSection.classList.add("hidden");
  els.movementsTimelineSection.classList.add("hidden");
  if (els.ticketFlorestalSection) els.ticketFlorestalSection.classList.add("hidden");
  if (controlBar) controlBar.classList.add("hidden");

  // Reset active navigation styles on all nav-items
  document.querySelectorAll(".nav-item").forEach(item => item.classList.remove("active"));
  // Mark all nav-items matching the active view as active
  document.querySelectorAll(`.nav-item[data-view="${view}"]`).forEach(item => item.classList.add("active"));

  // Update application header title & subtitle dynamically
  const appHeaderTitle = document.querySelector(".header-title");
  const appHeaderSubtitle = document.querySelector(".header-subtitle");
  if (appHeaderTitle && appHeaderSubtitle) {
    if (view === "ticket-florestal") {
      appHeaderTitle.textContent = "Ticket Florestal";
      appHeaderSubtitle.textContent = "Comprovantes & Auditoria IA | v1.06";
    } else if (view === "vehicles") {
      appHeaderTitle.textContent = "Gestão de Veículos";
      appHeaderSubtitle.textContent = "Administrativo | v1.06";
    } else if (view === "cooperados") {
      appHeaderTitle.textContent = "Gestão de Cooperados";
      appHeaderSubtitle.textContent = "Administrativo | v1.06";
    } else if (view === "access") {
      appHeaderTitle.textContent = "Controle de Acessos";
      appHeaderSubtitle.textContent = "Administrativo | v1.06";
    } else if (view === "profiles") {
      appHeaderTitle.textContent = "Perfis de Usuários";
      appHeaderSubtitle.textContent = "Administrativo | v1.06";
    } else if (view === "movements") {
      appHeaderTitle.textContent = "Movimentações";
      appHeaderSubtitle.textContent = "Fila de Carregamento | v1.06";
    } else {
      appHeaderTitle.textContent = "Filas de Carregamento";
      appHeaderSubtitle.textContent = "Central de Fretes | v1.06";
    }
  }

  if (view === "vehicles") {
    els.vehiclesCrudSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadVehiclesData(true);
  } else if (view === "cooperados") {
    els.cooperadosCrudSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadCooperadosData(true);
  } else if (view === "access") {
    els.accessCrudSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadAccessData(true);
  } else if (view === "profiles") {
    if (els.profilesCrudSection) els.profilesCrudSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadProfilesData(true);
  } else if (view === "ticket-florestal") {
    if (els.ticketFlorestalSection) els.ticketFlorestalSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadTicketsData(true);
    lucide.createIcons();
  } else if (view === "movements") {
    els.movementsTimelineSection.classList.remove("hidden");

    stopAutoRefresh();
    els.refreshCountdownText.textContent = "Atualização pausada";
    els.refreshIndicatorDot.className = "indicator-dot inactive";

    loadMovementsData();
  } else {
    // default/queues view ("Grid")
    els.queuesViewport.classList.remove("hidden");
    if (controlBar) controlBar.classList.remove("hidden");

    if (appState.autoRefresh.active) {
      startAutoRefresh();
    }
    loadQueuesData(true);
  }
}

async function loadAdminAuxiliaryData() {
  try {
    // Fetch Cooperados (selecting status, idContatos, and codigo)
    const { data: cooperadosData, error: coopError } = await supabaseClient
      .from("cooperado")
      .select("id, nome, status, idContatos, codigo")
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
  if (!coop) return "Carregando...";
  return coop.codigo ? `${coop.nome} (${coop.codigo})` : coop.nome;
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
      // Find matching cooperados to search by owner name or code (limit to 20 to avoid large URL query string)
      const { data: coops } = await supabaseClient
        .from("cooperado")
        .select("id")
        .or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`)
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
      tdVinculo.innerHTML = `<span class="frota-badge terceiro"><i data-lucide="user" style="width:10px;height:10px;display:inline-block;vertical-align:middle;"></i> Não Frota</span>`;
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
      <td colspan="5" style="text-align: center; padding: 2.5rem;">
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

    // Search filter (name, code, or contacts)
    if (search) {
      const cleanSearch = search.replace(/[^A-Za-z0-9]/g, "");
      if (cleanSearch && cleanSearch.length >= 3) {
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%,idContatos.cs.{"${cleanSearch}"}`);
      } else {
        query = query.or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`);
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
      case "codigo_asc":
        query = query.order("codigo", { ascending: true, nullsFirst: false });
        break;
      case "codigo_desc":
        query = query.order("codigo", { ascending: false, nullsFirst: false });
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
      // Fallback to name or code search if array query failed
      if (search) {
        let fallbackQuery = supabaseClient
          .from("cooperado")
          .select("*", { count: "exact" })
          .or(`nome.ilike.%${search}%,codigo.ilike.%${search}%`);

        if (statusFilter === "ativo") fallbackQuery = fallbackQuery.or("status.is.null,status.neq.inativo");
        else if (statusFilter === "inativo") fallbackQuery = fallbackQuery.eq("status", "inativo");

        if (sort === "codigo_asc") fallbackQuery = fallbackQuery.order("codigo", { ascending: true, nullsFirst: false });
        else if (sort === "codigo_desc") fallbackQuery = fallbackQuery.order("codigo", { ascending: false, nullsFirst: false });
        else fallbackQuery = fallbackQuery.order("nome", { ascending: sort !== "nome_desc" });

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
        <td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">
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
        <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          Nenhum cooperado cadastrado ou correspondente aos filtros.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(c => {
    const row = document.createElement("tr");

    // Código
    const tdCodigo = document.createElement("td");
    if (c.codigo) {
      const codeBadge = document.createElement("span");
      codeBadge.className = "badge-status";
      codeBadge.style.fontFamily = "monospace";
      codeBadge.style.fontSize = "0.82rem";
      codeBadge.style.fontWeight = "600";
      codeBadge.style.background = "rgba(82, 160, 125, 0.12)";
      codeBadge.style.color = "var(--accent)";
      codeBadge.style.border = "1px solid rgba(82, 160, 125, 0.25)";
      codeBadge.style.padding = "2px 8px";
      codeBadge.style.borderRadius = "4px";
      codeBadge.textContent = c.codigo;
      tdCodigo.appendChild(codeBadge);
    } else {
      tdCodigo.innerHTML = '<span style="color:var(--text-muted); opacity:0.4;">-</span>';
    }
    row.appendChild(tdCodigo);

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
  if (els.cooperadoCodigo) els.cooperadoCodigo.value = "";
  appState.cooperadoFormContacts = [];

  if (cooperado) {
    els.cooperadoModalTitle.textContent = "Editar Cooperado";
    els.cooperadoId.value = cooperado.id;
    if (els.cooperadoCodigo) els.cooperadoCodigo.value = cooperado.codigo || "";
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
  if (els.cooperadoCodigo) els.cooperadoCodigo.value = "";
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
  const codigo = els.cooperadoCodigo ? (els.cooperadoCodigo.value.trim() || null) : null;
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
    codigo,
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
      query = query.or(`nome.ilike.%${search}%,numero.ilike.%${search}%,empresa.ilike.%${search}%`);
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
      case "empresa_asc":
        query = query.order("empresa", { ascending: true, nullsFirst: false });
        break;
      case "empresa_desc":
        query = query.order("empresa", { ascending: false, nullsFirst: false });
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

    const empresaSpan = document.createElement("span");
    if (item.empresa && item.empresa.trim()) {
      empresaSpan.className = "access-user-empresa";
      empresaSpan.innerHTML = `
        <i data-lucide="building-2"></i>
        <span>${item.empresa.trim()}</span>
      `;
      empresaSpan.title = `Empresa: ${item.empresa.trim()}${item.id ? ` • ID: ${item.id}` : ""}`;
    } else {
      empresaSpan.className = "access-user-empresa empty";
      empresaSpan.innerHTML = `
        <i data-lucide="building-2"></i>
        <span>Empresa não informada</span>
      `;
      empresaSpan.title = item.id ? `ID: ${item.id}` : "Empresa não informada";
    }

    info.appendChild(nameSpan);
    info.appendChild(empresaSpan);

    userCell.appendChild(avatar);
    userCell.appendChild(info);
    if (item.id) {
      userCell.title = `ID: ${item.id}`;
    }
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
    if (els.accessEmpresa) els.accessEmpresa.value = item.empresa || "";
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
    els.accessNome.value = "";
    if (els.accessEmpresa) els.accessEmpresa.value = "";
    els.accessNumero.value = "";
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
  if (els.accessEmpresa) els.accessEmpresa.value = "";
  els.accessEditMode.value = "false";
}

async function handleAccessFormSubmit(e) {
  e.preventDefault();

  const isEdit = els.accessEditMode.value === "true";
  const id = els.accessId.value.trim().toLowerCase();
  const nome = els.accessNome.value.trim();
  const empresa = els.accessEmpresa ? els.accessEmpresa.value.trim() || null : null;
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
          empresa,
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
        empresa,
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

async function triggerAccessSync() {
  const syncBtn = els.btnSyncAccess;
  if (!syncBtn) return;

  const originalHtml = syncBtn.innerHTML;
  syncBtn.disabled = true;
  syncBtn.innerHTML = `<div class="spinner"></div><span>Sincronizando...</span>`;

  const webhookUrl = "https://n8n.srv1999707.hstgr.cloud/webhook/0c800df8-d44a-4ac3-9cf6-5e67e5ca4eaa";

  try {
    const response = await fetch(webhookUrl, {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(`Servidor retornou status ${response.status} (${response.statusText})`);
    }

    Toast.show(
      "Sincronização Iniciada",
      "O webhook de sincronização foi acionado com sucesso no n8n. Atualizando lista...",
      "success"
    );

    // Refresh access table and stats after slight delay to allow processing
    setTimeout(() => {
      loadAccessData(true);
    }, 2500);
  } catch (err) {
    console.error("Erro ao acionar webhook de sincronização:", err);
    Toast.show(
      "Erro na Sincronização",
      err.message || "Não foi possível acionar o webhook de sincronização.",
      "error"
    );
  } finally {
    syncBtn.disabled = false;
    syncBtn.innerHTML = originalHtml;
    lucide.createIcons();
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
    const empresaText = item.empresa ? ` • ${item.empresa}` : "";
    const phoneText = item.numero ? ` (${item.numero})` : "";
    els.linkCooperadosContactInfo.textContent = `Contato: ${contactText}${empresaText}${phoneText}`;
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
    const coopNome = coop ? (coop.codigo ? `${coop.nome} (${coop.codigo})` : coop.nome) : `Cooperado (${coopId.substring(0, 8)}...)`;
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
    ? available.filter(c => (c.nome && c.nome.toLowerCase().includes(query)) || (c.codigo && c.codigo.toLowerCase().includes(query)))
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

    const displayName = c.codigo ? `${c.nome} (${c.codigo})` : c.nome;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = displayName;

    const statusBadge = document.createElement("span");
    statusBadge.className = `linked-coop-status ${c.status === 'ativo' ? 'ativo' : 'inativo'}`;
    statusBadge.textContent = c.status === 'ativo' ? 'Ativo' : 'Inativo';

    div.appendChild(nameSpan);
    div.appendChild(statusBadge);

    div.addEventListener("click", () => {
      selectCooperadoForLink(c.id, displayName);
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
    const matchNome = c.nome && c.nome.toLowerCase().includes(query);
    const matchCodigo = c.codigo && c.codigo.toLowerCase().includes(query);
    return matchNome || matchCodigo;
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
    const displayName = c.codigo ? `${c.nome} (${c.codigo})` : c.nome;
    div.textContent = displayName;
    div.addEventListener("click", () => {
      selectCooperadoCombobox(c.id, displayName);
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

// ==========================================
// PROFILES (PUBLIC.PROFILES) CRUD - ADMIN EXCLUSIVE
// ==========================================

function escapeHTML(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadProfilesData(fetchStats = false) {
  if (!appState.isAdmin) return;

  if (els.crudProfilesTbody) {
    els.crudProfilesTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2.5rem;">
          <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
          <span style="color: var(--text-muted); font-size: 0.85rem;">Carregando tabela profiles...</span>
        </td>
      </tr>
    `;
  }

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    appState.profiles = data || [];

    if (fetchStats) {
      updateProfilesStats(appState.profiles);
    }

    renderProfilesTable();
  } catch (err) {
    console.error("Erro ao carregar profiles:", err);
    if (els.crudProfilesTbody) {
      els.crudProfilesTbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--danger);">
            <i data-lucide="alert-circle" style="display:inline-block; margin-bottom: 6px;"></i>
            <div>Falha ao carregar perfis: ${escapeHTML(err.message || "Erro desconhecido")}</div>
          </td>
        </tr>
      `;
      lucide.createIcons();
    }
    Toast.show("Erro ao carregar", "Não foi possível buscar os perfis da base de dados.", "error");
  }
}

function updateProfilesStats(profiles) {
  const total = profiles.length;
  const admins = profiles.filter(p => p.role === "admin").length;
  const linked = profiles.filter(p => p.id_contato && p.id_contato.trim() !== "").length;
  const unlinked = total - linked;

  if (els.statProfilesTotal) els.statProfilesTotal.textContent = total;
  if (els.statProfilesAdmins) els.statProfilesAdmins.textContent = admins;
  if (els.statProfilesLinked) els.statProfilesLinked.textContent = linked;
  if (els.statProfilesUnlinked) els.statProfilesUnlinked.textContent = unlinked;
}

function renderProfilesTable() {
  if (!els.crudProfilesTbody) return;

  const search = (appState.profilesSearch || "").toLowerCase();
  const roleFilter = appState.profilesRoleFilter || "all";
  const linkFilter = appState.profilesLinkFilter || "all";

  const filtered = (appState.profiles || []).filter(p => {
    // Search
    const emailMatch = p.email && p.email.toLowerCase().includes(search);
    const roleMatch = p.role && p.role.toLowerCase().includes(search);
    const contatoMatch = p.id_contato && p.id_contato.toLowerCase().includes(search);
    const idMatch = p.id && p.id.toLowerCase().includes(search);
    const matchesSearch = !search || emailMatch || roleMatch || contatoMatch || idMatch;

    // Role
    const matchesRole = roleFilter === "all" || p.role === roleFilter;

    // Link
    const hasContact = p.id_contato && p.id_contato.trim() !== "";
    const matchesLink = linkFilter === "all" ||
      (linkFilter === "linked" && hasContact) ||
      (linkFilter === "unlinked" && !hasContact);

    return matchesSearch && matchesRole && matchesLink;
  });

  if (filtered.length === 0) {
    els.crudProfilesTbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 2.5rem;">
          <div class="empty-queue">
            <i data-lucide="user-x"></i>
            <div class="empty-queue-text">Nenhum perfil encontrado com os filtros selecionados.</div>
          </div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  els.crudProfilesTbody.innerHTML = "";

  filtered.forEach(p => {
    const tr = document.createElement("tr");

    // Email / User
    const tdEmail = document.createElement("td");
    tdEmail.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--accent-bg-glow); border: 1px solid var(--border-color); display: flex; align-items: center; justify-content: center; color: var(--accent); flex-shrink: 0;">
          <i data-lucide="user" style="width: 16px; height: 16px;"></i>
        </div>
        <div>
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.82rem;">${escapeHTML(p.email || "Sem e-mail")}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace;" title="UUID: ${p.id}">
            ${p.id ? p.id.substring(0, 13) + '...' : '-'}
          </div>
        </div>
      </div>
    `;
    tr.appendChild(tdEmail);

    // Role
    const tdRole = document.createElement("td");
    tdRole.style.textAlign = "center";
    const isAdmin = p.role === "admin";
    tdRole.innerHTML = `
      <span class="frota-badge ${isAdmin ? 'frota' : 'terceiro'}" style="font-size: 0.72rem; padding: 3px 8px;">
        <i data-lucide="${isAdmin ? 'shield-check' : 'user'}" style="width: 11px; height: 11px;"></i>
        ${isAdmin ? 'Administrador' : (p.role ? escapeHTML(p.role) : 'Viewer')}
      </span>
    `;
    tr.appendChild(tdRole);

    // ID Contato (The only editable field)
    const tdContato = document.createElement("td");
    if (p.id_contato && p.id_contato.trim()) {
      const escapedContato = escapeHTML(p.id_contato);
      tdContato.innerHTML = `
        <div style="display: flex; align-items: center; gap: 6px;">
          <code style="background: rgba(0,0,0,0.06); padding: 2px 7px; border-radius: 4px; font-size: 0.78rem; color: var(--accent); border: 1px solid var(--border-color); font-family: monospace;">
            ${escapedContato}
          </code>
          <button type="button" class="btn-icon-subtle" title="Copiar ID de Contato" data-clipboard="${escapedContato}">
            <i data-lucide="copy" style="width: 13px; height: 13px;"></i>
          </button>
        </div>
      `;
      const copyBtn = tdContato.querySelector("button[data-clipboard]");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(p.id_contato);
          Toast.show("Copiado", "ID de Contato copiado para a área de transferência.", "success");
        });
      }
    } else {
      tdContato.innerHTML = `<span style="color: var(--text-muted); font-size: 0.78rem; opacity: 0.6; font-style: italic;">Não informado</span>`;
    }
    tr.appendChild(tdContato);

    // Created At
    const tdCreated = document.createElement("td");
    tdCreated.style.fontSize = "0.78rem";
    tdCreated.style.color = "var(--text-muted)";
    tdCreated.textContent = p.created_at ? formatDateTime(p.created_at) : "-";
    tr.appendChild(tdCreated);

    // Actions
    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "center";
    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-sm btn-secondary";
    editBtn.style.padding = "4px 8px";
    editBtn.style.display = "inline-flex";
    editBtn.style.alignItems = "center";
    editBtn.style.gap = "4px";
    editBtn.style.cursor = "pointer";
    editBtn.title = "Alterar ID de Contato";
    editBtn.innerHTML = `<i data-lucide="pencil" style="width: 13px; height: 13px; pointer-events: none;"></i> <span style="pointer-events: none;">Editar</span>`;
    editBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      openProfileModal(p);
    });
    tdActions.appendChild(editBtn);
    tr.appendChild(tdActions);

    els.crudProfilesTbody.appendChild(tr);
  });

  lucide.createIcons();
}

function openProfileModal(profile) {
  const modal = els.profileModalBackdrop || document.getElementById("profile-modal-backdrop");
  if (!modal) return;
  const editId = els.profileEditId || document.getElementById("profile-edit-id");
  const editEmail = els.profileEditEmail || document.getElementById("profile-edit-email");
  const editRole = els.profileEditRole || document.getElementById("profile-edit-role");
  const editUuid = els.profileEditUuid || document.getElementById("profile-edit-uuid");
  const editIdContato = els.profileEditIdContato || document.getElementById("profile-edit-id-contato");

  if (editId) editId.value = profile.id || "";
  if (editEmail) editEmail.value = profile.email || "";
  if (editRole) editRole.value = profile.role === "admin" ? "Administrador (admin)" : (profile.role || "Viewer");
  if (editUuid) editUuid.value = profile.id || "";
  if (editIdContato) editIdContato.value = profile.id_contato || "";

  modal.classList.add("show");
  modal.classList.add("active");
  modal.style.display = "flex";
  modal.style.opacity = "1";
  modal.style.visibility = "visible";
  modal.style.pointerEvents = "auto";

  setTimeout(() => {
    if (editIdContato) {
      editIdContato.focus();
      editIdContato.select();
    }
  }, 100);
}

function closeProfileModal() {
  const modal = els.profileModalBackdrop || document.getElementById("profile-modal-backdrop");
  if (modal) {
    modal.classList.remove("show");
    modal.classList.remove("active");
    modal.style.display = "";
    modal.style.opacity = "";
    modal.style.visibility = "";
    modal.style.pointerEvents = "";
  }
}

window.openProfileModal = openProfileModal;
window.closeProfileModal = closeProfileModal;

async function handleSaveProfile(e) {
  e.preventDefault();
  if (!appState.isAdmin) {
    Toast.show("Acesso Negado", "Apenas administradores possuem permissão para alterar perfis.", "error");
    return;
  }

  const profileId = els.profileEditId.value;
  if (!profileId) {
    Toast.show("Erro", "ID do perfil inválido.", "error");
    return;
  }

  // User can ONLY alter id_contato
  const newIdContato = els.profileEditIdContato.value.trim() || null;

  try {
    if (els.btnSaveProfile) {
      els.btnSaveProfile.disabled = true;
      els.btnSaveProfile.innerHTML = `<span>Salvando...</span>`;
    }

    const { error } = await supabaseClient
      .from("profiles")
      .update({ id_contato: newIdContato })
      .eq("id", profileId);

    if (error) throw error;

    Toast.show("Salvo com Sucesso", "O campo id_contato foi atualizado no banco de dados.", "success");
    closeProfileModal();
    loadProfilesData(true);
  } catch (err) {
    console.error("Erro ao atualizar profile:", err);
    Toast.show("Erro ao salvar", err.message || "Não foi possível atualizar o ID de Contato.", "error");
  } finally {
    if (els.btnSaveProfile) {
      els.btnSaveProfile.disabled = false;
      els.btnSaveProfile.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> <span>Salvar ID de Contato</span>`;
      lucide.createIcons();
    }
  }
}

// ==========================================
// TICKET FLORESTAL (xcvt_comprovantes) LOGIC
// ==========================================

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadTicketsData(fetchStats = false) {
  if (!els.crudTicketsTbody) return;

  els.crudTicketsTbody.innerHTML = `
    <tr>
      <td colspan="12" style="text-align: center; padding: 2.5rem;">
        <div class="spinner" style="margin: 0 auto 10px auto; border-top-color: var(--accent);"></div>
        <span style="color: var(--text-muted); font-size: 0.85rem;">Carregando comprovantes extraídos pela IA...</span>
      </td>
    </tr>
  `;

  const page = appState.ticketsPage;
  const limit = appState.ticketsPageSize || 30;
  const from = page * limit;
  const to = from + limit - 1;
  const search = appState.ticketsSearch;
  const statusFilter = appState.ticketsStatusFilter;
  const periodFilter = appState.ticketsPeriodFilter;
  const regiaoFilter = appState.ticketsRegiaoFilter;
  const sort = appState.ticketsSort;

  try {
    let query = supabaseClient
      .from("xcvt_comprovantes")
      .select("*", { count: "exact" });

    // Text Search
    if (search) {
      query = query.or(
        `ai_placa.ilike.%${search}%,ai_processo.ilike.%${search}%,ai_regiao.ilike.%${search}%,ai_talhao.ilike.%${search}%,ai_destino.ilike.%${search}%,ai_nf.ilike.%${search}%,origem.ilike.%${search}%,fazenda.ilike.%${search}%`
      );
    }

    // Status Filter
    if (statusFilter === "approved") {
      query = query.eq("aprovado", true);
    } else if (statusFilter === "pending") {
      query = query.or("aprovado.eq.false,aprovado.is.null");
    }

    // Period / Date Limit Filter (Proteção para banco com 10k+ registros)
    if (periodFilter && periodFilter !== "all") {
      const days = parseInt(periodFilter, 10);
      if (!isNaN(days) && days > 0) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        query = query.gte("created_at", sinceDate.toISOString());
      }
    }

    // Region Filter
    if (regiaoFilter && regiaoFilter !== "all") {
      query = query.eq("ai_regiao", regiaoFilter);
    }

    // Sorting
    switch (sort) {
      case "created_at_asc":
        query = query.order("created_at", { ascending: true });
        break;
      case "ai_data_desc":
        query = query.order("ai_data", { ascending: false, nullsFirst: false });
        break;
      case "ai_placa_asc":
        query = query.order("ai_placa", { ascending: true });
        break;
      case "ai_processo_asc":
        query = query.order("ai_processo", { ascending: true });
        break;
      case "created_at_desc":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    // Pagination: Server-side LIMIT / OFFSET
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    appState.tickets = data || [];
    appState.ticketsTotalCount = count || 0;
    appState.ticketsTotalPages = Math.ceil((count || 0) / limit);

    // Optimized KPI Stats via HEAD query (zero rows transferred over network)
    if (fetchStats) {
      loadTicketsStats();
    }

    renderTicketsTable();
    updateTicketsPaginationControls();
  } catch (err) {
    console.error("Erro ao carregar tickets florestais:", err);
    els.crudTicketsTbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; padding: 2rem; color: var(--danger);">
          <i data-lucide="alert-circle" style="width: 24px; height: 24px; margin-bottom: 6px;"></i>
          <div>Falha ao carregar tickets: ${err.message || "Erro desconhecido"}</div>
        </td>
      </tr>
    `;
    lucide.createIcons();
  }
}

function populateTicketsRegiaoDropdown(regioes) {
  if (!els.ticketsRegiaoFilter) return;
  const currentVal = appState.ticketsRegiaoFilter;
  els.ticketsRegiaoFilter.innerHTML = '<option value="all">Todas as Regiões</option>';
  regioes.forEach(regiao => {
    const opt = document.createElement("option");
    opt.value = regiao;
    opt.textContent = regiao;
    if (regiao === currentVal) opt.selected = true;
    els.ticketsRegiaoFilter.appendChild(opt);
  });
}

async function loadTicketsStats() {
  try {
    // 1. Total count via HEAD query (0 rows transferred)
    const { count: total } = await supabaseClient
      .from("xcvt_comprovantes")
      .select("*", { count: "exact", head: true });

    // 2. Approved count via HEAD query (0 rows transferred)
    const { count: approved } = await supabaseClient
      .from("xcvt_comprovantes")
      .select("*", { count: "exact", head: true })
      .eq("aprovado", true);

    // 3. Pending count via HEAD query (0 rows transferred)
    const { count: pending } = await supabaseClient
      .from("xcvt_comprovantes")
      .select("*", { count: "exact", head: true })
      .or("aprovado.eq.false,aprovado.is.null");

    // 4. Sample recent 300 records to extract unique active regions and recent volume
    const { data: sampleData } = await supabaseClient
      .from("xcvt_comprovantes")
      .select("ai_regiao, ai_pesoliq")
      .order("created_at", { ascending: false })
      .limit(300);

    let totalPesoLiq = 0;
    if (sampleData) {
      totalPesoLiq = sampleData.reduce((acc, curr) => acc + (parseFloat(curr.ai_pesoliq) || 0), 0);
      const uniqueRegioes = Array.from(new Set(sampleData.map(d => d.ai_regiao).filter(Boolean))).sort();
      populateTicketsRegiaoDropdown(uniqueRegioes);
    }

    appState.ticketsStats = {
      total: total || 0,
      approved: approved || 0,
      pending: pending || 0,
      totalPesoLiq
    };

    if (els.statTicketsTotal) els.statTicketsTotal.textContent = (total || 0).toLocaleString("pt-BR");
    if (els.statTicketsPending) els.statTicketsPending.textContent = (pending || 0).toLocaleString("pt-BR");
    if (els.statTicketsApproved) els.statTicketsApproved.textContent = (approved || 0).toLocaleString("pt-BR");
    if (els.statTicketsPesoliq) {
      els.statTicketsPesoliq.textContent = totalPesoLiq.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }) + " t";
    }
  } catch (err) {
    console.error("Erro ao carregar estatísticas escaláveis de tickets:", err);
  }
}

function renderTicketsTable() {
  if (!els.crudTicketsTbody) return;
  els.crudTicketsTbody.innerHTML = "";

  if (appState.tickets.length === 0) {
    els.crudTicketsTbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 48px; height: 48px; margin: 0 auto 12px; border-radius: 12px; background: var(--bg-hover); display: flex; align-items: center; justify-content: center;">
            <i data-lucide="inbox" style="width: 24px; height: 24px;"></i>
          </div>
          <div style="font-weight: 600; font-size: 0.95rem; color: var(--text-color);">Nenhum ticket encontrado</div>
          <div style="font-size: 0.8rem; margin-top: 4px;">Tente ajustar os filtros de busca ou aguarde novas leituras de IA.</div>
        </td>
      </tr>
    `;
    lucide.createIcons();
    return;
  }

  appState.tickets.forEach(ticket => {
    const row = document.createElement("tr");

    // 1. Status / Avaliação (Toggle interativo)
    const tdStatus = document.createElement("td");
    tdStatus.style.textAlign = "center";
    const isApproved = (ticket.aprovado === true);
    const badgeApproved = document.createElement("span");
    badgeApproved.className = `badge-approved ${isApproved ? "approved" : "pending"}`;
    badgeApproved.title = isApproved ? "Clique para marcar como pendente" : "Clique para aprovar ticket";
    badgeApproved.innerHTML = `
      <span class="badge-dot"></span>
      <span>${isApproved ? "Aprovado" : "Pendente"}</span>
    `;
    badgeApproved.addEventListener("click", () => toggleTicketApproval(ticket.id, isApproved, ticket.ai_placa));
    tdStatus.appendChild(badgeApproved);
    row.appendChild(tdStatus);

    // 2. Placa
    const tdPlaca = document.createElement("td");
    tdPlaca.style.whiteSpace = "nowrap";
    if (ticket.ai_placa) {
      tdPlaca.innerHTML = `<span class="plate-badge plate-badge-main">${escapeHtml(ticket.ai_placa)}</span>`;
    } else {
      tdPlaca.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem;">—</span>`;
    }
    row.appendChild(tdPlaca);

    // 3. Processo
    const tdProcesso = document.createElement("td");
    tdProcesso.style.whiteSpace = "nowrap";
    tdProcesso.innerHTML = `<span style="font-weight: 600; font-family: monospace; font-size: 0.82rem;">${escapeHtml(ticket.ai_processo || "-")}</span>`;
    row.appendChild(tdProcesso);

    // 4. Data do Ticket
    const tdData = document.createElement("td");
    tdData.style.whiteSpace = "nowrap";
    if (ticket.ai_data) {
      const dt = new Date(ticket.ai_data);
      if (!isNaN(dt.getTime())) {
        const dateStr = dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
        const timeStr = dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        tdData.innerHTML = `
          <div class="access-date-cell">
            <span>${dateStr}</span>
            <span class="access-date-time">${timeStr}</span>
          </div>
        `;
      } else {
        tdData.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>`;
      }
    } else {
      tdData.innerHTML = `<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>`;
    }
    row.appendChild(tdData);

    // 5. Região / Talhão
    const tdRegiao = document.createElement("td");
    let regiaoHtml = ticket.ai_regiao ? `<span class="badge-tag-regiao">${escapeHtml(ticket.ai_regiao)}</span>` : "";
    let talhaoHtml = ticket.ai_talhao ? `<span style="display: block; font-size: 0.71rem; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="Talhão: ${escapeHtml(ticket.ai_talhao)}">${escapeHtml(ticket.ai_talhao)}</span>` : "";
    tdRegiao.innerHTML = regiaoHtml || talhaoHtml ? `${regiaoHtml}${talhaoHtml}` : `<span style="color: var(--text-muted);">-</span>`;
    row.appendChild(tdRegiao);

    // 6. Destino
    const tdDestino = document.createElement("td");
    tdDestino.style.whiteSpace = "nowrap";
    tdDestino.textContent = ticket.ai_destino || "-";
    row.appendChild(tdDestino);

    // 7. Peso Líquido (t)
    const tdPesoLiq = document.createElement("td");
    tdPesoLiq.style.textAlign = "right";
    tdPesoLiq.style.whiteSpace = "nowrap";
    if (ticket.ai_pesoliq !== null && ticket.ai_pesoliq !== undefined) {
      tdPesoLiq.innerHTML = `<span style="font-weight: 600; color: var(--accent);">${parseFloat(ticket.ai_pesoliq).toFixed(2)} t</span>`;
    } else {
      tdPesoLiq.innerHTML = `<span style="color: var(--text-muted);">-</span>`;
    }
    row.appendChild(tdPesoLiq);

    // 8. Peso Bruto (t)
    const tdPesoBruto = document.createElement("td");
    tdPesoBruto.style.textAlign = "right";
    tdPesoBruto.style.whiteSpace = "nowrap";
    if (ticket.ai_pesobruto !== null && ticket.ai_pesobruto !== undefined) {
      tdPesoBruto.innerHTML = `<span>${parseFloat(ticket.ai_pesobruto).toFixed(2)} t</span>`;
    } else {
      tdPesoBruto.innerHTML = `<span style="color: var(--text-muted);">-</span>`;
    }
    row.appendChild(tdPesoBruto);

    // 9. NF
    const tdNf = document.createElement("td");
    tdNf.style.whiteSpace = "nowrap";
    tdNf.textContent = ticket.ai_nf || "-";
    row.appendChild(tdNf);

    // 10. Origem / Fazenda
    const tdOrigem = document.createElement("td");
    tdOrigem.className = "ticket-cell-origem";
    const parts = [];
    if (ticket.origem) parts.push(escapeHtml(ticket.origem));
    if (ticket.fazenda) parts.push(`Fazenda: ${escapeHtml(ticket.fazenda)}`);
    tdOrigem.title = parts.join(" — ");
    tdOrigem.innerHTML = parts.length > 0 ? parts.join("<br>") : `<span style="color: var(--text-muted);">-</span>`;
    row.appendChild(tdOrigem);

    // 11. Parecer IA
    const tdAi = document.createElement("td");
    tdAi.style.textAlign = "center";
    if (ticket.ai_message && ticket.ai_message.trim()) {
      const btnAi = document.createElement("button");
      btnAi.className = "badge-ai";
      btnAi.title = "Visualizar parecer da IA";
      btnAi.innerHTML = `<i data-lucide="sparkles" style="width: 12px; height: 12px;"></i> <span>Parecer</span>`;
      btnAi.addEventListener("click", () => openTicketAiModal(ticket));
      tdAi.appendChild(btnAi);
    } else {
      tdAi.innerHTML = `<span style="color: var(--text-muted); font-size: 0.75rem;">-</span>`;
    }
    row.appendChild(tdAi);

    // 12. Ações
    const tdActions = document.createElement("td");
    tdActions.style.textAlign = "center";

    const divActions = document.createElement("div");
    divActions.className = "crud-action-buttons";
    divActions.style.justifyContent = "center";

    // 1. Conferir Comprovante & Editar (abre modal com visualização lado a lado)
    const btnReceipt = document.createElement("button");
    btnReceipt.className = "btn btn-sm btn-secondary";
    btnReceipt.title = "Conferir comprovante e editar dados";
    btnReceipt.style.color = "var(--accent)";
    btnReceipt.innerHTML = `<i data-lucide="image" style="width:13px;height:13px;"></i>`;
    btnReceipt.addEventListener("click", () => openTicketModal(ticket, true));

    // 2. Excluir ticket
    const btnDelete = document.createElement("button");
    btnDelete.className = "btn btn-sm btn-secondary";
    btnDelete.title = "Excluir ticket";
    btnDelete.style.color = "var(--danger)";
    btnDelete.innerHTML = `<i data-lucide="trash-2" style="width:13px;height:13px;"></i>`;
    btnDelete.addEventListener("click", () => deleteTicket(ticket.id, ticket.ai_placa, ticket.ai_processo));

    divActions.appendChild(btnReceipt);
    divActions.appendChild(btnDelete);
    tdActions.appendChild(divActions);
    row.appendChild(tdActions);

    els.crudTicketsTbody.appendChild(row);
  });

  lucide.createIcons();
}

function updateTicketsPaginationControls() {
  if (!els.ticketsPaginationInfo) return;

  const total = appState.ticketsTotalCount;
  const page = appState.ticketsPage;
  const limit = appState.ticketsPageSize;
  const totalPages = appState.ticketsTotalPages;

  if (total === 0) {
    els.ticketsPaginationInfo.textContent = "Nenhum ticket encontrado";
    if (els.btnFirstTicketsPage) els.btnFirstTicketsPage.disabled = true;
    if (els.btnPrevTicketsPage) els.btnPrevTicketsPage.disabled = true;
    if (els.btnNextTicketsPage) els.btnNextTicketsPage.disabled = true;
    if (els.btnLastTicketsPage) els.btnLastTicketsPage.disabled = true;
    return;
  }

  const start = page * limit + 1;
  const end = Math.min((page + 1) * limit, total);
  els.ticketsPaginationInfo.textContent = `Exibindo ${start}–${end} de ${total} tickets (Página ${page + 1} de ${totalPages})`;

  if (els.btnFirstTicketsPage) els.btnFirstTicketsPage.disabled = (page === 0);
  if (els.btnPrevTicketsPage) els.btnPrevTicketsPage.disabled = (page === 0);
  if (els.btnNextTicketsPage) els.btnNextTicketsPage.disabled = (page >= totalPages - 1);
  if (els.btnLastTicketsPage) els.btnLastTicketsPage.disabled = (page >= totalPages - 1);
}

async function toggleTicketApproval(id, currentApproved, placa) {
  const newStatus = !currentApproved;
  try {
    const { error } = await supabaseClient
      .from("xcvt_comprovantes")
      .update({ aprovado: newStatus })
      .eq("id", id);

    if (error) throw error;

    Toast.show(
      newStatus ? "Ticket Aprovado" : "Aprovação Revogada",
      `Ticket da placa ${placa || "sem placa"} marcado como ${newStatus ? "aprovado" : "pendente"}.`,
      newStatus ? "success" : "info"
    );

    loadTicketsData(true);
  } catch (err) {
    console.error("Erro ao alterar status de aprovação do ticket:", err);
    Toast.show("Erro ao atualizar", err.message || "Tente novamente mais tarde.", "error");
  }
}

// Image Viewer State for Ticket Florestal Modal
const ticketViewerState = {
  zoom: 1,
  panX: 0,
  panY: 0,
  rotation: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  isSplitView: true,
  currentTicketId: null,
  currentSignedUrl: null
};

function applyTicketImageTransform(withTransition = true) {
  if (!els.ticketZoomableImg) return;
  els.ticketZoomableImg.style.transition = withTransition ? "transform 0.15s cubic-bezier(0.2, 0, 0, 1)" : "none";
  els.ticketZoomableImg.style.transform = `translate(${ticketViewerState.panX}px, ${ticketViewerState.panY}px) scale(${ticketViewerState.zoom}) rotate(${ticketViewerState.rotation}deg)`;
  if (els.ticketZoomBadge) {
    els.ticketZoomBadge.textContent = `${Math.round(ticketViewerState.zoom * 100)}%`;
  }
}

function setTicketImageZoom(newZoom, withTransition = true) {
  const clamped = Math.max(0.4, Math.min(6.0, newZoom));
  ticketViewerState.zoom = Math.round(clamped * 100) / 100;
  if (ticketViewerState.zoom <= 1) {
    // Center if back to 1x or below
    ticketViewerState.panX = 0;
    ticketViewerState.panY = 0;
  }
  applyTicketImageTransform(withTransition);
}

function resetTicketImageTransform() {
  ticketViewerState.zoom = 1;
  ticketViewerState.panX = 0;
  ticketViewerState.panY = 0;
  ticketViewerState.rotation = 0;
  applyTicketImageTransform(true);
}

function rotateTicketImage() {
  ticketViewerState.rotation = (ticketViewerState.rotation + 90) % 360;
  applyTicketImageTransform(true);
}

function toggleTicketModalSplitView(forceState = null) {
  if (forceState !== null) {
    ticketViewerState.isSplitView = forceState;
  } else {
    ticketViewerState.isSplitView = !ticketViewerState.isSplitView;
  }

  if (els.ticketModalCard) {
    if (ticketViewerState.isSplitView) {
      els.ticketModalCard.classList.add("split-view");
    } else {
      els.ticketModalCard.classList.remove("split-view");
    }
  }

  if (els.btnToggleTicketImgText) {
    els.btnToggleTicketImgText.textContent = ticketViewerState.isSplitView ? "Ocultar Comprovante" : "Ver Comprovante";
  }

  if (els.btnToggleTicketImg) {
    els.btnToggleTicketImg.innerHTML = ticketViewerState.isSplitView
      ? `<i data-lucide="image-off" style="width: 14px; height: 14px;"></i> <span id="btn-toggle-ticket-img-text">Ocultar Comprovante</span>`
      : `<i data-lucide="image" style="width: 14px; height: 14px;"></i> <span id="btn-toggle-ticket-img-text">Ver Comprovante</span>`;
    lucide.createIcons();
  }

  // If opening split view and we have an active ticket whose image isn't loaded yet
  if (ticketViewerState.isSplitView && appState.activeViewingTicket) {
    if (ticketViewerState.currentTicketId !== appState.activeViewingTicket.id) {
      loadTicketImage(appState.activeViewingTicket.id);
    }
  }
}

async function loadTicketImage(ticketId) {
  if (!ticketId) return;
  ticketViewerState.currentTicketId = ticketId;
  resetTicketImageTransform();

  if (els.ticketImgLoading) els.ticketImgLoading.classList.remove("hidden");
  if (els.ticketImgError) els.ticketImgError.classList.add("hidden");
  if (els.ticketZoomableImg) {
    els.ticketZoomableImg.style.opacity = "0";
    els.ticketZoomableImg.src = "";
  }
  if (els.btnTicketOpenTab) {
    els.btnTicketOpenTab.removeAttribute("href");
  }

  try {
    const { data, error } = await supabaseClient.storage
      .from("xctv_comprovantes")
      .createSignedUrl(`${ticketId}/comprovante.jpeg`, 3600);

    if (error || !data || !data.signedUrl) {
      throw error || new Error("Comprovante não disponível no storage.");
    }

    let imgUrl = data.signedUrl;
    if (!imgUrl.startsWith("http")) {
      imgUrl = `${SUPABASE_URL}/storage/v1${imgUrl.startsWith("/") ? "" : "/"}${imgUrl}`;
    }
    ticketViewerState.currentSignedUrl = imgUrl;

    if (els.ticketZoomableImg) {
      els.ticketZoomableImg.onload = () => {
        if (ticketViewerState.currentTicketId !== ticketId) return; // Prevent race conditions
        if (els.ticketImgLoading) els.ticketImgLoading.classList.add("hidden");
        if (els.ticketImgError) els.ticketImgError.classList.add("hidden");
        els.ticketZoomableImg.style.opacity = "1";
        if (els.btnTicketOpenTab) {
          els.btnTicketOpenTab.href = imgUrl;
        }
        resetTicketImageTransform();
      };

      els.ticketZoomableImg.onerror = () => {
        if (ticketViewerState.currentTicketId !== ticketId) return;
        if (els.ticketImgLoading) els.ticketImgLoading.classList.add("hidden");
        if (els.ticketImgError) els.ticketImgError.classList.remove("hidden");
        els.ticketZoomableImg.style.opacity = "0";
      };

      els.ticketZoomableImg.src = imgUrl;
    }
  } catch (err) {
    console.warn("Não foi possível carregar o comprovante:", err);
    if (ticketViewerState.currentTicketId !== ticketId) return;
    if (els.ticketImgLoading) els.ticketImgLoading.classList.add("hidden");
    if (els.ticketImgError) els.ticketImgError.classList.remove("hidden");
    if (els.ticketZoomableImg) els.ticketZoomableImg.style.opacity = "0";
  }
}

function openTicketModal(ticket, preferImage = true) {
  if (!ticket) return;
  appState.activeViewingTicket = ticket;

  els.ticketForm.reset();
  els.ticketEditId.value = ticket.id || "";
  els.ticketModalTitle.textContent = `Avaliar & Editar Ticket — Placa ${ticket.ai_placa || "Sem Placa"}`;
  els.ticketModalSubtitle.textContent = `Processo: ${ticket.ai_processo || "-"} | ID: ${ticket.id}`;

  // AI Insights display
  if (ticket.ai_message && ticket.ai_message.trim()) {
    els.ticketAiBox.classList.remove("hidden");
    els.ticketAiText.textContent = ticket.ai_message.trim();
  } else {
    els.ticketAiBox.classList.add("hidden");
    els.ticketAiText.textContent = "";
  }

  // Populate form fields
  els.ticketEditPlaca.value = ticket.ai_placa || "";
  els.ticketEditProcesso.value = ticket.ai_processo || "";

  // Datetime-local format: YYYY-MM-DDTHH:mm
  if (ticket.ai_data) {
    try {
      const d = new Date(ticket.ai_data);
      if (!isNaN(d.getTime())) {
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
        els.ticketEditData.value = localISOTime;
      } else {
        els.ticketEditData.value = "";
      }
    } catch {
      els.ticketEditData.value = "";
    }
  } else {
    els.ticketEditData.value = "";
  }

  els.ticketEditRegiao.value = ticket.ai_regiao || "";
  els.ticketEditTalhao.value = ticket.ai_talhao || "";
  els.ticketEditDestino.value = ticket.ai_destino || "";
  els.ticketEditPesoliq.value = ticket.ai_pesoliq !== null && ticket.ai_pesoliq !== undefined ? ticket.ai_pesoliq : "";
  els.ticketEditPesobruto.value = ticket.ai_pesobruto !== null && ticket.ai_pesobruto !== undefined ? ticket.ai_pesobruto : "";
  els.ticketEditNf.value = ticket.ai_nf || "";
  els.ticketEditOrigem.value = ticket.origem || "";
  els.ticketEditFazenda.value = ticket.fazenda || "";
  els.ticketEditAprovado.checked = (ticket.aprovado === true);

  // Split view configuration & load image
  if (preferImage) {
    toggleTicketModalSplitView(true);
    loadTicketImage(ticket.id);
  } else {
    toggleTicketModalSplitView(false);
  }

  els.ticketModalBackdrop.classList.add("show");
  lucide.createIcons();
}

function closeTicketModal() {
  els.ticketModalBackdrop.classList.remove("show");
  els.ticketForm.reset();
  els.ticketEditId.value = "";
  ticketViewerState.currentTicketId = null;
  if (els.ticketZoomableImg) {
    els.ticketZoomableImg.src = "";
    els.ticketZoomableImg.style.opacity = "0";
  }
  resetTicketImageTransform();
}

async function handleTicketFormSubmit(e, autoApprove = false) {
  if (e) e.preventDefault();

  const id = els.ticketEditId.value;
  if (!id) {
    Toast.show("Erro", "ID do ticket inválido.", "error");
    return;
  }

  const placa = els.ticketEditPlaca.value.trim().toUpperCase();
  const processo = els.ticketEditProcesso.value.trim();
  const rawData = els.ticketEditData.value;
  let aiDataIso = null;
  if (rawData) {
    const d = new Date(rawData);
    if (!isNaN(d.getTime())) {
      aiDataIso = d.toISOString();
    }
  }

  const regiao = els.ticketEditRegiao.value.trim() || null;
  const talhao = els.ticketEditTalhao.value.trim() || null;
  const destino = els.ticketEditDestino.value.trim() || null;
  const pesoliq = els.ticketEditPesoliq.value !== "" ? parseFloat(els.ticketEditPesoliq.value) : null;
  const pesobruto = els.ticketEditPesobruto.value !== "" ? parseFloat(els.ticketEditPesobruto.value) : null;
  const nf = els.ticketEditNf.value.trim() || "";
  const origem = els.ticketEditOrigem.value.trim() || null;
  const fazenda = els.ticketEditFazenda.value.trim() || null;
  const aprovado = autoApprove ? true : els.ticketEditAprovado.checked;

  const updatePayload = {
    ai_placa: placa,
    ai_processo: processo,
    ai_data: aiDataIso,
    ai_regiao: regiao,
    ai_talhao: talhao,
    ai_destino: destino,
    ai_pesoliq: pesoliq,
    ai_pesobruto: pesobruto,
    ai_nf: nf,
    origem: origem,
    fazenda: fazenda,
    aprovado: aprovado
  };

  try {
    if (els.btnSaveTicket) els.btnSaveTicket.disabled = true;
    if (els.btnSaveApproveTicket) els.btnSaveApproveTicket.disabled = true;

    const { error } = await supabaseClient
      .from("xcvt_comprovantes")
      .update(updatePayload)
      .eq("id", id);

    if (error) throw error;

    Toast.show(
      aprovado ? "Ticket Aprovado com Sucesso" : "Dados Salvos com Sucesso",
      `Os dados do ticket (${placa}) foram devidamente atualizados no banco de dados.`,
      "success"
    );

    closeTicketModal();
    loadTicketsData(true);
  } catch (err) {
    console.error("Erro ao salvar ticket florestal:", err);
    Toast.show("Erro ao salvar", err.message || "Não foi possível atualizar o ticket.", "error");
  } finally {
    if (els.btnSaveTicket) els.btnSaveTicket.disabled = false;
    if (els.btnSaveApproveTicket) els.btnSaveApproveTicket.disabled = false;
  }
}

function openTicketAiModal(ticket) {
  if (!ticket) return;
  appState.activeViewingTicket = ticket;
  els.ticketAiModalSubtitle.textContent = `Placa: ${ticket.ai_placa || "-"} | Processo: ${ticket.ai_processo || "-"}`;
  els.ticketAiModalContent.textContent = ticket.ai_message && ticket.ai_message.trim()
    ? ticket.ai_message.trim()
    : "Nenhuma observação ou parecer registrado pela IA para este comprovante.";
  els.ticketAiModalBackdrop.classList.add("show");
  lucide.createIcons();
}

function closeTicketAiModal() {
  els.ticketAiModalBackdrop.classList.remove("show");
}

async function deleteTicket(id, placa, processo) {
  const confirmed = confirm(`Tem certeza que deseja excluir o registro do ticket ${processo || ""} (Placa: ${placa || ""})?\n\nEsta ação não poderá ser desfeita.`);
  if (!confirmed) return;

  try {
    const { error } = await supabaseClient
      .from("xcvt_comprovantes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    Toast.show("Registro Excluído", "O ticket foi removido do sistema.", "success");
    loadTicketsData(true);
  } catch (err) {
    console.error("Erro ao excluir ticket:", err);
    Toast.show("Erro ao excluir", err.message || "Não foi possível excluir o registro.", "error");
  }
}



