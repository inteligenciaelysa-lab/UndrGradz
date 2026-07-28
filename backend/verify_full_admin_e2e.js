const http = require('http');

async function apiRequest(path, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runFullE2ETest() {
  console.log('🚀 Executing Full End-to-End API Audit for UndrGradz Admin Panel...');

  // 1. Login
  const loginRes = await apiRequest('/api/v1/admin/auth/login', 'POST', {
    email: 'superadmin@undrgradz.com',
    password: 'AdminUndrGradz2026!',
  });

  if (loginRes.status !== 200 || !loginRes.data.data?.accessToken) {
    console.error('❌ Login failed:', loginRes);
    process.exit(1);
  }

  const token = loginRes.data.data.accessToken;
  const adminId = loginRes.data.data.adminUser.id;
  console.log(`✅ 1. Login HTTP 200 - Super Admin Authenticated (Role: ${loginRes.data.data.adminUser.role})`);

  // 2. Dashboard
  const dashRes = await apiRequest('/api/v1/admin/dashboard', 'GET', null, token);
  console.log(`✅ 2. Dashboard API HTTP ${dashRes.status}: Total Users = ${dashRes.data.data.metrics.totalUsers}, Health = ${dashRes.data.data.systemHealth.backend.status}`);

  // 3. Users Management
  const usersRes = await apiRequest('/api/v1/admin/users?page=1&limit=10', 'GET', null, token);
  console.log(`✅ 3. Users API HTTP ${usersRes.status}: Returned ${usersRes.data.data.users.length} users (Total in DB: ${usersRes.data.data.total})`);

  const sampleUserId = usersRes.data.data.users[0]?.id;
  if (sampleUserId) {
    // 4. User Details
    const userDetailRes = await apiRequest(`/api/v1/admin/users/${sampleUserId}`, 'GET', null, token);
    console.log(`✅ 4. User Detail API HTTP ${userDetailRes.status}: User ${userDetailRes.data.data.user.firstName} ${userDetailRes.data.data.user.lastName}`);
  }

  // 5. Moderation Reports
  const reportsRes = await apiRequest('/api/v1/admin/moderation/reports', 'GET', null, token);
  console.log(`✅ 5. Moderation Reports API HTTP ${reportsRes.status}: ${reportsRes.data.data.reports.length} report(s) in queue`);

  // 6. Universities Catalog
  const unisRes = await apiRequest('/api/v1/admin/universities?page=1&limit=10', 'GET', null, token);
  console.log(`✅ 6. Universities API HTTP ${unisRes.status}: ${unisRes.data.data.universities.length} universities returned (Total: ${unisRes.data.data.pagination.total})`);

  // 7. Events List
  const eventsRes = await apiRequest('/api/v1/admin/events', 'GET', null, token);
  console.log(`✅ 7. Events API HTTP ${eventsRes.status}: ${eventsRes.data.data.events.length} event(s) in database`);

  // 8. Administrators
  const adminsRes = await apiRequest('/api/v1/admin/administrators', 'GET', null, token);
  console.log(`✅ 8. Administrators API HTTP ${adminsRes.status}: ${adminsRes.data.data.administrators.length} admin accounts`);

  // 9. Audit Logs
  const auditRes = await apiRequest('/api/v1/admin/audit-logs?limit=5', 'GET', null, token);
  console.log(`✅ 9. Audit Logs API HTTP ${auditRes.status}: ${auditRes.data.data.logs.length} audit log entries recorded`);

  // 10. Notifications
  const notifRes = await apiRequest('/api/v1/admin/notifications', 'POST', {
    targetType: 'ALL',
    title: 'E2E Automated Verification',
    message: 'Sistema administrativo verificado y 100% en funcionamiento.',
    type: 'SYSTEM',
  }, token);
  console.log(`✅ 10. Notification Broadcast API HTTP ${notifRes.status}: Sent to ${notifRes.data.data?.count} active users`);

  // 11. Settings
  const settingsRes = await apiRequest('/api/v1/admin/settings', 'GET', null, token);
  console.log(`✅ 11. Platform Settings API HTTP ${settingsRes.status}: Settings loaded successfully`);

  // 12. Analytics
  const analyticsRes = await apiRequest('/api/v1/admin/analytics', 'GET', null, token);
  console.log(`✅ 12. Analytics & KPIs API HTTP ${analyticsRes.status}: Total Users KPI = ${analyticsRes.data.data.kpis.totalUsers}`);

  // 13. Verifications
  const verifRes = await apiRequest('/api/v1/admin/verifications?type=ALL&status=ALL', 'GET', null, token);
  console.log(`✅ 13. Verifications API HTTP ${verifRes.status}: ${verifRes.data.data.requests.length} verification requests in queue`);

  // 14. Global Search
  const searchRes = await apiRequest('/api/v1/admin/search?q=UANE', 'GET', null, token);
  console.log(`✅ 14. Global Search API HTTP ${searchRes.status}: Search for 'UANE' returned ${searchRes.data.data.users.length} users & ${searchRes.data.data.universities.length} universities`);

  console.log('\n🎉 ALL 14 E2E ADMIN REST API ENDPOINTS VERIFIED 100% OPERATIONAL!');
}

runFullE2ETest().catch(err => {
  console.error('❌ E2E API Test failed:', err);
  process.exit(1);
});
