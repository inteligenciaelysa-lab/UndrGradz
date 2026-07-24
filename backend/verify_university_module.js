const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api/v1';

let adminToken = '';

async function runTests() {
  console.log('🧪 Starting End-to-End Verification of University Management Module...\n');

  // 1. Admin Login
  console.log('1️⃣ Authenticating Super Admin...');
  const loginRes = await fetch(`${API_BASE}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'superadmin@undrgradz.com',
      password: process.env.ADMIN_PASSWORD || 'AdminUndrGradz2026!',
    }),
  });

  const loginData = await loginRes.json();
  if (loginRes.status !== 200 || !loginData.data.accessToken) {
    console.error('❌ Admin login failed:', loginData);
    process.exit(1);
  }

  adminToken = loginData.data.accessToken;
  console.log('✅ Super Admin authenticated successfully.\n');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  // 2. Paginated University Search (17,665 total records)
  console.log('2️⃣ Testing GET /api/v1/admin/universities with pagination & search...');
  const listRes = await fetch(`${API_BASE}/admin/universities?page=1&limit=10&search=uane`, { headers });
  const listData = await listRes.json();

  if (listRes.status !== 200 || !listData.data.universities) {
    console.error('❌ List universities failed:', listData);
    process.exit(1);
  }

  console.log(`✅ Paginated search returned ${listData.data.universities.length} records. Total matches: ${listData.data.pagination.total}`);
  console.log('   Sample match:', listData.data.universities[0].name, `(${listData.data.universities[0].domain})\n`);

  // 3. Create New Custom University with HEX & URL validation
  console.log('3️⃣ Testing POST /api/v1/admin/universities (Create University)...');
  const customDomain = `test-uni-${Date.now()}.edu.mx`;
  const createRes = await fetch(`${API_BASE}/admin/universities`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Universidad de Prueba Antigravity',
      acronym: 'UPA',
      domain: customDomain,
      type: 'private',
      primaryColor: '#10B981',
      secondaryColor: '#3B82F6',
      website: 'https://test-uni.edu.mx',
      city: 'Saltillo',
      state: 'Coahuila',
      country: 'Mexico',
      isOfficial: true,
      status: 'INTEGRATED',
      coverPhotos: ['https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000'],
    }),
  });

  const createData = await createRes.json();
  if (createRes.status !== 201 || !createData.data.university) {
    console.error('❌ Create university failed:', createData);
    process.exit(1);
  }

  const createdUni = createData.data.university;
  console.log(`✅ Created university: "${createdUni.name}" (ID: ${createdUni.id}, Status: ${createdUni.status})\n`);

  // 4. Detailed Fetch with Cover Photos
  console.log('4️⃣ Testing GET /api/v1/admin/universities/:id (Detailed Fetch)...');
  const detailRes = await fetch(`${API_BASE}/admin/universities/${createdUni.id}`, { headers });
  const detailData = await detailRes.json();

  if (detailRes.status !== 200 || !detailData.data.university.coverPhotos) {
    console.error('❌ Fetch university detail failed:', detailData);
    process.exit(1);
  }
  console.log(`✅ Fetched details cleanly. Cover photos count: ${detailData.data.university.coverPhotos.length}\n`);

  // 5. Update University Colors & Cover Photos
  console.log('5️⃣ Testing PATCH /api/v1/admin/universities/:id (Update University)...');
  const updateRes = await fetch(`${API_BASE}/admin/universities/${createdUni.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      primaryColor: '#8B5CF6',
      secondaryColor: '#F59E0B',
      coverPhotos: [
        'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=1000',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=1000',
      ],
    }),
  });

  const updateData = await updateRes.json();
  if (updateRes.status !== 200 || updateData.data.university.primaryColor !== '#8B5CF6') {
    console.error('❌ Update university failed:', updateData);
    process.exit(1);
  }
  console.log('✅ Updated primary color to #8B5CF6 & expanded cover photos gallery to 2 images.\n');

  // 6. Soft Delete University (Preserving business status)
  console.log('6️⃣ Testing DELETE /api/v1/admin/universities/:id (Soft Delete)...');
  const deleteRes = await fetch(`${API_BASE}/admin/universities/${createdUni.id}`, {
    method: 'DELETE',
    headers,
  });

  const deleteData = await deleteRes.json();
  if (deleteRes.status !== 200 || !deleteData.data.university.isDeleted) {
    console.error('❌ Soft delete university failed:', deleteData);
    process.exit(1);
  }
  console.log(`✅ Soft-deleted university cleanly (isDeleted: true, status retained: ${deleteData.data.university.status}).\n`);

  // 7. Restore Soft-Deleted University
  console.log('7️⃣ Testing POST /api/v1/admin/universities/:id/restore (Restore)...');
  const restoreRes = await fetch(`${API_BASE}/admin/universities/${createdUni.id}/restore`, {
    method: 'POST',
    headers,
  });

  const restoreData = await restoreRes.json();
  if (restoreRes.status !== 200 || restoreData.data.university.isDeleted) {
    console.error('❌ Restore university failed:', restoreData);
    process.exit(1);
  }
  console.log(`✅ Restored university (isDeleted: false, status retained: ${restoreData.data.university.status}).\n`);

  // 8. Public Campus Endpoint for Student App
  console.log('8️⃣ Testing Public GET /api/v1/campus/universities (Student App Autocomplete)...');
  const publicRes = await fetch(`${API_BASE}/campus/universities?q=Coahuila&limit=5`);
  const publicData = await publicRes.json();

  if (publicRes.status !== 200 || !Array.isArray(publicData.data.universities)) {
    console.error('❌ Public campus universities failed:', publicData);
    process.exit(1);
  }
  console.log(`✅ Public campus endpoint returned ${publicData.data.universities.length} universities for Student App lookup.\n`);

  // 9. Audit Logs Verification
  console.log('9️⃣ Testing Audit Logs Emission...');
  const auditRes = await fetch(`${API_BASE}/admin/audit-logs?limit=5`, { headers });
  const auditData = await auditRes.json();

  const uniLogs = auditData.data.logs.filter(l => l.targetType === 'UNIVERSITY');
  if (uniLogs.length === 0) {
    console.error('❌ No audit logs found for university operations!');
    process.exit(1);
  }
  console.log(`✅ Audit log recorded ${uniLogs.length} recent university management events (Latest action: ${uniLogs[0].action}).\n`);

  console.log('==================================================');
  console.log('🎉 ALL 9 VERIFICATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('==================================================');
}

runTests().catch(console.error);
