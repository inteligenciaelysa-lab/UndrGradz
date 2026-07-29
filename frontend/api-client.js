/**
 * UndrGradz Frontend API Client
 * Centralized HTTP Fetch Interceptor and Socket.io Wrapper.
 */

// El backend corre en el puerto 3000. Derivamos el host del backend del mismo
// host desde el que se abre la app, para que funcione en cualquier contexto de
// desarrollo local sin depender de un túnel efímero:
//   - http://localhost:5500  (Live Server)   -> localhost:3000
//   - file:// (index.html directo)           -> localhost:3000  (hostname vacío)
//   - http://192.168.x.x:5500 (celular/LAN)  -> 192.168.x.x:3000
// Solo cuando la app se sirve desde un dominio remoto real se usa el túnel público.
const HOST = window.location.hostname; // '' cuando es file://
const IS_LOCAL =
  HOST === '' ||
  HOST === 'localhost' ||
  HOST === '127.0.0.1' ||
  /^192\.168\./.test(HOST) ||
  /^10\./.test(HOST) ||
  /^172\.(1[6-9]|2\d|3[01])\./.test(HOST) ||
  window.location.protocol === 'file:';

const API_HOST = HOST || 'localhost'; // file:// deja hostname vacío -> localhost

// Detección segura del entorno móvil nativo Capacitor (Android/iOS)
const IS_CAPACITOR = !!(
  (window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform()) ||
  (window.Capacitor && window.Capacitor.platform && window.Capacitor.platform !== 'web') ||
  window.location.protocol === 'capacitor:' ||
  (window.Capacitor && (window.Capacitor.platform === 'ios' || window.Capacitor.platform === 'android'))
);

// Túnel público o URL remota de producción
const REMOTE_URL = 'https://charger-assessed-solar-echo.trycloudflare.com';

// En App Android/iOS Capacitor se utiliza la URL pública remota (Cloudflare Tunnel).
// En Web Local se utiliza el puerto 3000 local del host.
// En Web Producción se utiliza la URL remota.
const BASE_URL = (IS_CAPACITOR || (window.Capacitor && window.Capacitor.platform !== 'web'))
  ? `${REMOTE_URL}/api/v1`
  : (IS_LOCAL ? `http://${API_HOST}:3000/api/v1` : `${REMOTE_URL}/api/v1`);

const SOCKET_URL = (IS_CAPACITOR || (window.Capacitor && window.Capacitor.platform !== 'web'))
  ? REMOTE_URL
  : (IS_LOCAL ? `http://${API_HOST}:3000` : REMOTE_URL);

console.log("IS_CAPACITOR:", IS_CAPACITOR);
console.log("BASE_URL:", BASE_URL);
console.log("SOCKET_URL:", SOCKET_URL);

class ApiClient {
  constructor() {
    this.socket = null;
  }

  getAccessToken() {
    return localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('ugz_token') || sessionStorage.getItem('accessToken') || sessionStorage.getItem('token');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setAccessToken(token) {
    if (token) localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token) {
    if (token) localStorage.setItem('refreshToken', token);
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token');
    localStorage.removeItem('ugz_token');
    localStorage.removeItem('userPro');
  }

  /**
   * Universal HTTP Fetch Wrapper with Automatic Auth Headers & Token Refresh Interception.
   */
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Prepare headers & credentials
    options.headers = options.headers || {};
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.body = JSON.stringify(options.body);
    }
    options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
    options.credentials = 'include';
    
    const token = this.getAccessToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let response = await fetch(url, options);

      // Token expiration / unauthorized interception
      if (response.status === 401 && token) {
        console.warn('⚠️ Access Token expired. Attempting token refresh...');
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request with new token
          options.headers['Authorization'] = `Bearer ${this.getAccessToken()}`;
          response = await fetch(url, options);
        } else {
          // Refresh failed — clear invalid tokens so future requests don't keep sending expired header
          console.warn('⚠️ Token refresh returned false. Clearing invalid session tokens.');
          this.clearTokens();
          throw new Error('Session expired');
        }
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error(`❌ API Request Error [${endpoint}]:`, error.message);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Refreshes the JWT Access Token using cookies or body payload fallback.
   */
  async refreshToken() {
    try {
      const storedRefresh = this.getRefreshToken();
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Refresh-Token': storedRefresh || ''
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefresh || '' })
      });
      const data = await response.json();
      if (response.ok && data.status === 'success' && data.data) {
        if (data.data.accessToken) this.setAccessToken(data.data.accessToken);
        if (data.data.refreshToken) this.setRefreshToken(data.data.refreshToken);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  async register(registrationData) {
    const result = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationData)
    });
    if (result.data && result.data.accessToken) {
      this.setAccessToken(result.data.accessToken);
    }
    if (result.data && result.data.refreshToken) {
      this.setRefreshToken(result.data.refreshToken);
    }
    return result.data;
  }

  async login(email, password) {
    const result = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (result.data && result.data.accessToken) {
      this.setAccessToken(result.data.accessToken);
    }
    if (result.data && result.data.refreshToken) {
      this.setRefreshToken(result.data.refreshToken);
    }
    return result.data;
  }

  async logout() {
    this.clearTokens();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ==========================================
  // USER / PROFILE ROUTES
  // ==========================================
  async getMe() {
    const result = await this.request('/users/me');
    return result.data.user;
  }

  async updateProfile(profileData) {
    const result = await this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return result.data.profile;
  }

  async updateLocation(latitude, longitude) {
    const result = await this.request('/users/me/location', {
      method: 'PATCH',
      body: JSON.stringify({ latitude, longitude })
    });
    return result.data.profile;
  }

  async updateGhostMode(isGhostMode) {
    const result = await this.request('/users/me/ghost-mode', {
      method: 'PATCH',
      body: JSON.stringify({ isGhostMode })
    });
    return result.data.profile;
  }

  /**
   * Uploads a file directly using the signed URL utility
   */
  async uploadPhoto(file) {
    // 1. Ask API for Signed URL
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const contentType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
    
    const signedData = await this.request('/users/me/photos', {
      method: 'POST',
      body: JSON.stringify({ contentType })
    });

    const { uploadUrl, publicUrl, photo } = signedData.data;

    // 2. Upload file directly to mock/real storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image file');
    }

    return photo;
  }

  async deletePhoto(photoId) {
    await this.request(`/users/me/photos/${photoId}`, {
      method: 'DELETE'
    });
    return true;
  }

  // ==========================================
  // MATCHES & CAMPUS SWIPES ROUTES
  // ==========================================
  async getCrushFeed() {
    const result = await this.request('/campus/crush-feed');
    return result.data;
  }

  async registerSwipe(receiverId, type) {
    const result = await this.request('/campus/swipe', {
      method: 'POST',
      body: JSON.stringify({ receiverId, type })
    });
    return result.data;
  }

  async getStats() {
    const result = await this.request('/campus/stats');
    return result.data;
  }

  async recordProfileView(viewedUserId) {
    if (!viewedUserId) return;
    try {
      const result = await this.request('/campus/views', {
        method: 'POST',
        body: JSON.stringify({ viewedUserId })
      });
      return result.data;
    } catch (err) {
      console.warn("Failed to record profile view:", err);
    }
  }

  async getProfileViews() {
    const result = await this.request('/campus/views');
    return result.data.views;
  }

  async getAdmirers() {
    const result = await this.request('/campus/admirers');
    return result.data.admirers;
  }

  async getSentLikes() {
    const result = await this.request('/campus/sent-likes');
    return result.data.sentLikes || result.data.likes;
  }

  // ==========================================
  // NETWORK & FRIENDS ROUTES
  // ==========================================
  async sendFriendRequest(receiverId) {
    const result = await this.request('/network/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId })
    });
    return result.data;
  }

  async respondFriendRequest(senderId, accept) {
    const result = await this.request('/network/respond', {
      method: 'POST',
      body: JSON.stringify({ senderId, accept })
    });
    return result.data;
  }

  async getFriends() {
    const result = await this.request('/network/');
    return result.data.friends;
  }

  async getPendingFriendRequests() {
    const result = await this.request('/network/pending');
    return result.data.requests;
  }

  async getReferralStats() {
    const result = await this.request('/network/referrals');
    return result.data;
  }

  async redeemReferral(referralCode) {
    const result = await this.request('/network/redeem-referral', {
      method: 'POST',
      body: JSON.stringify({ referralCode })
    });
    return result.data;
  }

  async getFriendsMapLocations() {
    const result = await this.request('/network/map');
    return result.data.locations;
  }

  // ==========================================
  // CAMPUS EVENTS ROUTES (HANGOUTS)
  // ==========================================
  async createEvent(eventData) {
    const result = await this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    return result.data.event;
  }

  async getEvents() {
    const result = await this.request('/events');
    return result.data.events;
  }

  async joinEvent(eventId) {
    const result = await this.request(`/events/${eventId}/join`, {
      method: 'POST'
    });
    return result.data;
  }

  async leaveEvent(eventId) {
    const result = await this.request(`/events/${eventId}/leave`, {
      method: 'POST'
    });
    return result.data;
  }

  async deleteEvent(eventId) {
    const result = await this.request(`/events/${eventId}`, {
      method: 'DELETE'
    });
    return result.data;
  }

  async updateEvent(eventId, eventData) {
    const result = await this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
    return result.data.event;
  }

  // ==========================================
  // CHAT HISTORY ROUTES
  // ==========================================
  async getConversations() {
    const result = await this.request('/chats/conversations');
    return result.data.conversations;
  }

  async getChatMessages(matchId) {
    const url = `/chats/${matchId}/messages`;
    const timestamp = new Date().toISOString();
    console.log(`[CHAT GET START] timestamp: ${timestamp} | matchId: ${matchId} | url: ${url}`);
    try {
      const result = await this.request(url);
      const msgs = result.data ? result.data.messages : [];
      console.log(`[CHAT GET END] timestamp: ${timestamp} | matchId: ${matchId} | response count: ${msgs ? msgs.length : 0} | message IDs:`, msgs ? msgs.map(m => m.id) : []);
      return msgs;
    } catch (err) {
      console.error(`[CHAT GET ERROR] url: ${url} failed:`, err);
      throw err;
    }
  }

  async sendChatMessage(matchId, content, type = 'TEXT', mediaUrl = null, duration = null) {
    const url = `/chats/${matchId}/messages`;
    console.log(`[CHAT DEBUG] POST URL: ${url} | matchId: ${matchId} | content: "${content}"`);
    try {
      const result = await this.request(url, {
        method: 'POST',
        body: JSON.stringify({ content, type, mediaUrl, duration })
      });
      const message = result.data ? result.data.message : result;
      console.log(`[CHAT DEBUG] SERVER CONFIRMED MESSAGE | DATABASE MESSAGE ID: ${message ? message.id : 'N/A'}`, message);
      return message;
    } catch (err) {
      console.error(`[CHAT DEBUG] SERVER REJECTED MESSAGE | POST URL ${url} failed:`, err);
      throw err;
    }
  }

  async searchUsers(query) {
    const result = await this.request(`/users/search?q=${encodeURIComponent(query)}`);
    return result.data.users;
  }

  async sendFriendRequest(receiverId) {
    const result = await this.request('/network/request', {
      method: 'POST',
      body: JSON.stringify({ receiverId })
    });
    return result.data;
  }

  async createConversation(partnerId) {
    const result = await this.request('/chats/conversations', {
      method: 'POST',
      body: JSON.stringify({ partnerId })
    });
    return result.data;
  }

  // ==========================================
  // BILLING & PREMIUM ROUTES
  // ==========================================
  async purchasePremium(tier) {
    const result = await this.request('/billing/purchase', {
      method: 'POST',
      body: JSON.stringify({ tier })
    });
    return result.data;
  }

  async activateBoost() {
    const result = await this.request('/billing/boost', {
      method: 'POST'
    });
    return result.data;
  }

  // ==========================================
  // SOCKET.IO REALTIME SERVICE
  // ==========================================
  /**
   * Initializes the Socket.io client and registers event handlers.
   * Required library: <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
   */
  connectSocket(callbacks = {}) {
    this.socketCallbacks = Object.assign(this.socketCallbacks || {}, callbacks);

    const token = this.getAccessToken();
    if (!token) {
      console.error('❌ Cannot initialize socket connection: Missing token');
      return;
    }

    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket is already connected and active.');
      if (callbacks.onConnected) callbacks.onConnected();
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
    }

    // Initialize Socket.io client
    if (typeof io === 'undefined') {
      console.error('❌ Socket.io client library not loaded. Add Socket.io CDN script tag to HTML.');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected successfully!');
      if (typeof window !== 'undefined' && window.curChatId && !window.curChatId.startsWith('biz_') && !window.curChatId.startsWith('net_') && !window.curChatId.startsWith('clist-') && !window.curChatId.includes('moment')) {
        this.joinChatRoom(window.curChatId);
      }
      if (this.socketCallbacks.onConnected) this.socketCallbacks.onConnected();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected.');
      if (this.socketCallbacks.onDisconnected) this.socketCallbacks.onDisconnected();
    });

    this.socket.on('error', (err) => {
      console.error('❌ Socket server error:', err);
      if (this.socketCallbacks.onError) this.socketCallbacks.onError(err);
    });

    // Chat events
    this.socket.on('messageReceived', (message) => {
      if (this.socketCallbacks.onMessageReceived) this.socketCallbacks.onMessageReceived(message);
    });

    this.socket.on('typingStatus', (status) => {
      if (this.socketCallbacks.onTypingStatus) this.socketCallbacks.onTypingStatus(status);
    });

    // Live Match event
    this.socket.on('newMatch', (matchData) => {
      console.log('🎉 Live match event received via WebSocket:', matchData);
      if (this.socketCallbacks.onMatchCreated) this.socketCallbacks.onMatchCreated(matchData);
    });

    this.socket.on('newMatch_broadcast', (data) => {
      if (!data) return;
      var currentUserId = (typeof userPro !== 'undefined' && userPro.id) || null;
      if (!currentUserId && typeof apiClient !== 'undefined' && apiClient.getAccessToken()) {
        try {
          var token = apiClient.getAccessToken();
          var payload = JSON.parse(atob(token.split('.')[1]));
          currentUserId = payload.userId;
        } catch(e) {}
      }
      if (currentUserId && this.socketCallbacks.onMatchCreated) {
        if (data.userAId === currentUserId) {
          console.log('🎉 Matched userA via broadcast:', data.payloadA);
          this.socketCallbacks.onMatchCreated(data.payloadA);
        } else if (data.userBId === currentUserId) {
          console.log('🎉 Matched userB via broadcast:', data.payloadB);
          this.socketCallbacks.onMatchCreated(data.payloadB);
        }
      }
    });

    // Map/Geolocation events
    this.socket.on('friendLocationUpdated', (data) => {
      if (this.socketCallbacks.onFriendLocationUpdated) this.socketCallbacks.onFriendLocationUpdated(data);
    });

    this.socket.on('friendLocationRemoved', (data) => {
      if (this.socketCallbacks.onFriendLocationRemoved) this.socketCallbacks.onFriendLocationRemoved(data);
    });

    this.socket.on('universityCatalogUpdated', (data) => {
      console.log('🏛️ Received live universityCatalogUpdated notification:', data);
      if (data && data.domain && typeof UNI !== 'undefined' && UNI) {
        var existing = UNI[data.domain] || {};
        UNI[data.domain] = Object.assign({}, existing, {
          id: data.id || existing.id,
          domain: data.domain,
          t: data.type || existing.t || 'public',
          type: data.type || existing.type || 'public',
          name: data.name || existing.name,
          acronym: data.acronym || existing.acronym,
          p: data.primaryColor || existing.p || existing.primaryColor || '#6366f1',
          primaryColor: data.primaryColor || existing.primaryColor || existing.p || '#6366f1',
          p2: data.secondaryColor || existing.p2 || existing.secondaryColor || '#ec4899',
          secondaryColor: data.secondaryColor || existing.secondaryColor || existing.p2 || '#ec4899',
          ig: data.website || existing.ig || existing.website || '',
          website: data.website || existing.website || existing.ig || '',
          logoUrl: data.logoUrl || existing.logoUrl || '',
          city: data.city || existing.city || '',
          state: data.state || existing.state || '',
          country: data.country || existing.country || 'Mexico',
          isOfficial: data.isOfficial !== undefined ? data.isOfficial : (existing.isOfficial || false),
          status: data.status || existing.status || 'AVAILABLE',
          coverPhotos: (Array.isArray(data.coverPhotos) && data.coverPhotos.length > 0) ? data.coverPhotos : (existing.coverPhotos || [])
        });
      }
      if (typeof _loadUniversities === 'function') {
        _loadUniversities().then(() => {
          if (typeof updateProfileUI === 'function') try { updateProfileUI(); } catch(e){}
          if (typeof renderCrushPreview === 'function') try { renderCrushPreview(); } catch(e){}
        }).catch(() => {});
      }
    });

    this.socket.on('userVerificationUpdated', (data) => {
      console.log('🎓 Received live userVerificationUpdated notification:', data);
      if (data) {
        if (typeof userPro !== 'undefined' && userPro) {
          if (data.status === 'APPROVED') {
            if (typeof verified !== 'undefined') verified = true;
            userPro.isVerified = true;
            userPro.badgeColor = data.badgeColor || '#1d9bf0';
            var vb = document.getElementById('vbadge');
            if (vb) {
              vb.style.display = 'flex';
              vb.style.background = '#1d9bf0';
              vb.title = 'ID Verified (Blue Badge)';
            }
            var box = document.getElementById('verify-box');
            if (box) {
              box.innerHTML = '✅ Insignia Azul Verificada (Credencial Aprobada 💙)';
            }
          } else if (data.status === 'REJECTED') {
            if (typeof verified !== 'undefined') verified = false;
            userPro.isVerified = false;
            var box = document.getElementById('verify-box');
            if (box) {
              box.innerHTML = '⚠️ Credencial Rechazada — ' + (data.message || 'Intenta subir una foto clara.');
            }
          }
        }
        if (typeof pushNotification === 'function') {
          try {
            pushNotification(data.message || (data.status === 'APPROVED' ? '🎓 ¡Tu credencial fue aprobada! Insignia azul (Blue Badge) otorgada.' : '⚠️ Solicitud de verificación no aprobada.'), data.status === 'APPROVED' ? 'success' : 'warning');
          } catch(e){}
        }

        if (typeof notifData !== 'undefined' && Array.isArray(notifData)) {
          notifData.unshift({
            type: 'system',
            from: 'Undrgradz Admin',
            handle: '@system',
            av: data.status === 'APPROVED' ? '💙' : '⚠️',
            color: data.status === 'APPROVED' ? '#1d9bf0' : '#ef4444',
            msg: data.message || (data.status === 'APPROVED' ? '¡Tu credencial ha sido aprobada! Has obtenido la Insignia Azul.' : 'Tu credencial no pudo ser validada.'),
            time: 'now',
            id: 'verif_' + Date.now()
          });
          if (typeof _updateNotifBadge === 'function') try { _updateNotifBadge(); } catch(e){}
        }
        if (typeof alert === 'function') {
          alert((data.title || 'Actualización de Verificación') + '\n\n' + data.message);
        }
        if (typeof updateProfileUI === 'function') try { updateProfileUI(); } catch(e){}
        if (typeof renderCrushPreview === 'function') try { renderCrushPreview(); } catch(e){}
      }
    });
  }

  /**
   * Socket emitter actions
   */
  joinChatRoom(matchId) {
    if (this.socket) {
      this.socket.emit('joinRoom', { matchId });
    }
  }

  leaveChatRoom(matchId) {
    if (this.socket) {
      this.socket.emit('leaveRoom', { matchId });
    }
  }

  async sendChatMessage(matchId, content, type = 'TEXT', mediaUrl = null, duration = null) {
    const timestamp = new Date().toISOString();
    console.log(`[CHAT DUPLICATE DEBUG] POST /messages START | timestamp: ${timestamp} | matchId: ${matchId} | content: "${content}"`);
    try {
      const result = await this.request(`/chats/${matchId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content, type, mediaUrl, duration })
      });
      const savedMsg = result.data ? result.data.message : result;
      console.log(`[CHAT DUPLICATE DEBUG] POST /messages END | timestamp: ${new Date().toISOString()} | POST message ID returned: ${savedMsg ? savedMsg.id : 'NONE'}`);
      return savedMsg;
    } catch (err) {
      console.warn('⚠️ HTTP message send warning:', err);
      throw err;
    }
  }

  async getChatAudioUploadUrl(matchId, contentType = 'audio/webm') {
    return this.request(`/chats/${matchId}/audio-url`, {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    });
  }

  async uploadAudioToStorage(uploadUrl, audioBlob) {
    let targetUrl = uploadUrl;
    if ((IS_CAPACITOR || !IS_LOCAL) && targetUrl && targetUrl.includes('localhost:3000')) {
      targetUrl = targetUrl.replace('http://localhost:3000', REMOTE_URL);
    }
    console.log('[AUDIO] Uploading audio blob (size: ' + audioBlob.size + ') to target URL:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': audioBlob.type || 'audio/webm',
      },
      body: audioBlob,
    });
    if (!response.ok) {
      throw new Error(`Upload failed with status ${response.status}`);
    }
    return true;
  }

  sendTypingStatus(matchId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { matchId, isTyping });
    }
  }

  sendLiveLocation(latitude, longitude) {
    if (this.socket) {
      this.socket.emit('updateLocation', { latitude, longitude });
    }
  }
}

// Bind to window to allow global import in Vanilla JS SPA
window.apiClient = new ApiClient();
