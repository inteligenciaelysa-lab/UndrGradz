/**
 * UndrGradz Admin Panel Application Controller
 * Handles SPA Routing, Data Rendering, Modals, System Health Polling, and Role Enforcement.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    currentAdmin: null,
    currentView: 'dashboard',
    usersPage: 1,
    usersTotalPages: 1,
    reportsPage: 1,
    universitiesPage: 1,
    eventsPage: 1,
    auditLogsPage: 1,
    confirmActionCallback: null,
  };

  // UI Element Selectors
  const elements = {
    loginView: document.getElementById('view-login'),
    appLayout: document.getElementById('app-layout'),
    loginForm: document.getElementById('admin-login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginSubmitBtn: document.getElementById('login-submit-btn'),
    loginSpinner: document.getElementById('login-spinner'),
    sidebarRoleBadge: document.getElementById('sidebar-role-badge'),
    sidebarToggleBtn: document.getElementById('sidebar-toggle-btn'),
    sidebarOverlay: document.getElementById('sidebar-overlay'),
    sidebar: document.querySelector('.sidebar'),
    headerAvatar: document.getElementById('header-avatar'),
    headerAdminName: document.getElementById('header-admin-name'),
    headerAdminEmail: document.getElementById('header-admin-email'),
    topUserRole: document.getElementById('top-user-role'),
    btnLogout: document.getElementById('btn-logout'),

    // Global Search
    globalSearchInput: document.getElementById('global-search-input'),
    searchResultsDropdown: document.getElementById('search-results-dropdown'),

    // Toast Container
    toastContainer: document.getElementById('toast-container'),

    // Modals
    modalOverlay: document.getElementById('modal-overlay'),
    modalBody: document.getElementById('modal-body'),
    modalCloseBtn: document.getElementById('modal-close'),
    confirmOverlay: document.getElementById('confirm-overlay'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmCancelBtn: document.getElementById('confirm-cancel-btn'),
    confirmSubmitBtn: document.getElementById('confirm-submit-btn'),

    // Nav Items
    navItems: document.querySelectorAll('.nav-item'),
    viewPanels: document.querySelectorAll('.view-panel'),
    badgePendingReports: document.getElementById('badge-pending-reports'),

    // Dashboard Elements
    statTotalUsers: document.getElementById('stat-total-users'),
    statActiveUsers: document.getElementById('stat-active-users'),
    statNewUsers: document.getElementById('stat-new-users'),
    statActiveEvents: document.getElementById('stat-active-events'),
    statMatchesLikes: document.getElementById('stat-matches-likes'),
    statPendingReports: document.getElementById('stat-pending-reports'),
    btnRefreshDashboard: document.getElementById('btn-refresh-dashboard'),
    recentActivityTbody: document.getElementById('recent-activity-tbody'),

    // Users View Elements
    usersSearchInput: document.getElementById('users-search-input'),
    usersStatusSelect: document.getElementById('users-status-select'),
    usersRoleSelect: document.getElementById('users-role-select'),
    btnFilterUsers: document.getElementById('btn-filter-users'),
    usersTbody: document.getElementById('users-tbody'),
    usersPaginationInfo: document.getElementById('users-pagination-info'),
    btnUsersPrev: document.getElementById('btn-users-prev'),
    btnUsersNext: document.getElementById('btn-users-next'),

    // Moderation View
    modStatusSelect: document.getElementById('mod-status-select'),
    modTypeSelect: document.getElementById('mod-type-select'),
    btnFilterReports: document.getElementById('btn-filter-reports'),
    reportsTbody: document.getElementById('reports-tbody'),

    // Universities View
    universitiesTbody: document.getElementById('universities-tbody'),
    btnAddUniversity: document.getElementById('btn-add-university'),

    // Events View
    eventsTbody: document.getElementById('events-tbody'),

    // Admins View
    adminsTbody: document.getElementById('admins-tbody'),
    btnAddAdmin: document.getElementById('btn-add-admin'),

    // Audit Logs View
    auditLogsTbody: document.getElementById('audit-logs-tbody'),

    // Notifications View
    formSendNotification: document.getElementById('form-send-notification'),
    notifTargetType: document.getElementById('notif-target-type'),
    notifUniGroup: document.getElementById('notif-uni-group'),
    notifUserGroup: document.getElementById('notif-user-group'),

    // Settings View
    settingsContainer: document.getElementById('settings-container'),
  };

  /* ==========================================================================
     NOTIFICATION TOAST HELPER (Zero browser alert())
     ========================================================================== */
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> <span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4000);
  }

  /* ==========================================================================
     CONFIRMATION DIALOG HELPER (Zero browser confirm())
     ========================================================================== */
  function showConfirmDialog(title, message, onConfirm) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    state.confirmActionCallback = onConfirm;
    elements.confirmOverlay.classList.remove('hidden');
  }

  elements.confirmCancelBtn.addEventListener('click', () => {
    elements.confirmOverlay.classList.add('hidden');
    state.confirmActionCallback = null;
  });

  elements.confirmSubmitBtn.addEventListener('click', async () => {
    if (state.confirmActionCallback) {
      const callback = state.confirmActionCallback;
      elements.confirmOverlay.classList.add('hidden');
      state.confirmActionCallback = null;
      await callback();
    }
  });

  /* ==========================================================================
     MODAL UTILITIES
     ========================================================================== */
  function openModal(contentHtml) {
    elements.modalBody.innerHTML = contentHtml;
    elements.modalOverlay.classList.remove('hidden');
  }

  function closeModal() {
    elements.modalOverlay.classList.add('hidden');
    elements.modalBody.innerHTML = '';
  }

  elements.modalCloseBtn.addEventListener('click', closeModal);
  elements.modalOverlay.addEventListener('click', (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  });

  /* ==========================================================================
     INITIALIZATION & AUTH FLOW
     ========================================================================== */
  function initApp() {
    const token = window.adminApi.getToken();
    const admin = window.adminApi.getAdminUser();

    if (token && admin) {
      state.currentAdmin = admin;
      showAppLayout();
    } else {
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    elements.loginView.classList.remove('hidden');
    elements.appLayout.classList.add('hidden');
  }

  function showAppLayout() {
    elements.loginView.classList.add('hidden');
    elements.appLayout.classList.remove('hidden');

    // Set User Profile in Sidebar & Header
    const name = `${state.currentAdmin.firstName || ''} ${state.currentAdmin.lastName || ''}`.trim() || state.currentAdmin.email;
    elements.headerAdminName.textContent = name;
    elements.headerAdminEmail.textContent = state.currentAdmin.email;
    elements.headerAvatar.textContent = (state.currentAdmin.firstName || state.currentAdmin.email)[0].toUpperCase();
    
    elements.sidebarRoleBadge.textContent = state.currentAdmin.role;
    elements.topUserRole.textContent = state.currentAdmin.role.replace('_', ' ');

    // Apply Role-Based Restrictions
    enforceRoleRestrictions(state.currentAdmin.role);

    // Restore initial view from URL hash or default to 'dashboard'
    const initialView = window.location.hash.replace('#', '') || 'dashboard';
    switchView(initialView);

    // Start System Health Polling (Every 15s)
    startHealthPolling();
  }

  function enforceRoleRestrictions(role) {
    const superAdminElements = document.querySelectorAll('.super-admin-only');
    const adminElements = document.querySelectorAll('.admin-only');

    if (role !== 'SUPER_ADMIN') {
      superAdminElements.forEach(el => el.classList.add('hidden'));
    } else {
      superAdminElements.forEach(el => el.classList.remove('hidden'));
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      adminElements.forEach(el => el.classList.add('hidden'));
    } else {
      adminElements.forEach(el => el.classList.remove('hidden'));
    }
  }

  // Handle Login Submit
  elements.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = elements.loginEmail.value.trim();
    const password = elements.loginPassword.value;

    try {
      elements.loginSubmitBtn.disabled = true;
      elements.loginSpinner.classList.remove('hidden');

      const res = await window.adminApi.login(email, password);
      showToast(`¡Bienvenido al Panel, ${res.data.adminUser.firstName}!`);
      state.currentAdmin = res.data.adminUser;
      showAppLayout();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      elements.loginSubmitBtn.disabled = false;
      elements.loginSpinner.classList.add('hidden');
    }
  });

  // Handle Logout
  elements.btnLogout.addEventListener('click', () => {
    showConfirmDialog('Cerrar Sesión', '¿Estás seguro de que deseas salir del panel de administración?', () => {
      window.adminApi.logout();
      state.currentAdmin = null;
      showToast('Sesión cerrada correctamente');
      showLoginScreen();
    });
  });

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /* ==========================================================================
     MOBILE SIDEBAR TOGGLE & NAVIGATION
     ========================================================================== */
  if (elements.sidebarToggleBtn) {
    elements.sidebarToggleBtn.addEventListener('click', () => {
      if (elements.sidebar) elements.sidebar.classList.toggle('open');
      if (elements.sidebarOverlay) elements.sidebarOverlay.classList.toggle('hidden');
    });
  }

  if (elements.sidebarOverlay) {
    elements.sidebarOverlay.addEventListener('click', () => {
      if (elements.sidebar) elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.add('hidden');
    });
  }

  /* ==========================================================================
     ROUTING & NAVIGATION (URL Hash Syncing & Page Reload Persistence)
     ========================================================================== */
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);

      // Auto close mobile sidebar after item click
      if (window.innerWidth <= 1024) {
        if (elements.sidebar) elements.sidebar.classList.remove('open');
        if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add('hidden');
      }
    });
  });

  window.addEventListener('hashchange', () => {
    const viewFromHash = window.location.hash.replace('#', '');
    if (viewFromHash && state.currentAdmin && state.currentView !== viewFromHash) {
      switchView(viewFromHash);
    }
  });

  function switchView(viewName) {
    state.currentView = viewName;

    // Sync URL hash without reloading page
    if (window.location.hash !== `#${viewName}`) {
      window.history.pushState(null, '', `#${viewName}`);
    }

    // Update active nav links
    elements.navItems.forEach(item => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Update visible view panels
    elements.viewPanels.forEach(panel => {
      if (panel.id === `view-${viewName}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Load data for active view
    switch (viewName) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'analytics':
        loadAnalyticsView();
        break;
      case 'verifications':
        loadVerificationsView();
        break;
      case 'verification-requests':
        loadVerificationRequestsView();
        break;
      case 'users':
        loadUsers();
        break;
      case 'moderation':
        loadModeration();
        break;
      case 'universities':
        loadUniversities();
        break;
      case 'events':
        loadEvents();
        break;
      case 'administrators':
        loadAdministrators();
        break;
      case 'audit-logs':
        loadAuditLogs();
        break;
      case 'notifications':
        // Ready form
        break;
      case 'settings':
        loadSettings();
        break;
    }
  }

  /* ==========================================================================
     GLOBAL MULTI-ENTITY SEARCH
     ========================================================================== */
  let searchTimeout = null;
  elements.globalSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 2) {
      elements.searchResultsDropdown.classList.add('hidden');
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const res = await window.adminApi.globalSearch(query);
        renderGlobalSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  });

  function renderGlobalSearchResults(results) {
    const { users, universities, events, reports } = results;
    let html = '';

    if (users.length === 0 && universities.length === 0 && events.length === 0 && reports.length === 0) {
      html = '<div class="p-3 text-muted text-center font-size-12">No se encontraron resultados.</div>';
    } else {
      if (users.length > 0) {
        html += '<div class="search-category-title">👤 Usuarios</div>';
        users.forEach(u => {
          html += `
            <div class="search-item" onclick="viewUserDetail('${u.id}')">
              <span><strong>${u.firstName} ${u.lastName}</strong> (@${u.handle || 'no-handle'})</span>
              <span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span>
            </div>
          `;
        });
      }
      if (universities.length > 0) {
        html += '<div class="search-category-title">🎓 Universidades</div>';
        universities.forEach(u => {
          html += `
            <div class="search-item" onclick="switchView('universities')">
              <span><strong>${u.name}</strong> (${u.code})</span>
            </div>
          `;
        });
      }
      if (events.length > 0) {
        html += '<div class="search-category-title">🔥 Eventos</div>';
        events.forEach(e => {
          html += `
            <div class="search-item" onclick="switchView('events')">
              <span>${e.emoji} <strong>${e.name}</strong> (${e.section})</span>
            </div>
          `;
        });
      }
    }

    elements.searchResultsDropdown.innerHTML = html;
    elements.searchResultsDropdown.classList.remove('hidden');
  }

  document.addEventListener('click', (e) => {
    if (!elements.globalSearchInput.contains(e.target) && !elements.searchResultsDropdown.contains(e.target)) {
      elements.searchResultsDropdown.classList.add('hidden');
    }
  });

  /* ==========================================================================
     1. DASHBOARD CONTROLLER & SYSTEM HEALTH
     ========================================================================== */
  async function loadDashboard() {
    try {
      const res = await window.adminApi.getDashboard();
      const { metrics, usersByUniversity, recentActivity, systemHealth } = res.data;

      // Render Stat Cards
      elements.statTotalUsers.textContent = metrics.totalUsers.toLocaleString();
      elements.statActiveUsers.textContent = metrics.activeUsers.toLocaleString();
      elements.statNewUsers.textContent = metrics.newUsers.toLocaleString();
      elements.statActiveEvents.textContent = metrics.activeEvents.toLocaleString();
      elements.statMatchesLikes.textContent = `${metrics.totalMatches.toLocaleString()} / ${metrics.totalLikes.toLocaleString()}`;
      elements.statPendingReports.textContent = metrics.pendingReports.toLocaleString();

      if (metrics.pendingReports > 0) {
        elements.badgePendingReports.textContent = metrics.pendingReports;
        elements.badgePendingReports.classList.remove('hidden');
      } else {
        elements.badgePendingReports.classList.add('hidden');
      }

      // Render Alert Banner & Badges
      const pendingVerif = metrics.pendingVerifications || 0;
      const pendingReports = metrics.pendingReports || 0;

      const alertBanner = document.getElementById('dashboard-alert-banner');
      if (pendingVerif > 0 || pendingReports > 0) {
        if (alertBanner) {
          alertBanner.classList.remove('hidden');
          const alertTitle = document.getElementById('alert-banner-title');
          const alertDesc = document.getElementById('alert-banner-desc');
          const alertBtn = document.getElementById('alert-banner-action-btn');

          if (alertTitle) alertTitle.textContent = `Atención Requerida: ${pendingVerif + pendingReports} elemento(s) pendiente(s)`;
          if (alertDesc) alertDesc.textContent = `${pendingVerif} solicitud(es) de verificación y ${pendingReports} reporte(s) de moderación están esperando revisión.`;
          if (alertBtn) {
            alertBtn.onclick = () => {
              if (pendingVerif > 0) switchView('verifications');
              else switchView('moderation');
            };
          }
        }
      } else if (alertBanner) {
        alertBanner.classList.add('hidden');
      }

      const verifBadge = document.getElementById('quick-badge-verif');
      if (verifBadge) {
        if (pendingVerif > 0) {
          verifBadge.textContent = pendingVerif;
          verifBadge.classList.remove('hidden');
        } else verifBadge.classList.add('hidden');
      }

      const reportsBadge = document.getElementById('quick-badge-reports');
      if (reportsBadge) {
        if (pendingReports > 0) {
          reportsBadge.textContent = pendingReports;
          reportsBadge.classList.remove('hidden');
        } else reportsBadge.classList.add('hidden');
      }

      // Quick action button handlers
      document.getElementById('quick-btn-notif')?.addEventListener('click', () => switchView('notifications'));
      document.getElementById('quick-btn-verif')?.addEventListener('click', () => switchView('verifications'));
      document.getElementById('quick-btn-reports')?.addEventListener('click', () => switchView('moderation'));

      // Render Health Metrics
      updateSystemHealthUI(systemHealth, metrics);

      // Render University Distribution Breakdown List
      renderUniversityProgressList(usersByUniversity);

      // Render Recent Activity & Students Feed
      renderRecentActivity(recentActivity);
      renderRecentStudents(recentActivity ? recentActivity.recentUsers : []);
    } catch (err) {
      showToast('Error cargando el dashboard: ' + err.message, 'error');
    }
  }

  elements.btnRefreshDashboard.addEventListener('click', loadDashboard);

  function updateSystemHealthUI(health, metrics = {}) {
    if (!health) return;
    document.getElementById('health-backend-uptime').textContent = `${Math.floor(health.backend.uptimeSeconds / 60)}m ${health.backend.uptimeSeconds % 60}s`;
    document.getElementById('health-db-latency').textContent = `${health.database.latencyMs} ms (${health.database.status})`;
    document.getElementById('health-socket-clients').textContent = `${health.socketIo.connectedClients} cliente(s)`;
    document.getElementById('health-memory').textContent = `${health.serverResources.memory.heapUsedMb} MB / ${health.serverResources.memory.heapTotalMb} MB (${health.serverResources.memory.memoryUsagePercent}%)`;
    document.getElementById('health-cpu').textContent = `${health.serverResources.cpu.cores} cores (${health.serverResources.cpu.loadAvg.join(', ')})`;
    const adminSessionsEl = document.getElementById('health-admin-sessions');
    if (adminSessionsEl) {
      adminSessionsEl.textContent = `${metrics.activeAdminSessionsCount || 1} sesión(es) activa(s)`;
    }
  }

  function startHealthPolling() {
    setInterval(async () => {
      if (state.currentView === 'dashboard') {
        try {
          const res = await window.adminApi.getDashboard();
          updateSystemHealthUI(res.data.systemHealth, res.data.metrics);
        } catch (e) {}
      }
    }, 15000);
  }

  function renderUniversityProgressList(data) {
    const container = document.getElementById('dashboard-uni-list');
    if (!container) return;

    if (!data || data.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-muted text-sm">No hay datos suficientes de universidades.</div>';
      return;
    }

    const colors = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4'];
    const maxCount = Math.max(...data.map(d => d.count), 1);

    let html = '';
    data.slice(0, 8).forEach((item, idx) => {
      const color = colors[idx % colors.length];
      const acronym = escapeHtml(item.acronym || item.name || 'UNI');
      const fullName = escapeHtml(item.fullName || item.name);
      const count = item.count || 0;
      const percent = item.percent || ((count / maxCount) * 100).toFixed(1);
      const barWidth = Math.max((count / maxCount) * 100, 3);

      html += `
        <div class="uni-item-row" title="${fullName}: ${count} estudiantes (${percent}%)">
          <div class="uni-item-header">
            <span class="uni-badge-acronym" style="background: ${color};">${acronym}</span>
            <span class="uni-fullname">${fullName}</span>
            <span class="uni-count-badge">${count} estudiantes (${percent}%)</span>
          </div>
          <div class="uni-progress-track">
            <div class="uni-progress-fill" style="width: ${barWidth}%; background: linear-gradient(90deg, ${color} 0%, #ec4899 100%);"></div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderRecentStudents(users) {
    const container = document.getElementById('recent-students-feed');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = '<div class="text-center py-4 text-muted text-sm">No hay nuevos estudiantes registrados.</div>';
      return;
    }

    let html = '';
    users.slice(0, 6).forEach(u => {
      const name = escapeHtml(`${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email);
      const handle = escapeHtml(`@${u.handle || 'estudiante'}`);
      const uni = escapeHtml(u.profile?.university || 'UndrGradz');
      const initial = name[0] ? name[0].toUpperCase() : 'U';
      const dateStr = new Date(u.createdAt).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="student-feed-item">
          <div class="student-feed-avatar">${initial}</div>
          <div class="student-feed-info">
            <span class="student-feed-name">${name}</span>
            <span class="student-feed-meta">${handle} • ${uni} • ${dateStr}</span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderRecentActivity({ recentUsers, recentReports, recentAuditLogs }) {
    let html = '';
    const items = [];

    (recentAuditLogs || []).forEach(log => {
      let formattedDetails = '';
      if (log.details && typeof log.details === 'object') {
        const entries = Object.entries(log.details);
        if (entries.length > 0) {
          formattedDetails = entries.map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
        } else {
          formattedDetails = '-';
        }
      } else {
        formattedDetails = log.details || '-';
      }

      items.push({
        user: log.admin ? `${log.admin.firstName || ''} ${log.admin.lastName || ''}`.trim() + ` (${log.admin.role || 'ADMIN'})` : 'Sistema',
        action: log.action || 'AUDIT_LOG',
        details: formattedDetails,
        fullDetails: JSON.stringify(log.details || {}),
        time: new Date(log.createdAt),
      });
    });

    (recentUsers || []).forEach(u => {
      items.push({
        user: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        action: 'NUEVO_REGISTRO',
        details: `@${u.handle || 'sin-handle'}`,
        fullDetails: `Email: ${u.email}`,
        time: new Date(u.createdAt),
      });
    });

    items.sort((a, b) => b.time - a.time);

    if (items.length === 0) {
      html = '<tr><td colspan="4" class="text-center py-4">No hay actividad reciente registrada.</td></tr>';
    } else {
      items.slice(0, 10).forEach(item => {
        html += `
          <tr>
            <td><strong>${escapeHtml(item.user)}</strong></td>
            <td><span class="role-badge role-admin">${escapeHtml(item.action)}</span></td>
            <td><div class="cell-details-trunc" title="${escapeHtml(item.fullDetails)}">${escapeHtml(item.details)}</div></td>
            <td class="text-nowrap">${item.time.toLocaleString()}</td>
          </tr>
        `;
      });
    }

    elements.recentActivityTbody.innerHTML = html;
  }

  /* ==========================================================================
     2. USERS MANAGEMENT CONTROLLER
     ========================================================================== */
  async function loadUsers() {
    const search = elements.usersSearchInput.value.trim();
    const status = elements.usersStatusSelect.value;
    const role = elements.usersRoleSelect.value;

    try {
      elements.usersTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Cargando usuarios...</td></tr>';
      const res = await window.adminApi.getUsers({
        search,
        status,
        role,
        page: state.usersPage,
        limit: 15,
      });

      const { users, total, totalPages, page } = res.data;
      state.usersTotalPages = totalPages;

      renderUsersTable(users);
      elements.usersPaginationInfo.textContent = `Mostrando pág. ${page} de ${totalPages} (${total} usuarios totales)`;
      elements.btnUsersPrev.disabled = page <= 1;
      elements.btnUsersNext.disabled = page >= totalPages;
    } catch (err) {
      showToast('Error al cargar usuarios: ' + err.message, 'error');
    }
  }

  elements.btnFilterUsers.addEventListener('click', () => {
    state.usersPage = 1;
    loadUsers();
  });

  elements.btnUsersPrev.addEventListener('click', () => {
    if (state.usersPage > 1) {
      state.usersPage--;
      loadUsers();
    }
  });

  elements.btnUsersNext.addEventListener('click', () => {
    if (state.usersPage < state.usersTotalPages) {
      state.usersPage++;
      loadUsers();
    }
  });

  function renderUsersTable(users) {
    if (!users || users.length === 0) {
      elements.usersTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No se encontraron usuarios.</td></tr>';
      return;
    }

    let html = '';
    users.forEach(u => {
      const photoUrl = u.photos && u.photos.length > 0 ? u.photos[0].url : null;
      const avatarHtml = photoUrl
        ? `<img src="${photoUrl}" class="admin-avatar" style="object-fit:cover;">`
        : `<div class="admin-avatar">${u.firstName[0]}</div>`;

      html += `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              ${avatarHtml}
              <div>
                <strong>${u.firstName} ${u.lastName}</strong><br>
                <span style="font-size:11px; color:var(--text-muted);">@${u.handle || 'no-handle'} • ${u.email}</span>
              </div>
            </div>
          </td>
          <td>${u.profile?.university || 'No especificada'}</td>
          <td><span class="role-badge role-${u.role.toLowerCase()}">${u.role}</span></td>
          <td><span class="status-badge badge-${u.status.toLowerCase()}">${u.status}</span></td>
          <td>${u.profile?.subscriptionTier || 'FREE'}</td>
          <td>${new Date(u.createdAt).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="viewUserDetail('${u.id}')">👁️ Perfil</button>
          </td>
        </tr>
      `;
    });

    elements.usersTbody.innerHTML = html;
  }

  // Global user inspection window
  window.viewUserDetail = async (userId) => {
    try {
      const res = await window.adminApi.getUserDetails(userId);
      const user = res.data.user;

      const photosHtml = (user.photos || []).map(p => `
        <div style="position:relative;">
          <img src="${p.url}" style="width:90px; height:110px; object-fit:cover; border-radius:8px;">
          <button class="btn btn-danger btn-sm" style="position:absolute; top:4px; right:4px; padding:2px 6px;" onclick="deletePhoto('${p.id}', '${user.id}')">🗑️</button>
        </div>
      `).join('');

      const modalHtml = `
        <h2 style="margin-bottom:16px;">Perfil de Usuario: ${user.firstName} ${user.lastName}</h2>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-bottom:20px;">
          <div>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Handle:</strong> @${user.handle || 'sin-handle'}</p>
            <p><strong>Teléfono:</strong> ${user.phone || 'No registrado'}</p>
            <p><strong>Universidad:</strong> ${user.profile?.university || 'No asignada'}</p>
            <p><strong>Carrera:</strong> ${user.profile?.major || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Rol:</strong> <span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></p>
            <p><strong>Estado:</strong> <span class="status-badge badge-${user.status.toLowerCase()}">${user.status}</span></p>
            <p><strong>Likes Enviados:</strong> ${user.stats.sentSwipesCount}</p>
            <p><strong>Matches Totales:</strong> ${user.stats.matchesCount}</p>
            <p><strong>Reportes Recibidos:</strong> ${user.stats.reportsReceivedCount}</p>
          </div>
        </div>

        <h4 style="margin-bottom:8px;">Fotografías del Perfil</h4>
        <div style="display:flex; gap:10px; margin-bottom:20px; flex-wrap:wrap;">
          ${photosHtml || '<p class="text-muted">Sin fotografías subidas.</p>'}
        </div>

        <h4 style="margin-bottom:12px;">Acciones de Administración</h4>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn btn-warning btn-sm" onclick="promptSuspendUser('${user.id}')">⏸️ Suspender</button>
          <button class="btn btn-danger btn-sm" onclick="promptBanUser('${user.id}')">🚫 Banear</button>
          <button class="btn btn-primary btn-sm" onclick="reactivateUser('${user.id}')">✅ Reactivar</button>
          ${state.currentAdmin.role === 'SUPER_ADMIN' ? `<button class="btn btn-danger btn-sm" onclick="softDeleteUser('${user.id}')">🗑️ Eliminar (Soft Delete)</button>` : ''}
        </div>
      `;

      openModal(modalHtml);
    } catch (err) {
      showToast('Error cargando detalles: ' + err.message, 'error');
    }
  };

  window.deletePhoto = (photoId, userId) => {
    showConfirmDialog('Eliminar Fotografía', '¿Estás seguro de eliminar esta foto del perfil del usuario?', async () => {
      try {
        await window.adminApi.deletePhoto(photoId);
        showToast('Foto eliminada correctamente');
        window.viewUserDetail(userId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  window.promptSuspendUser = (userId) => {
    closeModal();
    showConfirmDialog('Suspender Usuario', '¿Confirmas la suspensión de esta cuenta?', async () => {
      try {
        await window.adminApi.updateUserStatus(userId, { status: 'SUSPENDED', reason: 'Suspendido por administración', durationDays: 7 });
        showToast('Usuario suspendido por 7 días');
        loadUsers();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  window.promptBanUser = (userId) => {
    closeModal();
    showConfirmDialog('Banear Usuario', '¿Confirmas el baneamiento permanente de esta cuenta?', async () => {
      try {
        await window.adminApi.updateUserStatus(userId, { status: 'BANNED', reason: 'Baneado por violación de términos' });
        showToast('Usuario baneado permanentemente');
        loadUsers();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  window.reactivateUser = async (userId) => {
    try {
      await window.adminApi.updateUserStatus(userId, { status: 'ACTIVE' });
      showToast('Cuenta de usuario reactivada correctamente');
      closeModal();
      loadUsers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.softDeleteUser = (userId) => {
    closeModal();
    showConfirmDialog('Eliminación Lógica de Usuario', '¿Confirmas eliminar esta cuenta? Los datos y relaciones históricas se conservarán para auditoría.', async () => {
      try {
        await window.adminApi.softDeleteUser(userId);
        showToast('Usuario eliminado (Soft Delete) correctamente');
        loadUsers();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  /* ==========================================================================
     3. MODERATION CONTROLLER
     ========================================================================== */
  async function loadModeration() {
    const status = elements.modStatusSelect.value;
    const targetType = elements.modTypeSelect.value;

    try {
      elements.reportsTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Cargando reportes...</td></tr>';
      const res = await window.adminApi.getReports({ status, targetType });
      const reports = res.data.reports;

      if (!reports || reports.length === 0) {
        elements.reportsTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay reportes de moderación pendientes.</td></tr>';
        return;
      }

      let html = '';
      reports.forEach(r => {
        const reporterName = r.reporter ? `${r.reporter.firstName} ${r.reporter.lastName}` : 'Anónimo';
        html += `
          <tr>
            <td><strong>${reporterName}</strong></td>
            <td><span class="role-badge role-moderator">${r.targetType}</span></td>
            <td><strong>${r.reason}</strong></td>
            <td>${r.details || 'Sin detalles adicionales'}</td>
            <td><span class="status-badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
            <td>${new Date(r.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-primary btn-sm" onclick="inspectReport('${r.id}', '${r.targetUserId || ''}', '${r.targetType}')">🔍 Revisar</button>
            </td>
          </tr>
        `;
      });

      elements.reportsTbody.innerHTML = html;
    } catch (err) {
      showToast('Error en moderación: ' + err.message, 'error');
    }
  }

  elements.btnFilterReports.addEventListener('click', loadModeration);

  window.inspectReport = (reportId, targetUserId, targetType) => {
    const modalHtml = `
      <h2>Revisión de Reporte #${reportId.substring(0, 8)}</h2>
      <p style="margin-bottom:16px;">Analiza el contexto y selecciona la resolución correspondiente.</p>
      
      <div class="form-group">
        <label>Notas Internas de Moderación</label>
        <textarea id="mod-notes" class="form-input" rows="3" placeholder="Escribe tus observaciones de moderación..."></textarea>
      </div>

      <div class="form-group">
        <label>Acción sobre el Usuario o Contenido</label>
        <select id="mod-user-action" class="form-select">
          <option value="NONE">Sin acción adicional</option>
          <option value="SUSPENDED">Suspender Usuario por 7 días</option>
          <option value="BANNED">Banear Usuario Permanentemente</option>
          <option value="HIDE_EVENT">Ocultar Evento Reportado</option>
        </select>
      </div>

      <div style="display:flex; gap:10px; margin-top:20px;">
        <button class="btn btn-primary" onclick="submitReportResolution('${reportId}', 'RESOLVED')">✅ Aprobar / Resolver Reporte</button>
        <button class="btn btn-secondary" onclick="submitReportResolution('${reportId}', 'DISMISSED')">❌ Desestimar Reporte</button>
      </div>
    `;

    openModal(modalHtml);
  };

  window.submitReportResolution = async (reportId, status) => {
    const notes = document.getElementById('mod-notes').value;
    const userAction = document.getElementById('mod-user-action').value;

    try {
      await window.adminApi.resolveReport(reportId, {
        status,
        resolutionNotes: notes,
        userAction: userAction !== 'NONE' ? userAction : null,
        durationDays: 7,
      });
      showToast(`Reporte marcado como ${status}`);
      closeModal();
      loadModeration();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  /* ==========================================================================
     4. UNIVERSITIES CONTROLLER
     ========================================================================== */
  const uniFilterState = {
    page: 1,
    limit: 20,
    search: '',
    type: '',
    status: '',
    isOfficial: '',
    location: '',
    isDeleted: false,
  };

  let uniDebounceTimer = null;
  let uniLocationDebounceTimer = null;

  const uniSearchInput = document.getElementById('uni-search-input');
  const uniTypeSelect = document.getElementById('uni-type-select');
  const uniStatusSelect = document.getElementById('uni-status-select');
  const uniOfficialSelect = document.getElementById('uni-official-select');
  const uniLocationInput = document.getElementById('uni-location-input');
  const uniDeletedCheckbox = document.getElementById('uni-deleted-checkbox');
  const btnFilterUniversities = document.getElementById('btn-filter-universities');
  const uniPrevPageBtn = document.getElementById('uni-prev-page');
  const uniNextPageBtn = document.getElementById('uni-next-page');
  const uniPaginationInfo = document.getElementById('uni-pagination-info');
  const uniCurrentPageBadge = document.getElementById('uni-current-page-badge');

  if (uniSearchInput) {
    uniSearchInput.addEventListener('input', (e) => {
      clearTimeout(uniDebounceTimer);
      uniDebounceTimer = setTimeout(() => {
        uniFilterState.search = e.target.value;
        uniFilterState.page = 1;
        loadUniversities();
      }, 300);
    });
  }

  if (uniLocationInput) {
    uniLocationInput.addEventListener('input', (e) => {
      clearTimeout(uniLocationDebounceTimer);
      uniLocationDebounceTimer = setTimeout(() => {
        uniFilterState.location = e.target.value;
        uniFilterState.page = 1;
        loadUniversities();
      }, 300);
    });
  }

  if (uniTypeSelect) {
    uniTypeSelect.addEventListener('change', (e) => {
      uniFilterState.type = e.target.value;
      uniFilterState.page = 1;
      loadUniversities();
    });
  }

  if (uniStatusSelect) {
    uniStatusSelect.addEventListener('change', (e) => {
      uniFilterState.status = e.target.value;
      uniFilterState.page = 1;
      loadUniversities();
    });
  }

  if (uniOfficialSelect) {
    uniOfficialSelect.addEventListener('change', (e) => {
      uniFilterState.isOfficial = e.target.value;
      uniFilterState.page = 1;
      loadUniversities();
    });
  }

  if (uniDeletedCheckbox) {
    uniDeletedCheckbox.addEventListener('change', (e) => {
      uniFilterState.isDeleted = e.target.checked;
      uniFilterState.page = 1;
      loadUniversities();
    });
  }

  if (btnFilterUniversities) {
    btnFilterUniversities.addEventListener('click', () => {
      uniFilterState.page = 1;
      loadUniversities();
    });
  }

  if (uniPrevPageBtn) {
    uniPrevPageBtn.addEventListener('click', () => {
      if (uniFilterState.page > 1) {
        uniFilterState.page--;
        loadUniversities();
      }
    });
  }

  if (uniNextPageBtn) {
    uniNextPageBtn.addEventListener('click', () => {
      uniFilterState.page++;
      loadUniversities();
    });
  }

  async function loadUniversities() {
    try {
      elements.universitiesTbody.innerHTML = '<tr><td colspan="10" class="text-center py-4">Cargando universidades...</td></tr>';
      
      const params = {
        page: uniFilterState.page,
        limit: uniFilterState.limit,
        search: uniFilterState.search,
        type: uniFilterState.type,
        status: uniFilterState.status,
        isOfficial: uniFilterState.isOfficial,
        country: uniFilterState.location,
        isDeleted: uniFilterState.isDeleted ? 'true' : 'false',
      };

      const res = await window.adminApi.getUniversities(params);
      const { universities, pagination } = res.data;

      if (!universities || universities.length === 0) {
        elements.universitiesTbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">No se encontraron universidades.</td></tr>';
        if (uniPaginationInfo) uniPaginationInfo.textContent = 'Mostrando 0 de 0 universidades';
        if (uniPrevPageBtn) uniPrevPageBtn.disabled = true;
        if (uniNextPageBtn) uniNextPageBtn.disabled = true;
        return;
      }

      // Render Table Rows
      let html = '';
      universities.forEach(u => {
        const pColor = u.primaryColor || '#6366f1';
        const sColor = u.secondaryColor || '#ec4899';

        const officialBadge = u.isOfficial
          ? '<span class="status-badge badge-active">Verificada</span>'
          : '<span class="status-badge badge-suspended">Estándar</span>';

        let statusClass = 'suspended';
        if (u.status === 'INTEGRATED' || u.status === 'AVAILABLE') statusClass = 'active';
        if (u.status === 'PENDING') statusClass = 'warning';

        const statusBadge = u.isDeleted
          ? '<span class="status-badge badge-deleted">ELIMINADA</span>'
          : `<span class="status-badge badge-${statusClass}">${u.status}</span>`;

        const typeBadge = u.type === 'private'
          ? '<span class="role-badge role-moderator">Privada</span>'
          : '<span class="role-badge role-admin">Pública</span>';

        const websiteLink = u.website
          ? `<a href="${u.website}" target="_blank" rel="noopener" style="color:var(--accent-primary); text-decoration:none; font-size:12px;">🔗 Web</a>`
          : '<span class="text-muted">-</span>';

        const locationText = [u.city, u.state, u.country].filter(Boolean).join(', ') || 'No especificada';

        html += `
          <tr class="${u.isDeleted ? 'opacity-75' : ''}">
            <td>
              <strong>${u.name}</strong><br>
              <small class="text-muted"><code>${u.domain}</code></small>
            </td>
            <td><code>${u.acronym}</code></td>
            <td>${typeBadge}</td>
            <td><small style="color:var(--text-secondary);">${locationText}</small></td>
            <td>
              <div class="color-swatch-pair" title="Primario: ${pColor} / Secundario: ${sColor}">
                <span class="color-circle" style="background:${pColor};"></span>
                <span class="color-circle" style="background:${sColor};"></span>
              </div>
            </td>
            <td>${websiteLink}</td>
            <td><strong>${u.studentCount}</strong></td>
            <td>${officialBadge}</td>
            <td>${statusBadge}</td>
            <td>
              <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button class="btn btn-secondary btn-sm" onclick="editUniversityModal('${u.id}')">✏️ Editar</button>
                <button class="btn btn-secondary btn-sm" onclick="openCampusModal('${u.id}', '${u.name.replace(/'/g, "\\'")}')">🏫 Campus</button>
                ${u.isDeleted
                  ? `<button class="btn btn-restore btn-sm" onclick="promptRestoreUni('${u.id}', '${u.name.replace(/'/g, "\\'")}')">🔄 Restaurar</button>`
                  : `<button class="btn btn-danger btn-sm" onclick="promptSoftDeleteUni('${u.id}', '${u.name.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>`
                }
              </div>
            </td>
          </tr>
        `;
      });

      elements.universitiesTbody.innerHTML = html;

      // Update Pagination UI
      if (uniPaginationInfo) {
        const start = (pagination.page - 1) * pagination.limit + 1;
        const end = Math.min(pagination.total, pagination.page * pagination.limit);
        uniPaginationInfo.textContent = `Mostrando ${start}-${end} de ${pagination.total.toLocaleString()} universidades`;
      }
      if (uniCurrentPageBadge) {
        uniCurrentPageBadge.textContent = `Página ${pagination.page} de ${pagination.totalPages || 1}`;
      }
      if (uniPrevPageBtn) uniPrevPageBtn.disabled = pagination.page <= 1;
      if (uniNextPageBtn) uniNextPageBtn.disabled = pagination.page >= pagination.totalPages;

    } catch (err) {
      showToast('Error cargando universidades: ' + err.message, 'error');
    }
  }

  /**
   * Wires a País → Estado → Ciudad cascading select trio. Shared between the
   * University modal and the Campus modal so the cascade logic exists once.
   *
   * Existing DB values are free-typed strings collected over time — if one
   * doesn't match the geo library's canonical name, the select simply renders
   * unselected rather than guessing. A `touched` flag (only set by real user
   * interaction, never by the programmatic pre-select) makes sure that if the
   * admin never opens a given dropdown, the original stored string is what
   * gets submitted — nothing is silently overwritten with an empty value.
   *
   * @returns {{getValues:()=>{country,state,city}}}
   */
  function wireGeoCascade({ countrySel, stateSel, citySel, initialCountry, initialState, initialCity }) {
    const touched = { country: false, state: false, city: false };
    const original = { country: initialCountry || '', state: initialState || '', city: initialCity || '' };

    function fillOptions(sel, items, placeholder) {
      sel.innerHTML = `<option value="">${placeholder}</option>` +
        items.map(it => `<option value="${it.name.replace(/"/g, '&quot;')}" data-code="${it.isoCode || ''}">${it.name}</option>`).join('');
    }

    // Historical values were typed freely over the years and rarely match the
    // geo library's formal names exactly (e.g. stored "Coahuila" vs the
    // library's "Coahuila de Zaragoza"). Try an exact match first, then fall
    // back to a prefix match in either direction — common for Mexican states
    // that carry a historical suffix. Still deliberately conservative: if
    // nothing reasonably matches, the select stays empty rather than guessing.
    function findBestMatch(items, storedName) {
      if (!storedName) return null;
      const needle = storedName.toLowerCase();
      const exact = items.find(it => it.name.toLowerCase() === needle);
      if (exact) return exact;
      return items.find(it => {
        const hay = it.name.toLowerCase();
        return hay.startsWith(needle) || needle.startsWith(hay);
      }) || null;
    }

    async function loadCountries() {
      fillOptions(countrySel, [], 'Cargando…');
      try {
        const res = await window.adminApi.getGeoCountries();
        fillOptions(countrySel, res.data.countries, 'Selecciona un país…');
        if (original.country) {
          const match = findBestMatch(res.data.countries, original.country);
          if (match) {
            countrySel.value = match.name;
            await loadStates(match.isoCode, false);
          }
        }
      } catch (err) {
        showToast('Error cargando países: ' + err.message, 'error');
      }
    }

    async function loadStates(countryCode, isUserAction) {
      fillOptions(stateSel, [], 'Cargando…');
      fillOptions(citySel, [], 'Selecciona un estado primero…');
      if (!countryCode) return;
      try {
        const res = await window.adminApi.getGeoStates(countryCode);
        fillOptions(stateSel, res.data.states, 'Selecciona un estado…');
        if (!isUserAction && original.state) {
          const match = findBestMatch(res.data.states, original.state);
          if (match) {
            stateSel.value = match.name;
            await loadCities(countryCode, match.isoCode, false);
          }
        }
      } catch (err) {
        showToast('Error cargando estados: ' + err.message, 'error');
      }
    }

    async function loadCities(countryCode, stateCode, isUserAction) {
      fillOptions(citySel, [], 'Cargando…');
      if (!stateCode) return;
      try {
        const res = await window.adminApi.getGeoCities(countryCode, stateCode);
        fillOptions(citySel, res.data.cities, 'Selecciona una ciudad…');
        if (!isUserAction && original.city) {
          const match = findBestMatch(res.data.cities, original.city);
          if (match) citySel.value = match.name;
        }
      } catch (err) {
        showToast('Error cargando ciudades: ' + err.message, 'error');
      }
    }

    countrySel.addEventListener('change', () => {
      touched.country = true;
      touched.state = true;
      touched.city = true;
      const opt = countrySel.selectedOptions[0];
      const code = opt ? opt.getAttribute('data-code') : '';
      loadStates(code, true);
    });
    stateSel.addEventListener('change', () => {
      touched.state = true;
      touched.city = true;
      const countryOpt = countrySel.selectedOptions[0];
      const stateOpt = stateSel.selectedOptions[0];
      const countryCode = countryOpt ? countryOpt.getAttribute('data-code') : '';
      const stateCode = stateOpt ? stateOpt.getAttribute('data-code') : '';
      loadCities(countryCode, stateCode, true);
    });
    citySel.addEventListener('change', () => { touched.city = true; });

    loadCountries();

    return {
      getValues: () => ({
        country: touched.country ? countrySel.value : original.country,
        state: touched.state ? stateSel.value : original.state,
        city: touched.city ? citySel.value : original.city,
      }),
    };
  }

  // CREATE / EDIT UNIVERSITY MODAL
  window.editUniversityModal = async (id = null) => {
    let uni = {
      id: null,
      domain: '',
      name: '',
      acronym: '',
      type: 'public',
      primaryColor: '#002F6C',
      secondaryColor: '#FFFFFF',
      website: '',
      city: '',
      state: '',
      country: 'Mexico',
      logoUrl: '',
      isOfficial: false,
      status: 'AVAILABLE',
      coverPhotos: [],
    };

    if (id) {
      try {
        const res = await window.adminApi.getUniversityDetails(id);
        uni = res.data.university;
      } catch (err) {
        showToast('Error obteniendo universidad: ' + err.message, 'error');
        return;
      }
    }

    let photos = Array.isArray(uni.coverPhotos) ? [...uni.coverPhotos] : [];
    // All accepted domains, fully equal/editable — no "locked primary".
    // Falls back to the single scalar domain for a brand-new university.
    let domains = Array.isArray(uni.domains) && uni.domains.length ? [...uni.domains] : (uni.domain ? [uni.domain] : []);

    const renderDomainChips = () => {
      const listEl = document.getElementById('uni-domains-chip-list');
      if (!listEl) return;
      listEl.innerHTML = domains.length
        ? domains.map((d, idx) => `
            <span class="filter-chip">
              <span>${d}</span>
              <span class="filter-chip-remove" onclick="removeUniDomain(${idx})">&times;</span>
            </span>
          `).join('')
        : '<span class="text-muted" style="font-size:12px;">Sin dominios — agrega al menos uno.</span>';
    };

    window.removeUniDomain = (idx) => {
      if (domains.length <= 1) {
        showToast('Debe quedar al menos un dominio aceptado', 'error');
        return;
      }
      domains.splice(idx, 1);
      renderDomainChips();
    };

    const renderPhotosGallery = () => {
      const galleryEl = document.getElementById('cover-photos-gallery-container');
      if (!galleryEl) return;
      if (photos.length === 0) {
        galleryEl.innerHTML = '<p class="text-muted" style="font-size:12px;">Sin imágenes de portada.</p>';
        return;
      }
      let gHtml = '<div class="cover-photo-grid">';
      photos.forEach((url, idx) => {
        gHtml += `
          <div class="cover-photo-card">
            <img src="${url}" onerror="this.src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=300'">
            <button type="button" class="cover-photo-remove" onclick="removeCoverPhoto(${idx})">&times;</button>
          </div>
        `;
      });
      gHtml += '</div>';
      galleryEl.innerHTML = gHtml;
    };

    window.removeCoverPhoto = (idx) => {
      photos.splice(idx, 1);
      renderPhotosGallery();
    };

    const modalHtml = `
      <h2>${id ? 'Editar Universidad' : 'Registrar Nueva Universidad'}</h2>
      <form id="form-uni-modal" style="margin-top:16px; max-height:75vh; overflow-y:auto; padding-right:8px;">
        <div class="form-group">
          <label>Nombre de la Institución *</label>
          <input type="text" id="m-uni-name" class="form-input" required value="${uni.name || ''}" placeholder="Ej: Universidad Autónoma de Coahuila">
        </div>

        <div class="form-group">
          <label>Dominios de Correo Aceptados *</label>
          <div id="uni-domains-chip-list" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px;"></div>
          <div style="display:flex; gap:8px;">
            <input type="text" id="add-domain-input" class="form-input" placeholder="Ej: alumnos.uadec.mx">
            <button type="button" id="btn-add-domain" class="btn btn-secondary">+ Agregar dominio</button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Siglas / Acrónimo *</label>
            <input type="text" id="m-uni-acronym" class="form-input" required value="${uni.acronym || ''}" placeholder="Ej: UAdeC">
          </div>
          <div class="form-group">
            <label>Tipo de Institución</label>
            <select id="m-uni-type" class="form-select">
              <option value="public" ${uni.type === 'public' ? 'selected' : ''}>Pública</option>
              <option value="private" ${uni.type === 'private' ? 'selected' : ''}>Privada</option>
            </select>
          </div>
          <div class="form-group">
            <label>Estado de Integración</label>
            <select id="m-uni-status" class="form-select">
              <option value="AVAILABLE" ${uni.status === 'AVAILABLE' ? 'selected' : ''}>AVAILABLE (Disponible)</option>
              <option value="INTEGRATED" ${uni.status === 'INTEGRATED' ? 'selected' : ''}>INTEGRATED (Integrada)</option>
              <option value="PENDING" ${uni.status === 'PENDING' ? 'selected' : ''}>PENDING (Pendiente)</option>
              <option value="SUSPENDED" ${uni.status === 'SUSPENDED' ? 'selected' : ''}>SUSPENDED (Suspendida)</option>
            </select>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Color Primario (HEX)</label>
            <div class="color-picker-group">
              <input type="color" id="m-uni-pcolor-picker" class="color-picker-input" value="${uni.primaryColor || '#002F6C'}">
              <input type="text" id="m-uni-pcolor" class="form-input" value="${uni.primaryColor || '#002F6C'}" placeholder="#002F6C">
            </div>
          </div>
          <div class="form-group">
            <label>Color Secundario (HEX)</label>
            <div class="color-picker-group">
              <input type="color" id="m-uni-scolor-picker" class="color-picker-input" value="${uni.secondaryColor || '#FFFFFF'}">
              <input type="text" id="m-uni-scolor" class="form-input" value="${uni.secondaryColor || '#FFFFFF'}" placeholder="#FFFFFF">
            </div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Sitio Web Institucional / Instagram</label>
            <input type="url" id="m-uni-website" class="form-input" value="${uni.website || ''}" placeholder="https://uadec.edu.mx">
          </div>
          <div class="form-group">
            <label>URL Logo Oficial</label>
            <input type="url" id="m-uni-logo" class="form-input" value="${uni.logoUrl || ''}" placeholder="https://domain.com/logo.png">
          </div>
        </div>

        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>País</label>
            <select id="m-uni-country-select" class="form-select"></select>
          </div>
          <div class="form-group">
            <label>Estado</label>
            <select id="m-uni-state-select" class="form-select"></select>
          </div>
          <div class="form-group">
            <label>Ciudad</label>
            <select id="m-uni-city-select" class="form-select"></select>
          </div>
        </div>

        <div class="form-group" style="margin-top:8px;">
          <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
            <input type="checkbox" id="m-uni-official" ${uni.isOfficial ? 'checked' : ''} style="width:18px; height:18px;">
            <span>Oficialmente Integrada y Verificada por UndrGradz</span>
          </label>
        </div>

        <hr style="border:none; border-top:1px solid var(--border-color); margin:16px 0;">

        <!-- Cover Photos Section -->
        <div class="form-group">
          <label>Fotos de Portada (${photos.length})</label>
          <div style="display:flex; gap:8px; margin-top:6px;">
            <input type="url" id="add-photo-url-input" class="form-input" placeholder="https://images.unsplash.com/photo-campus.jpg">
            <button type="button" id="btn-add-photo-url" class="btn btn-secondary">+ Agregar Foto</button>
          </div>
          <div id="cover-photos-gallery-container"></div>
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="margin-top:20px;">
          ${id ? 'Guardar Cambios' : 'Crear Universidad'}
        </button>
      </form>
    `;

    openModal(modalHtml);
    renderPhotosGallery();
    renderDomainChips();

    const geoCascade = wireGeoCascade({
      countrySel: document.getElementById('m-uni-country-select'),
      stateSel: document.getElementById('m-uni-state-select'),
      citySel: document.getElementById('m-uni-city-select'),
      initialCountry: uni.country || 'Mexico',
      initialState: uni.state || '',
      initialCity: uni.city || '',
    });

    // Add domain handler
    const btnAddDomain = document.getElementById('btn-add-domain');
    const addDomainInput = document.getElementById('add-domain-input');
    if (btnAddDomain && addDomainInput) {
      const addDomain = () => {
        const d = addDomainInput.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
        if (!d) return;
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
          showToast('Formato de dominio no válido', 'error');
          return;
        }
        if (domains.includes(d)) {
          showToast('Ese dominio ya está en la lista', 'error');
          return;
        }
        domains.push(d);
        addDomainInput.value = '';
        renderDomainChips();
      };
      btnAddDomain.addEventListener('click', addDomain);
      addDomainInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); addDomain(); }
      });
    }

    // Sync color pickers with hex text inputs
    const pPicker = document.getElementById('m-uni-pcolor-picker');
    const pText = document.getElementById('m-uni-pcolor');
    const sPicker = document.getElementById('m-uni-scolor-picker');
    const sText = document.getElementById('m-uni-scolor');

    if (pPicker && pText) {
      pPicker.addEventListener('input', (e) => pText.value = e.target.value.toUpperCase());
      pText.addEventListener('input', (e) => {
        if (/^#([A-Fa-f0-9]{6})$/.test(e.target.value)) pPicker.value = e.target.value;
      });
    }
    if (sPicker && sText) {
      sPicker.addEventListener('input', (e) => sText.value = e.target.value.toUpperCase());
      sText.addEventListener('input', (e) => {
        if (/^#([A-Fa-f0-9]{6})$/.test(e.target.value)) sPicker.value = e.target.value;
      });
    }

    // Add photo URL handler
    const btnAddPhoto = document.getElementById('btn-add-photo-url');
    const photoUrlInput = document.getElementById('add-photo-url-input');
    if (btnAddPhoto && photoUrlInput) {
      btnAddPhoto.addEventListener('click', () => {
        const url = photoUrlInput.value.trim();
        if (!url) return;
        try {
          new URL(url);
          photos.push(url);
          photoUrlInput.value = '';
          renderPhotosGallery();
        } catch (e) {
          showToast('URL de imagen no válida', 'error');
        }
      });
    }

    // Submit form handler
    document.getElementById('form-uni-modal').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        if (domains.length === 0) {
          showToast('Se requiere al menos un dominio aceptado', 'error');
          return;
        }
        const geoValues = geoCascade.getValues();
        const payload = {
          name: document.getElementById('m-uni-name').value,
          domains: domains,
          acronym: document.getElementById('m-uni-acronym').value,
          type: document.getElementById('m-uni-type').value,
          status: document.getElementById('m-uni-status').value,
          primaryColor: pText.value,
          secondaryColor: sText.value,
          website: document.getElementById('m-uni-website').value,
          logoUrl: document.getElementById('m-uni-logo').value,
          city: geoValues.city,
          state: geoValues.state,
          country: geoValues.country,
          isOfficial: document.getElementById('m-uni-official').checked,
          coverPhotos: photos,
        };

        if (id) {
          await window.adminApi.updateUniversity(id, payload);
          showToast('Universidad actualizada correctamente');
        } else {
          await window.adminApi.createUniversity(payload);
          showToast('Nueva universidad creada en el catálogo');
        }

        closeModal();
        loadUniversities();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  elements.btnAddUniversity.addEventListener('click', () => editUniversityModal(null));

  // Soft Delete Trigger
  window.promptSoftDeleteUni = (id, name) => {
    showConfirmDialog('Eliminación Lógica de Universidad', `¿Estás seguro de eliminar "${name}"? La institución se marcará como eliminada sin perder relaciones históricas ni audit logs.`, async () => {
      try {
        await window.adminApi.softDeleteUniversity(id);
        showToast(`Universidad "${name}" eliminada correctamente (Soft Delete)`);
        loadUniversities();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  // Restore Trigger
  window.promptRestoreUni = (id, name) => {
    showConfirmDialog('Restaurar Universidad', `¿Deseas restaurar la universidad "${name}" al catálogo activo conservando su estado de negocio original?`, async () => {
      try {
        await window.adminApi.restoreUniversity(id);
        showToast(`Universidad "${name}" restaurada correctamente`);
        loadUniversities();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  /* ==========================================================================
     4.5 CAMPUS MODAL
     Locations under one university (e.g. Tec de Monterrey campus Guadalajara).
     Reuses openModal/closeModal (single overlay, no stacking) and the shared
     wireGeoCascade() helper already wired for the University modal above.
     ========================================================================== */
  window.openCampusModal = async (universityId, universityName) => {
    let campuses = [];
    try {
      const res = await window.adminApi.getCampuses(universityId, { includeDeleted: 'true' });
      campuses = res.data.campuses || [];
    } catch (err) {
      showToast('Error obteniendo campus: ' + err.message, 'error');
      return;
    }

    const renderCampusList = () => {
      const listEl = document.getElementById('campus-list-container');
      if (!listEl) return;
      if (!campuses.length) {
        listEl.innerHTML = '<p class="text-muted" style="font-size:12px; padding:8px 0;">Esta universidad todavía no tiene campus registrados.</p>';
        return;
      }
      listEl.innerHTML = campuses.map(c => {
        const loc = [c.city, c.state, c.country].filter(Boolean).join(', ') || 'Sin ubicación';
        const statusBadge = c.isDeleted
          ? '<span class="status-badge badge-deleted">ELIMINADO</span>'
          : '<span class="status-badge badge-active">Activo</span>';
        return `
          <div class="uni-item-row" style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; margin-bottom:8px;">
            <div>
              <strong>${c.name}</strong> ${statusBadge}<br>
              <small class="text-muted">${loc}</small>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="editCampusForm('${c.id}')">✏️ Editar</button>
              ${c.isDeleted
                ? `<button type="button" class="btn btn-restore btn-sm" onclick="promptRestoreCampus('${c.id}', '${c.name.replace(/'/g, "\\'")}')">🔄 Restaurar</button>`
                : `<button type="button" class="btn btn-danger btn-sm" onclick="promptSoftDeleteCampus('${c.id}', '${c.name.replace(/'/g, "\\'")}')">🗑️ Eliminar</button>`
              }
            </div>
          </div>
        `;
      }).join('');
    };

    const modalHtml = `
      <h2>🏫 Campus de ${universityName}</h2>
      <div id="campus-list-container" style="margin:16px 0;"></div>
      <button type="button" id="btn-new-campus" class="btn btn-secondary btn-block">➕ Nuevo Campus</button>
      <div id="campus-form-container"></div>
    `;
    openModal(modalHtml);
    renderCampusList();

    let activeGeoCascade = null;

    const closeCampusForm = () => {
      const c = document.getElementById('campus-form-container');
      if (c) c.innerHTML = '';
      activeGeoCascade = null;
    };

    const renderCampusForm = (campus) => {
      const formEl = document.getElementById('campus-form-container');
      if (!formEl) return;
      const c = campus || { id: null, name: '', city: '', state: '', country: 'Mexico' };
      formEl.innerHTML = `
        <hr style="border:none; border-top:1px solid var(--border-color); margin:16px 0;">
        <form id="form-campus">
          <div class="form-group">
            <label>Nombre del Campus *</label>
            <input type="text" id="cf-name" class="form-input" required value="${c.name || ''}" placeholder="Ej: Campus Guadalajara">
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
            <div class="form-group">
              <label>País</label>
              <select id="cf-country-select" class="form-select"></select>
            </div>
            <div class="form-group">
              <label>Estado</label>
              <select id="cf-state-select" class="form-select"></select>
            </div>
            <div class="form-group">
              <label>Ciudad</label>
              <select id="cf-city-select" class="form-select"></select>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:12px;">
            <button type="submit" class="btn btn-primary" style="flex:1;">${c.id ? 'Guardar Cambios' : 'Crear Campus'}</button>
            <button type="button" class="btn btn-secondary" id="btn-cancel-campus-form">Cancelar</button>
          </div>
        </form>
      `;

      activeGeoCascade = wireGeoCascade({
        countrySel: document.getElementById('cf-country-select'),
        stateSel: document.getElementById('cf-state-select'),
        citySel: document.getElementById('cf-city-select'),
        initialCountry: c.country || 'Mexico',
        initialState: c.state || '',
        initialCity: c.city || '',
      });

      document.getElementById('btn-cancel-campus-form').addEventListener('click', closeCampusForm);

      document.getElementById('form-campus').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const geoValues = activeGeoCascade.getValues();
          const payload = {
            name: document.getElementById('cf-name').value,
            country: geoValues.country,
            state: geoValues.state,
            city: geoValues.city,
          };
          if (c.id) {
            await window.adminApi.updateCampus(c.id, payload);
            showToast('Campus actualizado correctamente');
          } else {
            await window.adminApi.createCampus(universityId, payload);
            showToast('Campus creado correctamente');
          }
          const res = await window.adminApi.getCampuses(universityId, { includeDeleted: 'true' });
          campuses = res.data.campuses || [];
          renderCampusList();
          closeCampusForm();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    };

    document.getElementById('btn-new-campus').addEventListener('click', () => renderCampusForm(null));

    window.editCampusForm = (campusId) => {
      const campus = campuses.find(c => c.id === campusId);
      if (campus) renderCampusForm(campus);
    };

    window.promptSoftDeleteCampus = (campusId, name) => {
      showConfirmDialog('Eliminar Campus', `¿Eliminar el campus "${name}"?`, async () => {
        try {
          await window.adminApi.softDeleteCampus(campusId);
          showToast(`Campus "${name}" eliminado correctamente`);
          const res = await window.adminApi.getCampuses(universityId, { includeDeleted: 'true' });
          campuses = res.data.campuses || [];
          renderCampusList();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    };

    window.promptRestoreCampus = (campusId, name) => {
      showConfirmDialog('Restaurar Campus', `¿Restaurar el campus "${name}"?`, async () => {
        try {
          await window.adminApi.restoreCampus(campusId);
          showToast(`Campus "${name}" restaurado correctamente`);
          const res = await window.adminApi.getCampuses(universityId, { includeDeleted: 'true' });
          campuses = res.data.campuses || [];
          renderCampusList();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    };
  };

  /* ==========================================================================
     5. EVENTS / HANGOUTS CONTROLLER
     ========================================================================== */
  async function loadEvents() {
    try {
      elements.eventsTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">Cargando eventos...</td></tr>';
      const res = await window.adminApi.getEvents();
      const events = res.data.events;

      if (!events || events.length === 0) {
        elements.eventsTbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">No hay eventos registrados.</td></tr>';
        return;
      }

      let html = '';
      events.forEach(e => {
        const creatorName = e.creator ? `${e.creator.firstName} ${e.creator.lastName}` : `@${e.hostHandle}`;

        html += `
          <tr>
            <td>${e.emoji} <strong>${e.name}</strong></td>
            <td><span class="role-badge role-moderator">${e.section}</span></td>
            <td>${creatorName}</td>
            <td>${e.address}<br><span style="font-size:11px; color:var(--text-muted);">${e.time}</span></td>
            <td>${e.attendees ? e.attendees.length : 0} / ${e.capacity}</td>
            <td><span class="status-badge badge-${e.status === 'ACTIVE' ? 'active' : 'banned'}">${e.status}</span></td>
            <td>
              <button class="btn btn-secondary btn-sm" onclick="toggleEventStatus('${e.id}', '${e.status === 'ACTIVE' ? 'HIDDEN' : 'ACTIVE'}')">
                ${e.status === 'ACTIVE' ? '👁️ Ocultar' : '✅ Mostrar'}
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteEvent('${e.id}')">🗑️</button>
            </td>
          </tr>
        `;
      });

      elements.eventsTbody.innerHTML = html;
    } catch (err) {
      showToast('Error cargando eventos: ' + err.message, 'error');
    }
  }

  window.toggleEventStatus = async (eventId, status) => {
    try {
      await window.adminApi.updateEventStatus(eventId, status);
      showToast(`Estado de evento cambiado a ${status}`);
      loadEvents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  window.deleteEvent = (eventId) => {
    showConfirmDialog('Eliminar Evento', '¿Confirmas la eliminación lógica de este evento?', async () => {
      try {
        await window.adminApi.softDeleteEvent(eventId);
        showToast('Evento eliminado correctamente');
        loadEvents();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  /* ==========================================================================
     6. ADMINISTRATORS CONTROLLER (SUPER ADMIN)
     ========================================================================== */
  async function loadAdministrators() {
    try {
      elements.adminsTbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Cargando administradores...</td></tr>';
      const res = await window.adminApi.getAdministrators();
      const admins = res.data.administrators;

      let html = '';
      admins.forEach(a => {
        const lastActive = a.adminSessions && a.adminSessions.length > 0
          ? new Date(a.adminSessions[0].lastActive).toLocaleString()
          : 'Sin sesiones recientes';

        html += `
          <tr>
            <td><strong>${a.firstName} ${a.lastName}</strong> (@${a.handle})</td>
            <td>${a.email}</td>
            <td><span class="role-badge role-${a.role.toLowerCase()}">${a.role}</span></td>
            <td><span class="status-badge badge-${a.status.toLowerCase()}">${a.status}</span></td>
            <td>${lastActive}</td>
            <td>
              ${state.currentAdmin.role === 'SUPER_ADMIN' && a.id !== state.currentAdmin.id
                ? `<button class="btn btn-secondary btn-sm" onclick="changeAdminRole('${a.id}', '${a.role}')">⚙️ Rol</button>`
                : '<span class="text-muted">Propietario</span>'}
            </td>
          </tr>
        `;
      });

      elements.adminsTbody.innerHTML = html;
    } catch (err) {
      showToast('Error en administradores: ' + err.message, 'error');
    }
  }

  elements.btnAddAdmin.addEventListener('click', () => {
    const modalHtml = `
      <h2>Crear Nueva Cuenta Administrativa</h2>
      <form id="form-create-admin" style="margin-top:16px;">
        <div class="form-group">
          <label>Nombre</label>
          <input type="text" id="new-admin-first" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Apellido</label>
          <input type="text" id="new-admin-last" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Email Administrativo</label>
          <input type="email" id="new-admin-email" class="form-input" required placeholder="ejemplo@undrgradz.com">
        </div>
        <div class="form-group">
          <label>Contraseña Inicial</label>
          <input type="password" id="new-admin-password" class="form-input" required>
        </div>
        <div class="form-group">
          <label>Rol Asignado</label>
          <select id="new-admin-role" class="form-select" required>
            <option value="SUPPORT">Support</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Crear Administrador</button>
      </form>
    `;
    openModal(modalHtml);

    document.getElementById('form-create-admin').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await window.adminApi.createAdministrator({
          firstName: document.getElementById('new-admin-first').value,
          lastName: document.getElementById('new-admin-last').value,
          email: document.getElementById('new-admin-email').value,
          password: document.getElementById('new-admin-password').value,
          role: document.getElementById('new-admin-role').value,
        });
        showToast('Cuenta de administrador creada');
        closeModal();
        loadAdministrators();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  });

  window.changeAdminRole = (userId, currentRole) => {
    const modalHtml = `
      <h2>Cambiar Rol de Administrador</h2>
      <form id="form-change-role" style="margin-top:16px;">
        <div class="form-group">
          <label>Nuevo Rol</label>
          <select id="role-select-input" class="form-select">
            <option value="SUPPORT" ${currentRole === 'SUPPORT' ? 'selected' : ''}>Support</option>
            <option value="MODERATOR" ${currentRole === 'MODERATOR' ? 'selected' : ''}>Moderator</option>
            <option value="ADMIN" ${currentRole === 'ADMIN' ? 'selected' : ''}>Admin</option>
            <option value="SUPER_ADMIN" ${currentRole === 'SUPER_ADMIN' ? 'selected' : ''}>Super Admin</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Actualizar Rol</button>
      </form>
    `;
    openModal(modalHtml);

    document.getElementById('form-change-role').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const newRole = document.getElementById('role-select-input').value;
        await window.adminApi.updateUserRole(userId, newRole);
        showToast('Rol de administrador actualizado');
        closeModal();
        loadAdministrators();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  /* ==========================================================================
     7. AUDIT LOGS CONTROLLER
     ========================================================================== */
  async function loadAuditLogs() {
    try {
      elements.auditLogsTbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Cargando registro de auditoría...</td></tr>';
      const res = await window.adminApi.getAuditLogs();
      const logs = res.data.logs;

      if (!logs || logs.length === 0) {
        elements.auditLogsTbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay registros de auditoría aún.</td></tr>';
        return;
      }

      let html = '';
      logs.forEach(l => {
        const adminName = l.admin ? `${l.admin.firstName} ${l.admin.lastName}` : 'Sistema';
        html += `
          <tr>
            <td><strong>${adminName}</strong><br><span style="font-size:11px; color:var(--text-muted);">${l.admin?.email || ''}</span></td>
            <td><span class="role-badge role-admin">${l.action}</span></td>
            <td>${l.targetType || 'N/A'}: <code>${l.targetId || 'Global'}</code></td>
            <td><code>${l.ipAddress || '127.0.0.1'}</code></td>
            <td>${new Date(l.createdAt).toLocaleString()}</td>
          </tr>
        `;
      });

      elements.auditLogsTbody.innerHTML = html;
    } catch (err) {
      showToast('Error cargando logs: ' + err.message, 'error');
    }
  }

  /* ==========================================================================
     8. NOTIFICATIONS CONTROLLER
     ========================================================================== */
  elements.notifTargetType.addEventListener('change', (e) => {
    const val = e.target.value;
    if (val === 'UNIVERSITY') {
      elements.notifUniGroup.classList.remove('hidden');
      elements.notifUserGroup.classList.add('hidden');
    } else if (val === 'USER') {
      elements.notifUserGroup.classList.remove('hidden');
      elements.notifUniGroup.classList.add('hidden');
    } else {
      elements.notifUniGroup.classList.add('hidden');
      elements.notifUserGroup.classList.add('hidden');
    }
  });

  elements.formSendNotification.addEventListener('submit', async (e) => {
    e.preventDefault();
    const targetType = elements.notifTargetType.value;
    const title = document.getElementById('notif-title').value.trim();
    const message = document.getElementById('notif-message').value.trim();
    const university = document.getElementById('notif-university').value.trim();
    const targetId = document.getElementById('notif-user-id').value.trim();

    try {
      const res = await window.adminApi.sendNotification({
        targetType,
        targetId: targetType === 'USER' ? targetId : null,
        university: targetType === 'UNIVERSITY' ? university : null,
        title,
        message,
        type: 'SYSTEM',
      });
      const count = res.data ? res.data.count : 0;
      showToast(`Notificación enviada con éxito a ${count} usuario(s).`);
      elements.formSendNotification.reset();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  /* ==========================================================================
     9. SETTINGS CONTROLLER
     ========================================================================== */
  async function loadSettings() {
    try {
      const res = await window.adminApi.getSettings();
      const settings = res.data.settings;

      let html = '<div style="display:flex; flex-direction:column; gap:16px;">';
      Object.entries(settings).forEach(([key, val]) => {
        html += `
          <div class="glass-panel p-4">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
              <strong>${key}</strong>
              <button class="btn btn-secondary btn-sm" onclick="editSettingKey('${key}', ${JSON.stringify(val)})">✏️ Editar</button>
            </div>
            <p style="font-size:13px; color:var(--text-secondary);">Valor actual: <code>${JSON.stringify(val)}</code></p>
          </div>
        `;
      });
      html += '</div>';

      elements.settingsContainer.innerHTML = html;
    } catch (err) {
      showToast('Error cargando configuraciones: ' + err.message, 'error');
    }
  }

  window.editSettingKey = (key, currentValue) => {
    const modalHtml = `
      <h2>Modificar Configuración: ${key}</h2>
      <form id="form-edit-setting" style="margin-top:16px;">
        <div class="form-group">
          <label>Nuevo Valor (JSON o Texto/Número)</label>
          <input type="text" id="setting-new-val" class="form-input" value='${JSON.stringify(currentValue)}' required>
        </div>
        <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px;">Guardar Configuración</button>
      </form>
    `;
    openModal(modalHtml);

    document.getElementById('form-edit-setting').addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        let val = document.getElementById('setting-new-val').value;
        try { val = JSON.parse(val); } catch (e) {}

        await window.adminApi.updateSetting(key, val, 'Modificado desde el panel de administración');
        showToast(`Configuración ${key} actualizada`);
        closeModal();
        loadSettings();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  };

  /* ==========================================================================
     10. ANALYTICS & CHARTS CONTROLLER
     ========================================================================== */
  let chartInstances = {};

  async function loadAnalyticsView() {
    try {
      const res = await window.adminApi.getAnalytics();
      const data = res.data;

      // Update KPI Cards
      document.getElementById('analytics-kpi-users').textContent = data.kpis.totalUsers || '0';
      document.getElementById('analytics-kpi-verified').textContent = `${data.kpis.verifiedUsers || 0} (${data.kpis.verificationRate}%)`;
      document.getElementById('analytics-kpi-creators').textContent = data.kpis.creatorUsers || '0';
      document.getElementById('analytics-kpi-events').textContent = data.kpis.totalEvents || '0';

      // Export Buttons
      const excelBtn = document.getElementById('btn-export-excel');
      const pdfBtn = document.getElementById('btn-export-pdf');

      if (excelBtn) {
        excelBtn.onclick = () => {
          window.open(window.adminApi.getAnalyticsExportUrl('xlsx'), '_blank');
        };
      }
      if (pdfBtn) {
        pdfBtn.onclick = () => {
          window.open(window.adminApi.getAnalyticsExportUrl('pdf'), '_blank');
        };
      }

      // Render Chart.js charts
      if (typeof Chart !== 'undefined') {
        renderAnalyticsCharts(data);
      }
    } catch (err) {
      showToast('Error cargando analítica: ' + err.message, 'error');
    }
  }

  /* --------------------------------------------------------------------------
     Chart.js visual theme.
     Presentation only — no data, endpoints, canvas ids or instance keys here.
     -------------------------------------------------------------------------- */
  const VIZ = {
    indigo: '#818cf8',
    cyan: '#22d3ee',
    emerald: '#34d399',
    amber: '#fbbf24',
    pink: '#f472b6',
    violet: '#a78bfa',
    sky: '#38bdf8',
    rose: '#fb7185'
  };
  const VIZ_SERIES = [VIZ.indigo, VIZ.cyan, VIZ.emerald, VIZ.amber, VIZ.pink, VIZ.violet];
  const AXIS_COLOR = '#6f7889';
  const GRID_COLOR = 'rgba(255, 255, 255, 0.045)';
  const SURFACE_COLOR = '#0f1117';

  // Vertical fade used to fill area/line charts.
  function vizGradient(canvas, hex, topAlpha) {
    const ctx2d = canvas.getContext && canvas.getContext('2d');
    if (!ctx2d) return hexToRgba(hex, topAlpha);
    const g = ctx2d.createLinearGradient(0, 0, 0, canvas.clientHeight || 280);
    g.addColorStop(0, hexToRgba(hex, topAlpha));
    g.addColorStop(1, hexToRgba(hex, 0));
    return g;
  }

  function hexToRgba(hex, alpha) {
    const h = String(hex).replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const num = parseInt(full, 16);
    if (isNaN(num)) return hex;
    return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
  }

  function vizTooltip(extra) {
    return Object.assign({
      backgroundColor: 'rgba(20, 22, 31, 0.97)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      titleColor: '#f4f5f7',
      bodyColor: '#a5adbb',
      titleFont: { size: 12, weight: '700', family: "'Plus Jakarta Sans', sans-serif" },
      bodyFont: { size: 12, weight: '500', family: "'Plus Jakarta Sans', sans-serif" },
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      usePointStyle: true,
      boxPadding: 6
    }, extra || {});
  }

  function vizLegend(position) {
    return {
      position: position || 'top',
      align: 'end',
      labels: {
        color: AXIS_COLOR,
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 7,
        boxHeight: 7,
        padding: 16,
        font: { size: 11, weight: '600', family: "'Plus Jakarta Sans', sans-serif" }
      }
    };
  }

  function vizScale(options) {
    const o = options || {};
    return {
      ticks: {
        color: AXIS_COLOR,
        padding: 8,
        font: { size: 11, weight: '500', family: "'Plus Jakarta Sans', sans-serif" },
        maxRotation: 0,
        autoSkipPadding: 16
      },
      border: { display: false },
      grid: {
        color: o.grid === false ? 'transparent' : GRID_COLOR,
        display: o.grid !== false,
        drawTicks: false
      }
    };
  }

  const VIZ_ANIMATION = { duration: 850, easing: 'easeOutQuart' };

  function renderAnalyticsCharts(data) {
    if (!data) return;

    if (Chart.defaults) {
      Chart.defaults.font.family = "'Plus Jakarta Sans', 'Outfit', system-ui, sans-serif";
      Chart.defaults.color = AXIS_COLOR;
    }

    // 0. Hero Chart: Activity Trend & Engagement (Full Width)
    const ctxTrend = document.getElementById('chart-activity-trend');
    if (ctxTrend) {
      if (chartInstances.trend) chartInstances.trend.destroy();
      const trendLabels = data.growthTrend ? data.growthTrend.map(d => d.date) : [];
      const trendUsers = data.growthTrend ? data.growthTrend.map(d => d.users) : [];
      const trendActive = data.growthTrend ? data.growthTrend.map(d => d.active) : [];

      chartInstances.trend = new Chart(ctxTrend, {
        type: 'bar',
        data: {
          labels: trendLabels,
          datasets: [{
            type: 'line',
            label: 'Usuarios Registrados (Acumulado)',
            data: trendUsers,
            borderColor: VIZ.indigo,
            backgroundColor: vizGradient(ctxTrend, VIZ.indigo, 0.28),
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: VIZ.indigo,
            pointHoverBorderColor: SURFACE_COLOR,
            pointHoverBorderWidth: 2,
            yAxisID: 'y'
          }, {
            type: 'bar',
            label: 'Usuarios Activos',
            data: trendActive,
            backgroundColor: hexToRgba(VIZ.emerald, 0.55),
            hoverBackgroundColor: hexToRgba(VIZ.emerald, 0.85),
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 26,
            yAxisID: 'y'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: vizLegend('top'),
            tooltip: vizTooltip()
          },
          scales: {
            x: vizScale({ grid: false }),
            y: Object.assign({ type: 'linear', position: 'left', beginAtZero: true }, vizScale())
          }
        }
      });
    }

    // 1. User Growth Chart (2-Col)
    const ctxGrowth = document.getElementById('chart-user-growth');
    if (ctxGrowth) {
      if (chartInstances.growth) chartInstances.growth.destroy();
      chartInstances.growth = new Chart(ctxGrowth, {
        type: 'line',
        data: {
          labels: data.growthTrend ? data.growthTrend.map(d => d.date) : [],
          datasets: [{
            label: 'Usuarios Registrados',
            data: data.growthTrend ? data.growthTrend.map(d => d.users) : [],
            borderColor: VIZ.cyan,
            backgroundColor: vizGradient(ctxGrowth, VIZ.cyan, 0.3),
            borderWidth: 2.5,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: VIZ.cyan,
            pointHoverBorderColor: SURFACE_COLOR,
            pointHoverBorderWidth: 2
          }, {
            label: 'Usuarios Activos',
            data: data.growthTrend ? data.growthTrend.map(d => d.active) : [],
            borderColor: VIZ.emerald,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointBackgroundColor: VIZ.emerald,
            pointHoverBorderColor: SURFACE_COLOR,
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: vizLegend('top'),
            tooltip: vizTooltip()
          },
          scales: {
            x: vizScale({ grid: false }),
            y: Object.assign({ beginAtZero: true }, vizScale())
          }
        }
      });
    }

    // 2. University Breakdown Chart (2-Col)
    const ctxUni = document.getElementById('chart-uni-breakdown');
    if (ctxUni) {
      if (chartInstances.uni) chartInstances.uni.destroy();
      const uniLabels = data.uniBreakdown && data.uniBreakdown.length > 0 ? data.uniBreakdown.map(u => u.acronym || u.name) : ['Sin datos'];
      const uniCounts = data.uniBreakdown && data.uniBreakdown.length > 0 ? data.uniBreakdown.map(u => u.students) : [0];
      const uniColors = data.uniBreakdown && data.uniBreakdown.length > 0
        ? data.uniBreakdown.map((u, i) => u.color || VIZ_SERIES[i % VIZ_SERIES.length])
        : [VIZ.indigo];

      chartInstances.uni = new Chart(ctxUni, {
        type: 'bar',
        data: {
          labels: uniLabels,
          datasets: [{
            label: 'Estudiantes Registrados',
            data: uniCounts,
            backgroundColor: uniColors.map(c => (typeof c === 'string' && c.startsWith('#')) ? hexToRgba(c, 0.75) : c),
            hoverBackgroundColor: uniColors,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 22
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          plugins: {
            legend: { display: false },
            tooltip: vizTooltip({
              callbacks: {
                title: (items) => {
                  if (!items || !items.length) return '';
                  const idx = items[0].dataIndex;
                  return data.uniBreakdown[idx] ? data.uniBreakdown[idx].fullName : items[0].label;
                },
                label: (item) => {
                  return ` ${item.formattedValue} estudiantes registrados`;
                }
              }
            })
          },
          scales: {
            x: Object.assign({ beginAtZero: true }, vizScale()),
            y: {
              ticks: {
                color: '#a5adbb',
                padding: 8,
                font: { size: 11, weight: '700', family: "'Plus Jakarta Sans', sans-serif" }
              },
              border: { display: false },
              grid: { display: false }
            }
          }
        }
      });
    }

    // 3. Verification Status Doughnut Chart (3-Col)
    const ctxVerif = document.getElementById('chart-verification-status');
    if (ctxVerif) {
      if (chartInstances.verif) chartInstances.verif.destroy();
      chartInstances.verif = new Chart(ctxVerif, {
        type: 'doughnut',
        data: {
          labels: ['Estudiantes 🎓', 'Creadores ✨', 'Atletas 🏅', 'Gobierno 🏛️'],
          datasets: [{
            data: [
              data.kpis?.verifiedUsers || 0,
              data.kpis?.creatorUsers || 0,
              data.kpis?.athleteUsers || 0,
              data.kpis?.govtUsers || 0
            ],
            backgroundColor: [VIZ.violet, VIZ.amber, VIZ.emerald, VIZ.cyan],
            hoverOffset: 6,
            borderWidth: 3,
            borderColor: SURFACE_COLOR,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          animation: Object.assign({ animateRotate: true, animateScale: false }, VIZ_ANIMATION),
          plugins: {
            legend: Object.assign(vizLegend('bottom'), { align: 'center' }),
            tooltip: vizTooltip()
          }
        }
      });
    }

    // 4. Events Categories Polar Area Chart (3-Col)
    const ctxCat = document.getElementById('chart-event-categories');
    if (ctxCat) {
      if (chartInstances.cat) chartInstances.cat.destroy();
      const catLabels = data.eventCategories && data.eventCategories.length > 0 ? data.eventCategories.map(c => c.category) : ['Sin eventos'];
      const catCounts = data.eventCategories && data.eventCategories.length > 0 ? data.eventCategories.map(c => c.count) : [0];
      const catColors = data.eventCategories && data.eventCategories.length > 0
        ? data.eventCategories.map((c, i) => c.color || VIZ_SERIES[i % VIZ_SERIES.length])
        : [VIZ.indigo];

      chartInstances.cat = new Chart(ctxCat, {
        type: 'polarArea',
        data: {
          labels: catLabels,
          datasets: [{
            data: catCounts,
            backgroundColor: catColors.map(c => (typeof c === 'string' && c.startsWith('#')) ? hexToRgba(c, 0.62) : c),
            hoverBackgroundColor: catColors,
            borderColor: SURFACE_COLOR,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: Object.assign({ animateRotate: true }, VIZ_ANIMATION),
          plugins: {
            legend: Object.assign(vizLegend('bottom'), { align: 'center' }),
            tooltip: vizTooltip()
          },
          scales: {
            r: {
              ticks: { display: false, backdropColor: 'transparent' },
              grid: { color: 'rgba(255, 255, 255, 0.07)' },
              angleLines: { color: 'rgba(255, 255, 255, 0.05)' }
            }
          }
        }
      });
    }

    // 5. Matches & Connections Bar Chart (3-Col)
    const ctxMatch = document.getElementById('chart-match-activity');
    if (ctxMatch) {
      if (chartInstances.match) chartInstances.match.destroy();
      const matchLabels = data.matchesByDay ? Object.keys(data.matchesByDay) : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      const matchCounts = data.matchesByDay ? Object.values(data.matchesByDay) : [0, 0, 0, 0, 0, 0, 0];

      chartInstances.match = new Chart(ctxMatch, {
        type: 'bar',
        data: {
          labels: matchLabels,
          datasets: [{
            label: 'Coincidencias de Chat',
            data: matchCounts,
            backgroundColor: vizGradient(ctxMatch, VIZ.sky, 0.85),
            hoverBackgroundColor: VIZ.sky,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 30
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: vizTooltip()
          },
          scales: {
            x: vizScale({ grid: false }),
            y: Object.assign({ beginAtZero: true }, vizScale())
          }
        }
      });
    }

    // 6. Academic Area Radar Chart (Asymmetric 60%)
    const ctxRadar = document.getElementById('chart-career-radar');
    if (ctxRadar) {
      if (chartInstances.radar) chartInstances.radar.destroy();
      const areaLabels = data.academicAreas ? data.academicAreas.labels : ['Ingeniería ⚙️', 'Salud 🩺', 'Negocios 💼', 'Derecho ⚖️', 'Diseño 🎨', 'Ciencias 🔬'];
      const menData = data.academicAreas ? data.academicAreas.men : [0, 0, 0, 0, 0, 0];
      const womenData = data.academicAreas ? data.academicAreas.women : [0, 0, 0, 0, 0, 0];

      chartInstances.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: areaLabels,
          datasets: [{
            label: 'Hombres',
            data: menData,
            borderColor: VIZ.sky,
            backgroundColor: hexToRgba(VIZ.sky, 0.18),
            borderWidth: 2,
            pointRadius: 2.5,
            pointHoverRadius: 5,
            pointBackgroundColor: VIZ.sky,
            pointBorderColor: SURFACE_COLOR,
            pointBorderWidth: 1.5
          }, {
            label: 'Mujeres',
            data: womenData,
            borderColor: VIZ.pink,
            backgroundColor: hexToRgba(VIZ.pink, 0.18),
            borderWidth: 2,
            pointRadius: 2.5,
            pointHoverRadius: 5,
            pointBackgroundColor: VIZ.pink,
            pointBorderColor: SURFACE_COLOR,
            pointBorderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          plugins: {
            legend: vizLegend('top'),
            tooltip: vizTooltip()
          },
          scales: {
            r: {
              angleLines: { color: 'rgba(255, 255, 255, 0.07)' },
              grid: { color: 'rgba(255, 255, 255, 0.07)', circular: true },
              pointLabels: {
                color: '#a5adbb',
                font: { size: 11, weight: '600', family: "'Plus Jakarta Sans', sans-serif" }
              },
              ticks: { display: false, backdropColor: 'transparent' }
            }
          }
        }
      });
    }

    // 7. Device & Platform Distribution Doughnut (Asymmetric 40%)
    const ctxDevice = document.getElementById('chart-device-os');
    if (ctxDevice) {
      if (chartInstances.device) chartInstances.device.destroy();
      const deviceLabels = data.devices ? data.devices.labels : ['Desktop 💻', 'Mobile Web 🌐', 'Android App 🤖', 'iOS App 🍎'];
      const deviceCounts = data.devices ? data.devices.counts : [0, 0, 0, 0];

      chartInstances.device = new Chart(ctxDevice, {
        type: 'doughnut',
        data: {
          labels: deviceLabels,
          datasets: [{
            data: deviceCounts,
            backgroundColor: [VIZ.cyan, VIZ.emerald, VIZ.amber, VIZ.violet],
            hoverOffset: 6,
            borderWidth: 3,
            borderColor: SURFACE_COLOR,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          animation: Object.assign({ animateRotate: true, animateScale: false }, VIZ_ANIMATION),
          plugins: {
            legend: Object.assign(vizLegend('bottom'), { align: 'center' }),
            tooltip: vizTooltip()
          }
        }
      });
    }

    // 8. Hourly Traffic Timeline Chart (Full Width)
    const ctxHourly = document.getElementById('chart-hourly-activity');
    if (ctxHourly) {
      if (chartInstances.hourly) chartInstances.hourly.destroy();
      const hourlyLabels = data.hourlyTraffic ? data.hourlyTraffic.labels : ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'];
      const hourlyCounts = data.hourlyTraffic ? data.hourlyTraffic.counts : [0, 0, 0, 0, 0, 0, 0, 0, 0];

      chartInstances.hourly = new Chart(ctxHourly, {
        type: 'bar',
        data: {
          labels: hourlyLabels,
          datasets: [{
            label: 'Tráfico de Estudiantes',
            data: hourlyCounts,
            backgroundColor: (bar) => {
              // Cool-to-warm ramp across the day; falls back to indigo mid-render.
              const ramp = [VIZ.cyan, VIZ.sky, VIZ.indigo, VIZ.violet, VIZ.pink, VIZ.rose];
              const total = (bar.chart.data.labels || []).length || 1;
              const step = ramp[Math.min(ramp.length - 1, Math.floor((bar.dataIndex / total) * ramp.length))];
              return hexToRgba(step, 0.72);
            },
            hoverBackgroundColor: VIZ.indigo,
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: VIZ_ANIMATION,
          interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: vizTooltip()
          },
          scales: {
            x: vizScale({ grid: false }),
            y: Object.assign({ beginAtZero: true }, vizScale())
          }
        }
      });
    }
  }

  /* ==========================================================================
     11. VERIFICATIONS & CREATOR BADGES CONTROLLER (SaaS Redesign)
     ========================================================================== */
  let currentVerifTab = 'ALL';
  let activeFilters = {
    status: 'ALL',
    type: 'ALL',
    university: 'ALL',
    major: 'ALL',
    date: 'ALL',
    doc: 'ALL',
    search: '',
    sort: 'NEWEST',
    viewMode: 'grid'
  };
  let cachedRequests = [];
  let verifDebounceTimer = null;

  async function loadVerificationsView() {
    const grid = document.getElementById('verifications-grid');
    if (!grid) return;

    // Display Shimmer Skeleton Cards while loading
    renderSkeletonCards(grid);

    try {
      const res = await window.adminApi.getVerifications({
        // This view is Blue Badge only — the involvement types (Student
        // Government / Creator / Athlete) live in the Verification Requests view.
        type: currentVerifTab === 'ALL' ? 'STUDENT_ID' : currentVerifTab,
        status: activeFilters.status
      });

      const { requests, stats, pendingCount } = res.data;
      cachedRequests = (requests || []).filter(r => r.type === 'STUDENT_ID');

      // Update sidebar pending badges
      const badge = document.getElementById('badge-pending-verifications');
      if (badge) {
        const bluePending = cachedRequests.filter(r => r.status === 'PENDING').length;
        if (bluePending > 0) {
          badge.textContent = bluePending;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }
      updateVrPendingBadge(stats);

      // Update Header Stats Scorecards (Blue Badge scope)
      if (stats) {
        const blueTotal = stats.studentIdCount || cachedRequests.length;
        document.getElementById('verif-stat-total').textContent = blueTotal;
        document.getElementById('verif-stat-pending').textContent = cachedRequests.filter(r => r.status === 'PENDING').length;
        document.getElementById('verif-stat-approved').textContent = cachedRequests.filter(r => r.status === 'APPROVED').length;
        document.getElementById('verif-stat-rejected').textContent = cachedRequests.filter(r => r.status === 'REJECTED').length;

        document.getElementById('tab-count-all').textContent = blueTotal;
        document.getElementById('tab-count-student').textContent = stats.studentIdCount || 0;
        document.getElementById('tab-count-creator').textContent = stats.creatorCount || 0;
        document.getElementById('tab-count-athlete').textContent = stats.athleteCount || 0;
        document.getElementById('tab-count-govt').textContent = stats.govtCount || 0;
      }

      // Populate Universities & Majors Selects in Filter Drawer
      populateDrawerSelects(requests);

      // Setup Event Listeners once
      setupVerifControlsOnce();

      // Render Cards & Active Chips
      renderFilteredVerifications();

    } catch (err) {
      grid.innerHTML = `<div class="glass-panel p-6 text-center col-span-full text-red-400">Error al cargar solicitudes: ${err.message}</div>`;
    }
  }

  function renderSkeletonCards(container) {
    let skeletons = '';
    for (let i = 0; i < 6; i++) {
      skeletons += `
        <div class="skeleton-card flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-4">
              <div class="skeleton-pulse" style="width:110px; height:20px;"></div>
              <div class="skeleton-pulse" style="width:80px; height:20px;"></div>
            </div>
            <div class="flex items-center gap-3 mb-4">
              <div class="skeleton-pulse" style="width:42px; height:42px; border-radius:50%;"></div>
              <div class="flex-1">
                <div class="skeleton-pulse mb-2" style="width:60%; height:14px;"></div>
                <div class="skeleton-pulse" style="width:40%; height:11px;"></div>
              </div>
            </div>
            <div class="skeleton-pulse mb-3" style="width:85%; height:12px;"></div>
            <div class="skeleton-pulse mb-4" style="width:100%; height:130px; border-radius:10px;"></div>
          </div>
          <div class="flex gap-2 pt-3 border-t border-gray-800">
            <div class="skeleton-pulse flex-1" style="height:34px;"></div>
            <div class="skeleton-pulse flex-1" style="height:34px;"></div>
          </div>
        </div>
      `;
    }
    container.innerHTML = skeletons;
  }

  function populateDrawerSelects(requests) {
    const uniSelect = document.getElementById('drawer-filter-uni');
    const majorSelect = document.getElementById('drawer-filter-major');

    if (uniSelect) {
      const unis = new Set();
      requests.forEach(r => {
        if (r.user?.profile?.university) unis.add(r.user.profile.university);
      });
      let html = '<option value="ALL">Todas las universidades</option>';
      Array.from(unis).sort().forEach(u => {
        html += `<option value="${u}">${u}</option>`;
      });
      uniSelect.innerHTML = html;
      uniSelect.value = activeFilters.university;
    }

    if (majorSelect) {
      const majors = new Set();
      requests.forEach(r => {
        if (r.user?.profile?.major) majors.add(r.user.profile.major);
      });
      let html = '<option value="ALL">Todas las carreras</option>';
      Array.from(majors).sort().forEach(m => {
        html += `<option value="${m}">${m}</option>`;
      });
      majorSelect.innerHTML = html;
      majorSelect.value = activeFilters.major;
    }
  }

  function setupVerifControlsOnce() {
    const searchInput = document.getElementById('verif-search-input');
    if (searchInput && !searchInput.dataset.bound) {
      searchInput.dataset.bound = 'true';
      searchInput.oninput = (e) => {
        clearTimeout(verifDebounceTimer);
        verifDebounceTimer = setTimeout(() => {
          activeFilters.search = e.target.value.trim().toLowerCase();
          renderFilteredVerifications();
        }, 250);
      };
    }

    // Toggle Filter Drawer Panel
    const btnToggleDrawer = document.getElementById('btn-toggle-filters-drawer');
    const drawer = document.getElementById('verif-filters-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');

    if (btnToggleDrawer && !btnToggleDrawer.dataset.bound) {
      btnToggleDrawer.dataset.bound = 'true';
      btnToggleDrawer.onclick = () => drawer?.classList.toggle('hidden');
      if (btnCloseDrawer) btnCloseDrawer.onclick = () => drawer?.classList.add('hidden');
    }

    // Apply & Reset Drawer Filters
    const btnApplyDrawer = document.getElementById('btn-apply-drawer-filters');
    const btnResetDrawer = document.getElementById('btn-reset-drawer-filters');

    if (btnApplyDrawer && !btnApplyDrawer.dataset.bound) {
      btnApplyDrawer.dataset.bound = 'true';
      btnApplyDrawer.onclick = () => {
        activeFilters.status = document.getElementById('drawer-filter-status')?.value || 'ALL';
        activeFilters.type = document.getElementById('drawer-filter-type')?.value || 'ALL';
        activeFilters.university = document.getElementById('drawer-filter-uni')?.value || 'ALL';
        activeFilters.major = document.getElementById('drawer-filter-major')?.value || 'ALL';
        activeFilters.date = document.getElementById('drawer-filter-date')?.value || 'ALL';
        activeFilters.doc = document.getElementById('drawer-filter-doc')?.value || 'ALL';
        
        drawer?.classList.add('hidden');
        renderFilteredVerifications();
      };
    }

    if (btnResetDrawer && !btnResetDrawer.dataset.bound) {
      btnResetDrawer.dataset.bound = 'true';
      btnResetDrawer.onclick = () => {
        resetAllFilters();
      };
    }

    // Sort Select
    const sortSelect = document.getElementById('verif-sort-select');
    if (sortSelect && !sortSelect.dataset.bound) {
      sortSelect.dataset.bound = 'true';
      sortSelect.onchange = (e) => {
        activeFilters.sort = e.target.value;
        renderFilteredVerifications();
      };
    }

    // View Mode Toggle (Grid vs List)
    const btnGrid = document.getElementById('btn-view-grid');
    const btnList = document.getElementById('btn-view-list');
    if (btnGrid && !btnGrid.dataset.bound) {
      btnGrid.dataset.bound = 'true';
      btnGrid.onclick = () => {
        btnGrid.classList.add('active');
        btnList?.classList.remove('active');
        activeFilters.viewMode = 'grid';
        const grid = document.getElementById('verifications-grid');
        if (grid) grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
      };
      if (btnList) {
        btnList.onclick = () => {
          btnList.classList.add('active');
          btnGrid.classList.remove('active');
          activeFilters.viewMode = 'list';
          const grid = document.getElementById('verifications-grid');
          if (grid) grid.className = 'flex flex-col gap-4';
        };
      }
    }

    // Nav Tabs Horizontal Scroll
    document.querySelectorAll('.verif-nav-tab').forEach(tabBtn => {
      tabBtn.onclick = () => {
        document.querySelectorAll('.verif-nav-tab').forEach(b => b.classList.remove('active'));
        tabBtn.classList.add('active');
        currentVerifTab = tabBtn.getAttribute('data-tab');
        activeFilters.type = currentVerifTab;
        loadVerificationsView();
      };
    });

    // Clear All Chips
    const btnClearChips = document.getElementById('btn-clear-all-chips');
    if (btnClearChips && !btnClearChips.dataset.bound) {
      btnClearChips.dataset.bound = 'true';
      btnClearChips.onclick = () => resetAllFilters();
    }
  }

  function resetAllFilters() {
    activeFilters = {
      status: 'ALL',
      type: 'ALL',
      university: 'ALL',
      major: 'ALL',
      date: 'ALL',
      doc: 'ALL',
      search: '',
      sort: 'NEWEST',
      viewMode: activeFilters.viewMode
    };

    const searchField = document.getElementById('verif-search-input');
    if (searchField) searchField.value = '';

    if (document.getElementById('drawer-filter-status')) document.getElementById('drawer-filter-status').value = 'ALL';
    if (document.getElementById('drawer-filter-type')) document.getElementById('drawer-filter-type').value = 'ALL';
    if (document.getElementById('drawer-filter-uni')) document.getElementById('drawer-filter-uni').value = 'ALL';
    if (document.getElementById('drawer-filter-major')) document.getElementById('drawer-filter-major').value = 'ALL';
    if (document.getElementById('drawer-filter-date')) document.getElementById('drawer-filter-date').value = 'ALL';
    if (document.getElementById('drawer-filter-doc')) document.getElementById('drawer-filter-doc').value = 'ALL';

    renderFilteredVerifications();
  }

  function renderFilteredVerifications() {
    const grid = document.getElementById('verifications-grid');
    if (!grid) return;

    let list = [...cachedRequests];

    // Filter by Type
    if (activeFilters.type !== 'ALL') {
      list = list.filter(r => r.type === activeFilters.type);
    }

    // Filter by Status
    if (activeFilters.status !== 'ALL') {
      list = list.filter(r => r.status === activeFilters.status);
    }

    // Filter by University
    if (activeFilters.university !== 'ALL') {
      list = list.filter(r => r.user?.profile?.university === activeFilters.university);
    }

    // Filter by Major
    if (activeFilters.major !== 'ALL') {
      list = list.filter(r => r.user?.profile?.major === activeFilters.major);
    }

    // Filter by Search text
    if (activeFilters.search) {
      const q = activeFilters.search;
      list = list.filter(r => {
        const u = r.user || {};
        const fullText = `${u.firstName || ''} ${u.lastName || ''} ${u.handle || ''} ${u.email || ''} ${u.profile?.university || ''} ${u.profile?.major || ''}`.toLowerCase();
        return fullText.includes(q);
      });
    }

    // Filter by Date
    if (activeFilters.date !== 'ALL') {
      const now = new Date();
      list = list.filter(r => {
        const d = new Date(r.createdAt);
        if (activeFilters.date === 'TODAY') {
          return d.toDateString() === now.toDateString();
        }
        if (activeFilters.date === '7DAYS') {
          return (now - d) <= 7 * 24 * 3600 * 1000;
        }
        if (activeFilters.date === '30DAYS') {
          return (now - d) <= 30 * 24 * 3600 * 1000;
        }
        return true;
      });
    }

    // Filter by Attachment / Completeness
    if (activeFilters.doc !== 'ALL') {
      list = list.filter(r => {
        const hasDoc = !!r.credentialUrl;
        const isComplete = r.notes && r.user?.profile?.university;
        if (activeFilters.doc === 'WITH_DOC') return hasDoc;
        if (activeFilters.doc === 'WITHOUT_DOC') return !hasDoc;
        if (activeFilters.doc === 'COMPLETE') return isComplete;
        if (activeFilters.doc === 'INCOMPLETE') return !isComplete;
        return true;
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (activeFilters.sort === 'NEWEST') return new Date(b.createdAt) - new Date(a.createdAt);
      if (activeFilters.sort === 'OLDEST') return new Date(a.createdAt) - new Date(b.createdAt);
      const nameA = `${a.user?.firstName || ''} ${a.user?.lastName || ''}`.toLowerCase();
      const nameB = `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.toLowerCase();
      if (activeFilters.sort === 'NAME_ASC') return nameA.localeCompare(nameB);
      if (activeFilters.sort === 'NAME_DESC') return nameB.localeCompare(nameA);
      return 0;
    });

    // Update Counter
    const resultsCountEl = document.getElementById('verif-results-count');
    if (resultsCountEl) {
      resultsCountEl.textContent = `${list.length} solicitudes encontradas`;
    }

    // Render Filter Chips
    renderFilterChips();

    // Render Empty State if 0 items match
    if (list.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full empty-verif-state">
          <div class="empty-icon">🔍</div>
          <h3 style="font-size:18px; font-weight:700; color:#fff; margin-bottom:4px;">No encontramos solicitudes</h3>
          <p style="font-size:13px; color:#94a3b8; margin-bottom:16px;">Intenta cambiar los filtros o realizar una nueva búsqueda.</p>
          <button class="btn btn-primary btn-sm" onclick="window.resetAllVerifFilters()">Limpiar filtros</button>
        </div>
      `;
      return;
    }

    // Render Cards
    let cardsHtml = '';
    list.forEach(req => {
      cardsHtml += buildSaaSVerifCard(req);
    });

    grid.innerHTML = cardsHtml;
  }

  function renderFilterChips() {
    const chipsBar = document.getElementById('verif-active-chips-bar');
    const container = document.getElementById('verif-chips-container');
    const filterBadge = document.getElementById('verif-filter-badge');

    if (!chipsBar || !container) return;

    const activeList = [];
    if (activeFilters.status !== 'ALL') activeList.push({ label: `Estado: ${activeFilters.status}`, key: 'status' });
    if (activeFilters.type !== 'ALL') activeList.push({ label: `Tipo: ${activeFilters.type}`, key: 'type' });
    if (activeFilters.university !== 'ALL') activeList.push({ label: `Uni: ${activeFilters.university}`, key: 'university' });
    if (activeFilters.major !== 'ALL') activeList.push({ label: `Carrera: ${activeFilters.major}`, key: 'major' });
    if (activeFilters.date !== 'ALL') activeList.push({ label: `Fecha: ${activeFilters.date}`, key: 'date' });
    if (activeFilters.doc !== 'ALL') activeList.push({ label: `Adjuntos: ${activeFilters.doc}`, key: 'doc' });
    if (activeFilters.search) activeList.push({ label: `🔍 "${activeFilters.search}"`, key: 'search' });

    if (activeList.length > 0) {
      chipsBar.classList.remove('hidden');
      if (filterBadge) {
        filterBadge.textContent = activeList.length;
        filterBadge.classList.remove('hidden');
      }

      let html = '';
      activeList.forEach(chip => {
        html += `
          <div class="filter-chip">
            <span>${chip.label}</span>
            <span class="filter-chip-remove" onclick="removeVerifFilterChip('${chip.key}')">&times;</span>
          </div>
        `;
      });
      container.innerHTML = html;
    } else {
      chipsBar.classList.add('hidden');
      if (filterBadge) filterBadge.classList.add('hidden');
    }
  }

  window.removeVerifFilterChip = (key) => {
    if (key === 'search') {
      activeFilters.search = '';
      const input = document.getElementById('verif-search-input');
      if (input) input.value = '';
    } else {
      activeFilters[key] = 'ALL';
      const drawerEl = document.getElementById(`drawer-filter-${key}`);
      if (drawerEl) drawerEl.value = 'ALL';
    }
    renderFilteredVerifications();
  };

  window.resetAllVerifFilters = () => {
    resetAllFilters();
  };

  function formatRelativeTime(dateString) {
    if (!dateString) return 'Recientemente';
    const date = new Date(dateString);
    const now = new Date();
    const diffSecs = Math.floor((now - date) / 1000);

    if (diffSecs < 60) return 'Hace unos momentos';
    if (diffSecs < 3600) return `Hace ${Math.floor(diffSecs / 60)} min`;
    if (diffSecs < 86400) return `Hace ${Math.floor(diffSecs / 3600)} horas`;
    const days = Math.floor(diffSecs / 86400);
    if (days === 1) return 'Ayer';
    if (days < 30) return `Hace ${days} días`;
    return date.toLocaleDateString();
  }

  function buildSaaSVerifCard(req) {
    const u = req.user || {};
    const isApproved = req.status === 'APPROVED';
    const isRejected = req.status === 'REJECTED';
    const isPending = req.status === 'PENDING';

    const avatarInitial = (u.firstName || u.email || 'S')[0].toUpperCase();
    const photoUrl = req.credentialUrl || (u.photos && u.photos[0] ? u.photos[0].url : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600');
    const relativeTime = formatRelativeTime(req.createdAt);

    // Category styling & Info
    let catClass = 'verif-cat-purple';
    let catBadgeLabel = '🎓 Credenciales Estudiantiles';
    let avatarBg = '#a855f7';
    let isCreator = req.type === 'CREATOR_BADGE';
    let isAthlete = req.type === 'ATHLETE';
    let isGovt = req.type === 'STUDENT_GOVT';

    if (isCreator) {
      catClass = 'verif-cat-gold';
      catBadgeLabel = '✨ Creadores de Contenido';
      avatarBg = '#f59e0b';
    } else if (isAthlete) {
      catClass = 'verif-cat-green';
      catBadgeLabel = '🏅 Atletas Universitarios';
      avatarBg = '#22c55e';
    } else if (isGovt) {
      catClass = 'verif-cat-blue';
      catBadgeLabel = '🏛️ Gobierno Estudiantil';
      avatarBg = '#3b82f6';
    }

    let statusBadge = '<span class="badge badge-warning font-bold">PENDIENTE</span>';
    if (isApproved) statusBadge = '<span class="badge badge-success font-bold">APROBADO</span>';
    if (isRejected) statusBadge = '<span class="badge badge-danger font-bold">RECHAZADO</span>';

    // Category-specific details block
    let categoryDetailsHtml = '';
    let fileWidgetHtml = '';

    if (isCreator) {
      const s = req.socialLinks || { instagram: `@${u.handle || 'user'}`, tiktok: `@${u.handle || 'user'}`, youtube: `${u.firstName || 'User'} Vlogs` };
      categoryDetailsHtml = `
        <div class="my-2">
          ${s.instagram ? `
            <div class="verif-social-row">
              <span class="text-gray-400 font-semibold">📸 Instagram</span>
              <a href="https://instagram.com/${s.instagram.replace('@','')}" target="_blank">${s.instagram} ↗</a>
            </div>` : ''}
          ${s.tiktok ? `
            <div class="verif-social-row">
              <span class="text-gray-400 font-semibold">🎵 TikTok</span>
              <a href="https://tiktok.com/@${s.tiktok.replace('@','')}" target="_blank">${s.tiktok} ↗</a>
            </div>` : ''}
          ${s.youtube ? `
            <div class="verif-social-row">
              <span class="text-gray-400 font-semibold">▶️ YouTube</span>
              <a href="#" onclick="return false;">${s.youtube} ↗</a>
            </div>` : ''}
        </div>
      `;
    } else if (isAthlete) {
      categoryDetailsHtml = `
        <div class="my-2">
          <div class="verif-data-row"><span class="verif-data-label">🏐 Deporte</span><span class="verif-data-value">${req.sport || 'Voleibol'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">🏆 Equipo</span><span class="verif-data-value">${req.team || 'UAdC Volleyball'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">🛡️ Posición</span><span class="verif-data-value">${req.athletePosition || 'Titular'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">🏅 Categoría</span><span class="verif-data-value">${req.athleteCategory || 'Universitaria'}</span></div>
        </div>
      `;
      fileWidgetHtml = `
        <div class="verif-file-widget" onclick="openCredentialModal('${req.id}')" title="Haz clic para inspeccionar documento">
          <div class="flex items-center gap-3">
            <div class="verif-file-icon-box">📄</div>
            <div>
              <div class="verif-file-title">${req.docName || 'Constancia deportiva'}</div>
              <div class="verif-file-meta">${req.docSize || 'PDF · 2.4 MB'}</div>
            </div>
          </div>
          <div class="text-gray-400 font-bold">↗</div>
        </div>
      `;
    } else if (isGovt) {
      categoryDetailsHtml = `
        <div class="my-2">
          <div class="verif-data-row"><span class="verif-data-label">🏛️ Organización</span><span class="verif-data-value">${req.organization || 'Consejo Estudiantil'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">👤 Cargo</span><span class="verif-data-value">${req.govtPosition || 'Representante de Facultad'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">🏢 Facultad</span><span class="verif-data-value">${req.faculty || 'Facultad de Derecho'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">📅 Periodo</span><span class="verif-data-value">${req.period || '2026 - 2027'}</span></div>
        </div>
      `;
      fileWidgetHtml = `
        <div class="verif-file-widget" onclick="openCredentialModal('${req.id}')" title="Haz clic para inspeccionar documento">
          <div class="flex items-center gap-3">
            <div class="verif-file-icon-box">📄</div>
            <div>
              <div class="verif-file-title">${req.docName || 'Nombramiento oficial'}</div>
              <div class="verif-file-meta">${req.docSize || 'PDF · 1.8 MB'}</div>
            </div>
          </div>
          <div class="text-gray-400 font-bold">↗</div>
        </div>
      `;
    } else {
      // Student ID
      categoryDetailsHtml = `
        <div class="my-2">
          <div class="verif-data-row"><span class="verif-data-label">🪪 Matrícula</span><span class="verif-data-value">${req.studentId || 'A01234567'}</span></div>
          <div class="verif-data-row"><span class="verif-data-label">📄 Tipo</span><span class="verif-data-value">${req.docType || 'Credencial Estudiantil'}</span></div>
        </div>
      `;
      fileWidgetHtml = `
        <div class="verif-file-widget" onclick="openCredentialModal('${req.id}')" title="Haz clic para inspeccionar documento">
          <div class="flex items-center gap-3">
            <div class="verif-file-icon-box">🪪</div>
            <div>
              <div class="verif-file-title">${req.docName || 'Credencial estudiantil'}</div>
              <div class="verif-file-meta">${req.docSize || 'PDF · 1.2 MB'}</div>
            </div>
          </div>
          <div class="text-gray-400 font-bold">↗</div>
        </div>
      `;
    }

    return `
      <div class="verif-card-saas" id="card-${req.id}">
        <div>
          <!-- Header Bar -->
          <div class="verif-card-saas-header">
            <span class="badge ${catClass} font-bold text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">${catBadgeLabel}</span>
            <div>${statusBadge}</div>
          </div>

          <!-- Student Profile Summary -->
          <div class="flex gap-3 items-center mb-3">
            <div class="verif-profile-badge-avatar" style="background: ${avatarBg}; color: #ffffff;">
              ${avatarInitial}
            </div>
            <div style="overflow:hidden;">
              <h4 style="font-size:14px; font-weight:700; color:#ffffff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin:0;">${u.firstName || ''} ${u.lastName || ''}</h4>
              <span style="font-size:11px; color:#94a3b8;">${u.handle || `@${u.firstName?.toLowerCase() || 'user'}`}</span>
            </div>
          </div>

          <!-- School & Major -->
          <div style="font-size:11px; color:#94a3b8; margin-bottom:10px;">
            <div class="flex items-center gap-1.5 text-gray-300 font-semibold truncate"><span style="font-size:12px;">🏛️</span> ${u.profile?.university || 'Universidad Autónoma de Coahuila'}</div>
            <div class="flex items-center gap-1.5 text-indigo-400 font-semibold truncate mt-0.5"><span style="font-size:12px;">🎓</span> ${u.profile?.major || 'Ingeniería Mecatrónica'}</div>
          </div>

          <!-- Category Specific Data Rows -->
          ${categoryDetailsHtml}

          <!-- File Widget (No Giant Photo Image!) -->
          ${fileWidgetHtml}
        </div>

        <!-- Card Footer -->
        <div class="verif-card-saas-footer">
          <div style="font-size:11px; color:#94a3b8; margin-bottom:8px; font-weight:600;">
            🕒 Solicitud enviada ${relativeTime}
          </div>

          <div class="flex gap-2">
            ${isCreator ? `
              <button class="btn-verif-view flex-1" onclick="openCredentialModal('${req.id}')">
                👁️ Ver perfiles
              </button>
            ` : `
              <button class="btn-verif-view flex-1" onclick="openCredentialModal('${req.id}')">
                👁️ Ver doc
              </button>
            `}

            ${!isApproved ? `
              <button class="btn-verif-approve flex-1" onclick="confirmApproveVerif('${req.id}', '${req.type}', '${u.firstName || 'estudiante'}')">
                ✓ Aprobar
              </button>
            ` : ''}

            ${!isRejected ? `
              <button class="btn-verif-reject flex-1" onclick="confirmRejectVerif('${req.id}', '${u.firstName || 'estudiante'}')">
                ✕ Rechazar
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Looks a request up in either view's cache — the Blue Badge view and the
   * Verification Requests view share this modal.
   */
  function findCachedRequest(requestId) {
    return cachedRequests.find(r => r.id === requestId)
      || (typeof vrCachedRequests !== 'undefined' ? vrCachedRequests.find(r => r.id === requestId) : null)
      || null;
  }

  // Define global modal inspection viewer for student credentials.
  // The document is NOT part of the list payload — it is fetched here, one at a
  // time, through the authenticated admin API and injected in memory.
  window.openCredentialModal = async (requestId) => {
    const req = findCachedRequest(requestId);
    const u = req ? (req.user || {}) : {};
    const studentName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Estudiante';
    const handle = u.handle || `@${u.firstName?.toLowerCase() || 'user'}`;
    const university = u.profile?.university || 'Universidad';
    const major = u.profile?.major || '';
    const majorText = major ? ` (${major})` : '';

    const isApproved = req?.status === 'APPROVED';
    const isRejected = req?.status === 'REJECTED';
    const sportText = req?.sport ? ` · 🏅 ${req.sport}` : '';

    // Loading state while the document travels.
    openModal(`
      <div style="padding:4px;">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3 mb-2">
          <div>
            <h3 style="font-size:17px; font-weight:800; color:#fff; margin:0;">🪪 Documento de Verificación</h3>
            <div style="font-size:12px; color:#a855f7; font-weight:600; margin-top:3px;">${studentName} <span style="color:#94a3b8; font-weight:400;">(${handle})</span></div>
          </div>
        </div>
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:60px 20px;">
          <div class="spinner" style="width:26px;height:26px;border-width:3px;"></div>
          <div style="font-size:13px; color:#94a3b8;">Cargando documento…</div>
        </div>
      </div>
    `);

    let docUrl = null;
    let docMime = '';
    let docName = '';
    let loadError = '';
    try {
      const res = await window.adminApi.getVerificationDocument(requestId);
      docUrl = res.data?.credentialUrl || null;
      docMime = res.data?.documentMime || '';
      docName = res.data?.documentName || '';
    } catch (err) {
      loadError = err.message || 'No se pudo cargar el documento';
    }

    const isValidDocUrl = docUrl && typeof docUrl === 'string' && (docUrl.startsWith('data:') || docUrl.startsWith('http://') || docUrl.startsWith('https://') || docUrl.startsWith('/'));
    if (!isValidDocUrl) docUrl = null;

    const isPdf = !!docUrl && (docMime === 'application/pdf' || docUrl.toLowerCase().includes('.pdf') || docUrl.startsWith('data:application/pdf'));

    let previewHtml = '';
    if (!docUrl) {
      previewHtml = `
        <div style="text-align:center; padding:30px 15px; background:rgba(239,68,68,0.1); border-radius:12px; border:1.5px solid rgba(239,68,68,0.3); margin:12px 0;">
          <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
          <div style="font-size:14px; font-weight:700; color:#ef4444;">${loadError || 'No se adjuntó archivo de credencial válido'}</div>
          <div style="font-size:12px; color:#94a3b8; margin-top:4px;">El estudiante deberá volver a subir una fotografía legible de su documento desde la app.</div>
        </div>
      `;
    } else if (isPdf) {
      previewHtml = `<iframe src="${docUrl}" style="width:100%; height:480px; border-radius:12px; border:1px solid rgba(255,255,255,0.15);"></iframe>`;
    } else {
      previewHtml = `
        <div style="text-align:center; padding:12px; background:rgba(0,0,0,0.5); border-radius:12px; border:1.5px solid rgba(255,255,255,0.1); margin:12px 0;">
          <img src="${docUrl}" alt="Documento de Verificación" style="max-width:100%; max-height:65vh; object-fit:contain; border-radius:8px; display:inline-block; box-shadow:0 8px 30px rgba(0,0,0,0.5);" />
        </div>
      `;
    }

    openModal(`
      <div style="padding:4px;">
        <div class="flex items-center justify-between border-b border-gray-800 pb-3 mb-2">
          <div>
            <h3 style="font-size:17px; font-weight:800; color:#fff; margin:0;" class="flex items-center gap-2">
              <span>🪪 Documento de Verificación${sportText}</span>
            </h3>
            <div style="font-size:12px; color:#a855f7; font-weight:600; margin-top:3px;">
              ${studentName} <span style="color:#94a3b8; font-weight:400;">(${handle})</span> · ${university}${majorText}
            </div>
            ${docName ? `<div style="font-size:11px; color:#64748b; margin-top:3px;">📎 ${docName}</div>` : ''}
          </div>
        </div>

        ${previewHtml}

        <div class="flex justify-between items-center mt-3 pt-3 border-t border-gray-800">
          <div style="font-size:12px; color:#94a3b8; font-weight:600;">
            Estado actual: <span style="color:${isApproved ? '#22c55e' : (isRejected ? '#ef4444' : '#f59e0b')}; text-transform:uppercase;">${req?.status || 'PENDIENTE'}</span>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cerrar</button>
            ${!isApproved ? `
              <button class="btn btn-success btn-sm font-bold" onclick="closeModal(); confirmApproveVerif('${requestId}', '${req?.type}', '${studentName}')">
                ✓ Aprobar Credencial
              </button>
            ` : ''}
            ${!isRejected ? `
              <button class="btn btn-danger btn-sm font-bold" onclick="closeModal(); confirmRejectVerif('${requestId}', '${studentName}')">
                ✕ Rechazar
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  };

  // Interactive Confirmation & Modals for Approval and Rejection
  window.confirmApproveVerif = async (requestId, type, studentName) => {
    showConfirmDialog(
      'Aprobar Verificación',
      `¿Deseas confirmar la aprobación de la solicitud para **${studentName}**? Se otorgará el distintivo oficial y se enviará una notificación.`,
      async () => {
        try {
          showToast('Procesando aprobación...', 'info');
          await window.adminApi.approveVerification(requestId, type);
          showToast(`✅ Verificación aprobada con éxito para ${studentName}`);
          refreshActiveVerificationView();
        } catch (err) {
          showToast(`Error: ${err.message}`, 'error');
        }
      }
    );
  };

  window.confirmRejectVerif = (requestId, studentName) => {
    openModal(`
      <div style="padding:10px;">
        <h3 style="font-size:18px; font-weight:700; color:#fff; margin-bottom:6px;">Rechazar Solicitud de Verificación</h3>
        <p style="font-size:13px; color:#94a3b8; margin-bottom:14px;">Estudiante: <strong>${studentName}</strong></p>
        
        <div class="form-group mb-4">
          <label class="text-xs font-bold text-gray-400 mb-1 block">Motivo del Rechazo (Opcional):</label>
          <textarea id="modal-rejection-reason" class="form-input text-sm" rows="3" placeholder="Ej: La fotografía de la credencial se encuentra borrosa o no está vigente..."></textarea>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancelar</button>
          <button class="btn btn-danger btn-sm" onclick="executeRejection('${requestId}', '${studentName}')">✕ Confirmar Rechazo</button>
        </div>
      </div>
    `);
  };

  window.executeRejection = async (requestId, studentName) => {
    const reason = document.getElementById('modal-rejection-reason')?.value || '';
    closeModal();

    try {
      showToast('Procesando rechazo...', 'info');
      await window.adminApi.rejectVerification(requestId, reason);
      showToast(`❌ Solicitud rechazada para ${studentName}`, 'warning');
      refreshActiveVerificationView();
    } catch (err) {
      showToast(`Error: ${err.message}`, 'error');
    }
  };

  window.approveVerifReq = (reqId, type) => {
    showConfirmDialog(
      type === 'CREATOR_BADGE' ? '✨ Otorgar Badge de Creador' : '🎓 Aprobar Verificación de Estudiante',
      'Esta acción otorgará el distintivo oficial de verificación en la plataforma y notificará al usuario.',
      async () => {
        try {
          await window.adminApi.approveVerification(reqId);
          showToast('¡Verificación aprobada con éxito! Insignia otorgada.');
          refreshActiveVerificationView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  window.rejectVerifReq = (reqId) => {
    confirmRejectVerif(reqId, 'estudiante');
  };

  /* ==========================================================================
     12. VERIFICATION REQUESTS CONTROLLER
     Student Government · Content Creator · Athlete.
     Separate from the Blue Badge (STUDENT_ID) view. Athletics is reviewed one
     sport at a time: each sport is its own request with its own document.
     ========================================================================== */

  const VR_TYPES = ['STUDENT_GOVT', 'CREATOR_BADGE', 'ATHLETE'];
  const VR_META = {
    STUDENT_GOVT:  { label: 'Student Government', icon: '🏛️', cls: 'verif-cat-blue' },
    CREATOR_BADGE: { label: 'Content Creator',    icon: '✨', cls: 'verif-cat-purple' },
    ATHLETE:       { label: 'Athlete',            icon: '🏅', cls: 'verif-cat-gold' }
  };

  let vrCurrentTab = 'ALL';
  let vrStatusFilter = 'PENDING';
  let vrSearch = '';
  let vrCachedRequests = [];
  let vrDebounceTimer = null;

  /** Reloads whichever verification view the admin is currently on. */
  function refreshActiveVerificationView() {
    if (state.currentView === 'verification-requests') loadVerificationRequestsView();
    else loadVerificationsView();
  }

  /**
   * Sidebar counter for pending involvement verifications. Fed from the stats
   * block, which counts every request regardless of the current filters.
   */
  function updateVrPendingBadge(stats) {
    const badge = document.getElementById('badge-pending-vr');
    if (!badge || !stats) return;
    const pending = (stats.pendingByType)
      ? (stats.pendingByType.CREATOR_BADGE || 0) + (stats.pendingByType.ATHLETE || 0) + (stats.pendingByType.STUDENT_GOVT || 0)
      : 0;
    if (pending > 0) {
      badge.textContent = pending;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  async function loadVerificationRequestsView() {
    const grid = document.getElementById('vr-grid');
    if (!grid) return;

    renderSkeletonCards(grid);

    try {
      // The API filters by a single type; for the "Todas" tab we pull everything
      // and narrow to the three involvement types client-side.
      const res = await window.adminApi.getVerifications({
        type: vrCurrentTab === 'ALL' ? 'ALL' : vrCurrentTab,
        status: vrStatusFilter
      });

      const requests = (res.data.requests || []).filter(r => VR_TYPES.indexOf(r.type) > -1);
      vrCachedRequests = requests;

      updateVrPendingBadge(res.data.stats);
      vrUpdateStats(res.data.stats || {}, requests);
      vrBindControls();
      vrRender();
    } catch (err) {
      grid.innerHTML = `<div class="glass-panel p-6 text-center col-span-full text-red-400">Error cargando solicitudes: ${err.message}</div>`;
    }
  }

  function vrUpdateStats(stats, requests) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    // Totals for the three involvement types only (Blue Badge lives elsewhere).
    const total = (stats.creatorCount || 0) + (stats.athleteCount || 0) + (stats.govtCount || 0);
    set('vr-stat-total', total);
    set('vr-stat-pending', requests.filter(r => r.status === 'PENDING').length);
    set('vr-stat-approved', requests.filter(r => r.status === 'APPROVED').length);
    set('vr-stat-rejected', requests.filter(r => r.status === 'REJECTED').length);

    set('vr-tab-count-all', requests.length);
    set('vr-tab-count-govt', requests.filter(r => r.type === 'STUDENT_GOVT').length);
    set('vr-tab-count-creator', requests.filter(r => r.type === 'CREATOR_BADGE').length);
    set('vr-tab-count-athlete', requests.filter(r => r.type === 'ATHLETE').length);
  }

  function vrBindControls() {
    const search = document.getElementById('vr-search-input');
    if (search && search.dataset.bound !== 'true') {
      search.dataset.bound = 'true';
      search.oninput = (e) => {
        clearTimeout(vrDebounceTimer);
        vrDebounceTimer = setTimeout(() => { vrSearch = e.target.value.trim().toLowerCase(); vrRender(); }, 250);
      };
    }

    const statusSel = document.getElementById('vr-status-select');
    if (statusSel && statusSel.dataset.bound !== 'true') {
      statusSel.dataset.bound = 'true';
      statusSel.onchange = (e) => { vrStatusFilter = e.target.value; loadVerificationRequestsView(); };
    }

    document.querySelectorAll('.vr-nav-tab').forEach(tab => {
      if (tab.dataset.bound === 'true') return;
      tab.dataset.bound = 'true';
      tab.onclick = () => {
        document.querySelectorAll('.vr-nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        vrCurrentTab = tab.dataset.vrtab;
        loadVerificationRequestsView();
      };
    });
  }

  function vrRender() {
    const grid = document.getElementById('vr-grid');
    if (!grid) return;

    let list = vrCachedRequests.slice();

    if (vrSearch) {
      list = list.filter(r => {
        const u = r.user || {};
        const hay = [
          u.firstName, u.lastName, u.handle, u.email,
          u.profile?.university, u.profile?.major, r.sport
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(vrSearch);
      });
    }

    const counter = document.getElementById('vr-results-count');
    if (counter) counter.textContent = `${list.length} solicitud${list.length === 1 ? '' : 'es'} encontrada${list.length === 1 ? '' : 's'}`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="col-span-full empty-verif-state">
          <div class="empty-icon">📭</div>
          <h3 style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">Sin solicitudes</h3>
          <p style="font-size:13px;color:#94a3b8;">No hay solicitudes de verificación que coincidan con los filtros actuales.</p>
        </div>
      `;
      return;
    }

    // How many athlete requests each user has, so a card can show the context
    // (e.g. "Soccer" is 1 of 2 sports submitted by this student).
    const athleteCountByUser = {};
    vrCachedRequests.forEach(r => {
      if (r.type !== 'ATHLETE') return;
      athleteCountByUser[r.userId] = (athleteCountByUser[r.userId] || 0) + 1;
    });

    grid.innerHTML = list.map(r => vrCardHtml(r, athleteCountByUser)).join('');
  }

  function vrCardHtml(req, athleteCountByUser) {
    const u = req.user || {};
    const meta = VR_META[req.type] || { label: req.type, icon: '📄', cls: 'verif-cat-blue' };
    const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Estudiante';
    const handle = u.handle ? (u.handle.startsWith('@') ? u.handle : '@' + u.handle) : '';
    const university = u.profile?.university || '—';
    const major = u.profile?.major || '';
    const photo = (u.photos && u.photos[0]) ? u.photos[0].url : null;
    const initial = (u.firstName || 'U').charAt(0).toUpperCase();

    const statusMap = {
      PENDING:  { cls: 'badge-warning', text: 'PENDIENTE' },
      APPROVED: { cls: 'badge-success', text: 'APROBADO' },
      REJECTED: { cls: 'badge-danger',  text: 'RECHAZADO' }
    };
    const st = statusMap[req.status] || statusMap.PENDING;

    const created = req.createdAt ? new Date(req.createdAt).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—';

    // Category label carries the sport, since each sport is its own request.
    const catLabel = req.type === 'ATHLETE' && req.sport
      ? `${meta.icon} ${meta.label} · ${escapeHtml(req.sport)}`
      : `${meta.icon} ${meta.label}`;

    // Per-type detail rows
    let details = '';
    if (req.type === 'STUDENT_GOVT') {
      const roles = (req.metadata && Array.isArray(req.metadata.roles)) ? req.metadata.roles.join(', ') : '—';
      details = `<div class="verif-data-row"><span class="verif-data-label">Cargo</span><span class="verif-data-value">${escapeHtml(roles)}</span></div>`;
    } else if (req.type === 'CREATOR_BADGE') {
      const s = req.socialLinks || {};
      const rows = [];
      if (s.instagram) rows.push(`<div class="verif-social-row"><span class="text-gray-400 font-semibold">📸 Instagram</span><span>@${escapeHtml(s.instagram)}</span></div>`);
      if (s.tiktok)    rows.push(`<div class="verif-social-row"><span class="text-gray-400 font-semibold">🎵 TikTok</span><span>@${escapeHtml(s.tiktok)}</span></div>`);
      if (s.youtube)   rows.push(`<div class="verif-social-row"><span class="text-gray-400 font-semibold">▶️ YouTube</span><span>${escapeHtml(s.youtube)}</span></div>`);
      details = rows.length ? rows.join('') : `<div class="verif-data-row"><span class="verif-data-label">Redes</span><span class="verif-data-value">Sin datos</span></div>`;
    } else if (req.type === 'ATHLETE') {
      const totalSports = athleteCountByUser[req.userId] || 1;
      details = `
        <div class="verif-data-row"><span class="verif-data-label">Deporte</span><span class="verif-data-value">${escapeHtml(req.sport || '—')}</span></div>
        <div class="verif-data-row"><span class="verif-data-label">Solicitudes del alumno</span><span class="verif-data-value">${totalSports} deporte${totalSports === 1 ? '' : 's'}</span></div>
      `;
    }

    const fileWidget = req.hasDocument ? `
      <div class="verif-file-widget" onclick="openCredentialModal('${req.id}')">
        <div class="flex items-center gap-3">
          <div class="verif-file-icon-box">${req.documentMime === 'application/pdf' ? '📕' : '🖼️'}</div>
          <div>
            <div class="verif-file-title">${escapeHtml(req.documentName || 'Documento adjunto')}</div>
            <div class="verif-file-meta">${req.documentMime === 'application/pdf' ? 'PDF' : 'Imagen'} · clic para abrir</div>
          </div>
        </div>
        <span class="text-gray-400 font-bold">↗</span>
      </div>
    ` : `
      <div class="verif-file-widget" style="cursor:default;opacity:0.65;">
        <div class="flex items-center gap-3">
          <div class="verif-file-icon-box">⚠️</div>
          <div>
            <div class="verif-file-title">Sin documento</div>
            <div class="verif-file-meta">El estudiante no adjuntó archivo</div>
          </div>
        </div>
      </div>
    `;

    const avatar = photo
      ? `<img src="${photo}" alt="" class="verif-profile-badge-avatar" style="object-fit:cover;">`
      : `<div class="verif-profile-badge-avatar" style="background:var(--accent-gradient);color:#fff;">${initial}</div>`;

    const safeName = String(name).replace(/'/g, "\\'");

    return `
      <div class="verif-card-saas" id="vr-card-${req.id}">
        <div>
          <div class="verif-card-saas-header">
            <span class="badge ${meta.cls} font-bold text-xs px-2.5 py-1 rounded-full">${catLabel}</span>
            <span class="badge ${st.cls} font-bold">${st.text}</span>
          </div>

          <div class="flex gap-3 items-center mb-3">
            ${avatar}
            <div style="overflow:hidden;">
              <h4 style="font-size:14px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;">${escapeHtml(name)}</h4>
              <span style="font-size:11px;color:#94a3b8;">${escapeHtml(handle)}</span>
            </div>
          </div>

          <div style="font-size:11px;color:#94a3b8;margin-bottom:10px;">
            <div class="flex items-center gap-1.5 text-gray-300 font-semibold truncate">🏛️ ${escapeHtml(university)}</div>
            ${major ? `<div class="flex items-center gap-1.5 text-indigo-400 font-semibold truncate mt-0.5">🎓 ${escapeHtml(major)}</div>` : ''}
          </div>

          <hr class="my-2">
          ${details}
          ${fileWidget}
        </div>

        <div class="verif-card-saas-footer">
          <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;font-weight:600;">🕒 ${created}</div>
          <div class="flex gap-2">
            ${req.hasDocument ? `<button class="btn-verif-view flex-1" onclick="openCredentialModal('${req.id}')">👁️ Ver doc</button>` : ''}
            ${req.status !== 'APPROVED' ? `<button class="btn-verif-approve flex-1" onclick="confirmApproveVerif('${req.id}', '${req.type}', '${safeName}')">✓ Aprobar</button>` : ''}
            ${req.status !== 'REJECTED' ? `<button class="btn-verif-reject flex-1" onclick="confirmRejectVerif('${req.id}', '${safeName}')">✕ Rechazar</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Run initialization
  initApp();
});
