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

  /* ==========================================================================
     ROUTING & NAVIGATION (URL Hash Syncing & Page Reload Persistence)
     ========================================================================== */
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
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

      // Render Health Metrics
      updateSystemHealthUI(systemHealth);

      // Render University Distribution Chart
      renderUniversityChart(usersByUniversity);

      // Render Recent Activity Feed
      renderRecentActivity(recentActivity);
    } catch (err) {
      showToast('Error cargando el dashboard: ' + err.message, 'error');
    }
  }

  elements.btnRefreshDashboard.addEventListener('click', loadDashboard);

  function updateSystemHealthUI(health) {
    if (!health) return;
    document.getElementById('health-backend-uptime').textContent = `${Math.floor(health.backend.uptimeSeconds / 60)}m ${health.backend.uptimeSeconds % 60}s`;
    document.getElementById('health-db-latency').textContent = `${health.database.latencyMs} ms (${health.database.status})`;
    document.getElementById('health-socket-clients').textContent = `${health.socketIo.connectedClients} cliente(s)`;
    document.getElementById('health-memory').textContent = `${health.serverResources.memory.heapUsedMb} MB / ${health.serverResources.memory.heapTotalMb} MB (${health.serverResources.memory.memoryUsagePercent}%)`;
    document.getElementById('health-cpu').textContent = `${health.serverResources.cpu.cores} cores (${health.serverResources.cpu.loadAvg.join(', ')})`;
  }

  function startHealthPolling() {
    setInterval(async () => {
      if (state.currentView === 'dashboard') {
        try {
          const res = await window.adminApi.getDashboard();
          updateSystemHealthUI(res.data.systemHealth);
        } catch (e) {}
      }
    }, 15000);
  }

  function renderUniversityChart(data) {
    const canvas = document.getElementById('chart-universities');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!data || data.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Plus Jakarta Sans';
      ctx.fillText('No hay datos suficientes', 50, 100);
      return;
    }

    const maxCount = Math.max(...data.map(d => d.count), 1);
    const barHeight = 22;
    const gap = 12;

    data.slice(0, 5).forEach((item, index) => {
      const y = index * (barHeight + gap) + 20;
      const barWidth = Math.max((item.count / maxCount) * 220, 10);

      // Draw Uni Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Plus Jakarta Sans';
      const shortName = item.name.length > 22 ? item.name.substring(0, 20) + '...' : item.name;
      ctx.fillText(shortName, 10, y + 15);

      // Draw Gradient Bar
      const gradient = ctx.createLinearGradient(160, 0, 160 + barWidth, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(1, '#ec4899');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(160, y, barWidth, barHeight, 4);
      ctx.fill();

      // Draw Count
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Plus Jakarta Sans';
      ctx.fillText(String(item.count), 168 + barWidth, y + 15);
    });
  }

  function renderRecentActivity({ recentUsers, recentReports, recentAuditLogs }) {
    let html = '';
    const items = [];

    (recentAuditLogs || []).forEach(log => {
      items.push({
        user: log.admin ? `${log.admin.firstName} (${log.admin.role})` : 'Sistema',
        action: log.action,
        details: JSON.stringify(log.details || {}),
        time: new Date(log.createdAt),
      });
    });

    (recentUsers || []).forEach(u => {
      items.push({
        user: `${u.firstName} ${u.lastName}`,
        action: 'NUEVO_REGISTRO',
        details: `@${u.handle || 'sin-handle'}`,
        time: new Date(u.createdAt),
      });
    });

    items.sort((a, b) => b.time - a.time);

    if (items.length === 0) {
      html = '<tr><td colspan="4" class="text-center py-4">No hay actividad reciente registrada.</td></tr>';
    } else {
      items.slice(0, 8).forEach(item => {
        html += `
          <tr>
            <td><strong>${item.user}</strong></td>
            <td><span class="role-badge role-admin">${item.action}</span></td>
            <td>${item.details}</td>
            <td>${item.time.toLocaleString()}</td>
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
              <div style="display:flex; gap:6px;">
                <button class="btn btn-secondary btn-sm" onclick="editUniversityModal('${u.id}')">✏️ Editar</button>
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
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
          <div class="form-group">
            <label>Nombre de la Institución *</label>
            <input type="text" id="m-uni-name" class="form-input" required value="${uni.name || ''}" placeholder="Ej: Universidad Autónoma de Coahuila">
          </div>
          <div class="form-group">
            <label>Dominio Institucional * ${id ? '(No editable)' : ''}</label>
            <input type="text" id="m-uni-domain" class="form-input" required ${id ? 'readonly' : ''} value="${uni.domain || ''}" placeholder="Ej: uadec.edu.mx">
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
            <label>Ciudad</label>
            <input type="text" id="m-uni-city" class="form-input" value="${uni.city || ''}" placeholder="Saltillo">
          </div>
          <div class="form-group">
            <label>Estado</label>
            <input type="text" id="m-uni-state" class="form-input" value="${uni.state || ''}" placeholder="Coahuila">
          </div>
          <div class="form-group">
            <label>País</label>
            <input type="text" id="m-uni-country" class="form-input" value="${uni.country || 'Mexico'}">
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
          <label>Fotos de Portada del Campus (${photos.length})</label>
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
        const payload = {
          name: document.getElementById('m-uni-name').value,
          domain: document.getElementById('m-uni-domain').value,
          acronym: document.getElementById('m-uni-acronym').value,
          type: document.getElementById('m-uni-type').value,
          status: document.getElementById('m-uni-status').value,
          primaryColor: pText.value,
          secondaryColor: sText.value,
          website: document.getElementById('m-uni-website').value,
          logoUrl: document.getElementById('m-uni-logo').value,
          city: document.getElementById('m-uni-city').value,
          state: document.getElementById('m-uni-state').value,
          country: document.getElementById('m-uni-country').value,
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
      showToast(res.message);
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

  function renderAnalyticsCharts(data) {
    // 0. Hero Chart: Activity Trend & Engagement (Full Width)
    const ctxTrend = document.getElementById('chart-activity-trend');
    if (ctxTrend) {
      if (chartInstances.trend) chartInstances.trend.destroy();
      chartInstances.trend = new Chart(ctxTrend, {
        type: 'bar',
        data: {
          labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'],
          datasets: [{
            type: 'line',
            label: 'Usuarios Activos Diarios',
            data: [120, 240, 310, 464],
            borderColor: '#60a5fa',
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            yAxisID: 'y'
          }, {
            type: 'bar',
            label: 'Mensajes & Coincidencias',
            data: [450, 890, 1420, 1980],
            backgroundColor: 'rgba(192, 132, 252, 0.5)',
            borderRadius: 6,
            yAxisID: 'y1'
          }, {
            type: 'bar',
            label: 'Hangouts Creados',
            data: [12, 28, 45, 62],
            backgroundColor: 'rgba(52, 211, 153, 0.6)',
            borderRadius: 6,
            yAxisID: 'y'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8', font: { weight: '600' } } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { type: 'linear', position: 'left', ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y1: { type: 'linear', position: 'right', ticks: { color: '#c084fc' }, grid: { display: false } }
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
          labels: data.growthTrend ? data.growthTrend.map(d => d.date) : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
          datasets: [{
            label: 'Usuarios Totales',
            data: data.growthTrend ? data.growthTrend.map(d => d.users) : [50, 110, 190, 280, 370, 464],
            borderColor: '#3d7bff',
            backgroundColor: 'rgba(61, 123, 255, 0.15)',
            fill: true,
            tension: 0.4
          }, {
            label: 'Usuarios Activos',
            data: data.growthTrend ? data.growthTrend.map(d => d.active) : [40, 95, 160, 240, 330, 410],
            borderColor: '#22c55e',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { labels: { color: '#94a3b8' } } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    // 2. University Breakdown Chart (2-Col)
    const ctxUni = document.getElementById('chart-uni-breakdown');
    if (ctxUni) {
      if (chartInstances.uni) chartInstances.uni.destroy();
      chartInstances.uni = new Chart(ctxUni, {
        type: 'bar',
        data: {
          labels: data.uniBreakdown ? data.uniBreakdown.map(u => u.name) : ['UANE', 'ITESM', 'UAdC', 'UANL', 'Tec Saltillo', 'Ibero'],
          datasets: [{
            label: 'Estudiantes Registrados',
            data: data.uniBreakdown ? data.uniBreakdown.map(u => u.students) : [145, 98, 86, 62, 45, 28],
            backgroundColor: ['#3d7bff', '#e04155', '#fbbf24', '#c084fc', '#22c55e', '#38bdf8'],
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#94a3b8' }, grid: { display: false } }
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
              data.kpis?.verifiedUsers || 14,
              data.kpis?.creatorUsers || 8,
              12,
              5
            ],
            backgroundColor: ['#c084fc', '#fbbf24', '#4ade80', '#60a5fa'],
            borderWidth: 2,
            borderColor: '#121827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
        }
      });
    }

    // 4. Events Categories Polar Area Chart (3-Col)
    const ctxCat = document.getElementById('chart-event-categories');
    if (ctxCat) {
      if (chartInstances.cat) chartInstances.cat.destroy();
      chartInstances.cat = new Chart(ctxCat, {
        type: 'polarArea',
        data: {
          labels: ['Fiestas 🎉', 'Estudio 📚', 'Deportes ⚽', 'Gaming 🎮', 'Café ☕'],
          datasets: [{
            data: [24, 18, 15, 12, 9],
            backgroundColor: [
              'rgba(239, 68, 68, 0.7)',
              'rgba(59, 130, 246, 0.7)',
              'rgba(34, 197, 94, 0.7)',
              'rgba(168, 85, 247, 0.7)',
              'rgba(245, 158, 11, 0.7)'
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.08)' } } }
        }
      });
    }

    // 5. Matches & Connections Bar Chart (3-Col)
    const ctxMatch = document.getElementById('chart-match-activity');
    if (ctxMatch) {
      if (chartInstances.match) chartInstances.match.destroy();
      chartInstances.match = new Chart(ctxMatch, {
        type: 'bar',
        data: {
          labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
          datasets: [{
            label: 'Coincidencias de Chat',
            data: [65, 84, 112, 145, 198, 230, 175],
            backgroundColor: 'rgba(56, 189, 248, 0.65)',
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    // 6. Academic Area Radar Chart (Asymmetric 60%)
    const ctxRadar = document.getElementById('chart-career-radar');
    if (ctxRadar) {
      if (chartInstances.radar) chartInstances.radar.destroy();
      chartInstances.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Ingeniería ⚙️', 'Salud 🩺', 'Negocios 💼', 'Derecho ⚖️', 'Diseño 🎨', 'Ciencias 🔬'],
          datasets: [{
            label: 'Hombres',
            data: [85, 45, 65, 40, 50, 60],
            borderColor: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.25)'
          }, {
            label: 'Mujeres',
            data: [55, 90, 75, 65, 80, 55],
            borderColor: '#ec4899',
            backgroundColor: 'rgba(236, 72, 153, 0.25)'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } },
          scales: {
            r: {
              angleLines: { color: 'rgba(255,255,255,0.1)' },
              grid: { color: 'rgba(255,255,255,0.08)' },
              pointLabels: { color: '#cbd5e1', font: { size: 11, weight: '600' } },
              ticks: { display: false }
            }
          }
        }
      });
    }

    // 7. Device & Platform Distribution Doughnut (Asymmetric 40%)
    const ctxDevice = document.getElementById('chart-device-os');
    if (ctxDevice) {
      if (chartInstances.device) chartInstances.device.destroy();
      chartInstances.device = new Chart(ctxDevice, {
        type: 'doughnut',
        data: {
          labels: ['iOS App 🍎', 'Android App 🤖', 'Web App 🌐', 'Desktop 💻'],
          datasets: [{
            data: [52, 34, 10, 4],
            backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#a855f7'],
            borderWidth: 2,
            borderColor: '#121827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { color: '#94a3b8' } } }
        }
      });
    }

    // 8. Hourly Traffic Timeline Chart (Full Width)
    const ctxHourly = document.getElementById('chart-hourly-activity');
    if (ctxHourly) {
      if (chartInstances.hourly) chartInstances.hourly.destroy();
      chartInstances.hourly = new Chart(ctxHourly, {
        type: 'bar',
        data: {
          labels: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00', '00:00'],
          datasets: [{
            label: 'Tráfico de Estudiantes',
            data: [25, 60, 110, 95, 140, 280, 420, 390, 180],
            backgroundColor: [
              '#38bdf8', '#38bdf8', '#60a5fa', '#60a5fa',
              '#818cf8', '#a855f7', '#c084fc', '#ec4899', '#f43f5e'
            ],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
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
    status: 'PENDING',
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
        type: currentVerifTab,
        status: activeFilters.status
      });

      const { requests, stats, pendingCount } = res.data;
      cachedRequests = requests || [];

      // Update sidebar pending badge
      const badge = document.getElementById('badge-pending-verifications');
      if (badge) {
        if (pendingCount > 0) {
          badge.textContent = pendingCount;
          badge.classList.remove('hidden');
        } else {
          badge.classList.add('hidden');
        }
      }

      // Update Header Stats Scorecards
      if (stats) {
        document.getElementById('verif-stat-total').textContent = stats.totalCount || requests.length;
        document.getElementById('verif-stat-pending').textContent = stats.pendingCount || 0;
        document.getElementById('verif-stat-approved').textContent = stats.approvedCount || 0;
        document.getElementById('verif-stat-rejected').textContent = stats.rejectedCount || 0;

        document.getElementById('tab-count-all').textContent = stats.totalCount || requests.length;
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
        <div class="verif-file-widget" onclick="openCredentialModal('${photoUrl}', '${u.firstName} ${u.lastName}', '${req.type}')" title="Haz clic para inspeccionar documento">
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
        <div class="verif-file-widget" onclick="openCredentialModal('${photoUrl}', '${u.firstName} ${u.lastName}', '${req.type}')" title="Haz clic para inspeccionar documento">
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
        <div class="verif-file-widget" onclick="openCredentialModal('${photoUrl}', '${u.firstName} ${u.lastName}', '${req.type}')" title="Haz clic para inspeccionar documento">
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
              <button class="btn-verif-view flex-1" onclick="openCredentialModal('${photoUrl}', '${u.firstName} ${u.lastName}', '${req.type}')">
                👁️ Ver perfiles
              </button>
            ` : `
              <button class="btn-verif-view flex-1" onclick="openCredentialModal('${photoUrl}', '${u.firstName} ${u.lastName}', '${req.type}')">
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
          loadVerificationsView();
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
      loadVerificationsView();
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
          loadVerificationsView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    );
  };

  window.rejectVerifReq = (reqId) => {
    const reason = prompt('Motivo del rechazo de verificación (opcional):', 'Credencial no legible o información insuficiente.');
    if (reason !== null) {
      showConfirmDialog('Rechazar Solicitud', '¿Confirmas el rechazo de esta verificación?', async () => {
        try {
          await window.adminApi.rejectVerification(reqId, reason);
          showToast('Solicitud rechazada.');
          loadVerificationsView();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    }
  };

  // Run initialization
  initApp();
});
