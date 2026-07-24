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

    // Load initial view
    switchView('dashboard');

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
     ROUTING & NAVIGATION
     ========================================================================== */
  elements.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });

  function switchView(viewName) {
    state.currentView = viewName;

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

  // Run initialization
  initApp();
});
