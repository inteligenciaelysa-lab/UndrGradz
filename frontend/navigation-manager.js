/**
 * UndrGradz Native Navigation & Gesture System for Capacitor (iOS & Android)
 * Centralized NavigationManager, SwipeBackController, and BottomSheetController.
 */
(function () {
  'use strict';

  const IS_IOS = !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios');
  const IS_ANDROID = !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android');

  const SECTION_LABELS = {
    hangouts: 'Planes',
    discover: 'Campus',
    unicrush: 'Campus',
    chats: 'Chats',
    uchats: 'Chats',
    profile: 'Mi Perfil',
    network: 'Red',
    alumnihub: 'Red',
    events: 'Eventos',
    wellness: 'Bienestar',
    premium: '✨ Go Premium',
    'biz-profile': 'Perfil Business'
  };

  class NavigationManagerClass {
    constructor() {
      this.sectionHistory = []; // Objects: [{ id: 'discover', label: 'Campus' }]
      this.activeChatId = null;
      this.isKeyboardOpen = false;
      this.isNavigating = false;
    }

    init() {
      // 1. Listen for Capacitor App backButton (Android hardware/virtual back button & gesture navigation)
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.addListener('backButton', () => {
          this.goBack({ source: 'android_hardware' });
        });
      }

      // 2. Listen for Keyboard events via Capacitor Keyboard plugin
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
        window.Capacitor.Plugins.Keyboard.addListener('keyboardWillShow', () => {
          this.isKeyboardOpen = true;
        });
        window.Capacitor.Plugins.Keyboard.addListener('keyboardWillHide', () => {
          this.isKeyboardOpen = false;
        });
      }

      // Fallback virtual keyboard state tracking via focus events
      document.addEventListener('focusin', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
          this.isKeyboardOpen = true;
        }
      });
      document.addEventListener('focusout', (e) => {
        if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) {
          setTimeout(() => {
            const active = document.activeElement;
            if (!active || !(active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
              this.isKeyboardOpen = false;
            }
          }, 100);
        }
      });
    }

    getSectionLabel(sectionId) {
      if (window.currentLang === 'es') {
        if (sectionId === 'hangouts') return 'Planes';
        if (sectionId === 'discover' || sectionId === 'unicrush') return 'Campus';
        if (sectionId === 'chats' || sectionId === 'uchats') return 'Chats';
        if (sectionId === 'profile') return 'Mi Perfil';
        if (sectionId === 'alumnihub' || sectionId === 'network') return 'Red';
      }
      return SECTION_LABELS[sectionId] || (sectionId ? sectionId.charAt(0).toUpperCase() + sectionId.slice(1) : '');
    }

    pushSectionHistory(sectionId, label) {
      if (!sectionId) return;
      const sectionLabel = label || this.getSectionLabel(sectionId);
      const entry = { id: sectionId, label: sectionLabel };

      if (this.sectionHistory.length === 0) {
        this.sectionHistory.push(entry);
        return;
      }
      const top = this.sectionHistory[this.sectionHistory.length - 1];
      if (top.id !== sectionId) {
        this.sectionHistory.push(entry);
      } else {
        top.label = sectionLabel;
      }
    }

    setActiveChat(chatId) {
      this.activeChatId = chatId;
    }

    getActiveChat() {
      return this.activeChatId;
    }

    getOpenModals() {
      const modalElements = document.querySelectorAll('.modal, [id$="-modal"], .edit-modal, .settings-modal, .mov');
      const openModals = [];
      modalElements.forEach((el) => {
        if (el.classList.contains('open') && el.style.display !== 'none') {
          openModals.push(el);
        }
      });
      return openModals;
    }

    getOpenSheets() {
      const sheetElements = document.querySelectorAll('.sheet, .bg-sheet, .gif-sheet, .open-sheet, .auth-panel');
      const openSheets = [];
      sheetElements.forEach((el) => {
        if ((el.classList.contains('open') || el.classList.contains('active')) && el.style.display !== 'none') {
          openSheets.push(el);
        }
      });
      return openSheets;
    }

    getOpenInternalView() {
      // 1. Check Hangouts sub-panels (only if sec-hangouts is currently active)
      const secHangouts = document.getElementById('sec-hangouts');
      if (secHangouts && secHangouts.classList.contains('active')) {
        const evpCreate = document.getElementById('evp-create');
        const evpMy = document.getElementById('evp-my');
        const evpJoined = document.getElementById('evp-joined');
        if ((evpCreate && evpCreate.classList.contains('active')) ||
            (evpMy && evpMy.classList.contains('active')) ||
            (evpJoined && evpJoined.classList.contains('active'))) {
          return {
            type: 'hangouts_subpanel',
            close: () => {
              if (typeof window.switchEvTab === 'function') window.switchEvTab('nearby');
            }
          };
        }
      }

      // 2. Check Campus / Discover sub-panels (only if sec-discover is currently active)
      const secDiscover = document.getElementById('sec-discover');
      if (secDiscover && secDiscover.classList.contains('active')) {
        const activeCpanel = document.querySelector('#sec-discover .cpanel.active');
        if (activeCpanel && activeCpanel.id && activeCpanel.id !== 'cpanel-swipe') {
          return {
            type: 'discover_subpanel',
            close: () => {
              if (typeof window.switchCrushTab === 'function') window.switchCrushTab('swipe');
            }
          };
        }
      }

      // 3. Check Profile sub-panels (only if sec-profile is currently active)
      const secProfile = document.getElementById('sec-profile');
      if (secProfile && secProfile.classList.contains('active')) {
        const activeProfBtn = document.querySelector('#sec-profile .ptab.active');
        if (activeProfBtn && activeProfBtn.id && activeProfBtn.id !== 'ptab-crush') {
          return {
            type: 'profile_subpanel',
            close: () => {
              if (typeof window.switchProfTab === 'function') window.switchProfTab('crush');
            }
          };
        }
      }

      return null;
    }

    canGoBack() {
      // Priority 1: Modals & Full-Screen Sheets (Settings, Notifications, Chat Settings, Create Chat)
      if (this.getOpenModals().length > 0) return true;

      // Priority 2: Bottom Sheets
      if (this.getOpenSheets().length > 0) return true;

      // Priority 3: Virtual Keyboard
      if (this.isKeyboardOpen && document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        return true;
      }

      // Priority 4: Internal Sub-Views
      if (this.getOpenInternalView()) return true;

      // Priority 5: Active Chat Window
      const chatWin = document.getElementById('cwin');
      if ((chatWin && chatWin.classList.contains('open')) || this.activeChatId) {
        return true;
      }

      // Priority 6: Main Section History
      if (this.sectionHistory.length > 1) {
        return true;
      }

      return false;
    }

    goBack(opts = {}) {
      if (this.isNavigating) return false;
      this.isNavigating = true;

      const releaseLock = () => {
        setTimeout(() => { this.isNavigating = false; }, 180);
      };

      try {
        // Priority 1: Open Modals / Full-Screen Sheets (#settings-modal, #notif-modal, #chat-settings-modal, #chat-create-menu)
        const openModals = this.getOpenModals();
        if (openModals.length > 0) {
          const topModal = openModals[openModals.length - 1];
          topModal.classList.remove('open');
          if (topModal.id === 'notif-modal' || topModal.id === 'chat-settings-modal' || topModal.id === 'chat-create-menu') {
            setTimeout(() => {
              if (topModal && topModal.parentElement) topModal.remove();
            }, 240);
          }
          releaseLock();
          return true;
        }

        // Priority 2: Open Bottom Sheets
        const openSheets = this.getOpenSheets();
        if (openSheets.length > 0) {
          const topSheet = openSheets[openSheets.length - 1];
          topSheet.classList.remove('open');
          topSheet.classList.remove('active');
          if (topSheet.id === 'bg-sheet' && typeof window.closeBookCover === 'function') {
            window.closeBookCover();
          }
          releaseLock();
          return true;
        }

        // Priority 3: Virtual Keyboard / Focused Input
        if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.isContentEditable)) {
          document.activeElement.blur();
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard) {
            window.Capacitor.Plugins.Keyboard.hide();
          }
          this.isKeyboardOpen = false;
          releaseLock();
          return true;
        }

        // Priority 4: Internal Sub-Views / Sub-sections (e.g. Create Hangout)
        const internalView = this.getOpenInternalView();
        if (internalView) {
          internalView.close();
          releaseLock();
          return true;
        }

        // Priority 5: Active Chat Window
        const chatWin = document.getElementById('cwin');
        if ((chatWin && chatWin.classList.contains('open')) || this.activeChatId) {
          if (typeof window.closeChat === 'function') {
            window.closeChat();
          } else if (chatWin) {
            chatWin.classList.remove('open');
          }
          this.activeChatId = null;
          releaseLock();
          return true;
        }

        // Priority 6: Section History
        if (this.sectionHistory.length > 1) {
          this.sectionHistory.pop(); // Pop current section
          const prevSection = this.sectionHistory[this.sectionHistory.length - 1];
          if (typeof window.sw === 'function') {
            window.sw(prevSection.id, prevSection.label, { fromBack: true });
          }
          releaseLock();
          return true;
        }

        // Priority 7: At Root Screen
        releaseLock();

        if (IS_ANDROID) {
          if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
            window.Capacitor.Plugins.App.minimizeApp();
          }
        } else {
          // On iOS & Web: Do NOTHING at root
        }
        return false;
      } catch (err) {
        console.error('Error in NavigationManager.goBack:', err);
        releaseLock();
        return false;
      }
    }
  }

  class SwipeBackControllerClass {
    constructor() {
      this.startX = 0;
      this.startY = 0;
      this.currentX = 0;
      this.currentY = 0;
      this.isSwiping = false;
      this.isDirectionLocked = false;
      this.targetElement = null;
      this.edgeWidth = 32; // Left edge threshold in pixels
      this.thresholdRatio = 0.35; // 35% screen width required to complete back
      this.touchStartTime = 0;
    }

    init() {
      document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
      document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      document.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });
      document.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: true });
    }

    isTouchProtected(target) {
      if (!target) return false;
      const protectedSelector = 'input, textarea, select, [contenteditable], #crush-card, .swipe-card, .no-swipe-back, .prof-photos, .canvas-wrap';
      return !!target.closest(protectedSelector);
    }

    onTouchStart(e) {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Must start within left edge boundary
      if (touch.clientX > this.edgeWidth) return;

      // REQUIREMENT: Horizontal SwipeBack MUST NOT control Settings, Notifications, Chat Settings, or Create Chat!
      const isVerticalSheetOpen = !!document.querySelector('#settings-modal.open, #notif-modal.open, #chat-settings-modal.open, #chat-create-menu.open, .vertical-sheet-modal.open');
      if (isVerticalSheetOpen) {
        return;
      }
      if (e.target && e.target.closest('#settings-modal, #notif-modal, #chat-settings-modal, #chat-create-menu, .vertical-sheet-modal')) {
        return;
      }

      // Must only trigger if there is a previous state to return to
      if (!window.NavigationManager || !window.NavigationManager.canGoBack()) {
        return;
      }

      // Protect inputs, cards, and textareas
      if (this.isTouchProtected(e.target)) return;

      this.startX = touch.clientX;
      this.startY = touch.clientY;
      this.currentX = touch.clientX;
      this.currentY = touch.clientY;
      this.touchStartTime = Date.now();
      this.isSwiping = false;
      this.isDirectionLocked = false;

      // Identify target view element for transform animation
      const chatWin = document.getElementById('cwin');
      if (chatWin && chatWin.classList.contains('open')) {
        this.targetElement = chatWin;
      } else {
        const activeModals = window.NavigationManager.getOpenModals().filter(m => m.id !== 'settings-modal' && m.id !== 'notif-modal' && m.id !== 'chat-settings-modal' && m.id !== 'chat-create-menu');
        if (activeModals.length > 0) {
          this.targetElement = activeModals[activeModals.length - 1];
        } else {
          const activeSheets = window.NavigationManager.getOpenSheets();
          if (activeSheets.length > 0) {
            this.targetElement = activeSheets[activeSheets.length - 1];
          } else {
            // Check for active internal sub-panel
            const evpCreate = document.getElementById('evp-create');
            const evpMy = document.getElementById('evp-my');
            const evpJoined = document.getElementById('evp-joined');
            if (evpCreate && evpCreate.classList.contains('active')) {
              this.targetElement = evpCreate;
            } else if (evpMy && evpMy.classList.contains('active')) {
              this.targetElement = evpMy;
            } else if (evpJoined && evpJoined.classList.contains('active')) {
              this.targetElement = evpJoined;
            } else {
              this.targetElement = document.querySelector('.section.active');
            }
          }
        }
      }
    }

    onTouchMove(e) {
      if (!this.targetElement) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      const dx = touch.clientX - this.startX;
      const dy = touch.clientY - this.startY;

      if (!this.isDirectionLocked) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          this.isDirectionLocked = true;
          // Ignore if vertical movement predominates
          if (Math.abs(dy) >= Math.abs(dx) || dx <= 0) {
            this.targetElement = null;
            this.isSwiping = false;
            return;
          }
          this.isSwiping = true;
        }
      }

      if (this.isSwiping && dx > 0) {
        if (e.cancelable) e.preventDefault();
        this.currentX = touch.clientX;

        this.targetElement.style.transition = 'none';
        this.targetElement.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
    }

    onTouchEnd(e) {
      if (!this.targetElement || !this.isSwiping) {
        this.resetState();
        return;
      }

      const dx = this.currentX - this.startX;
      const dt = Date.now() - this.touchStartTime;
      const velocity = dx / Math.max(1, dt);
      const screenWidth = window.innerWidth || 360;

      const shouldComplete = dx > (screenWidth * this.thresholdRatio) || (velocity > 0.35 && dx > 50);
      const target = this.targetElement;
      this.resetState();

      if (shouldComplete) {
        target.style.transition = 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)';
        target.style.transform = `translate3d(${screenWidth}px, 0, 0)`;

        setTimeout(() => {
          target.style.transform = '';
          target.style.transition = '';
          window.NavigationManager.goBack({ fromSwipe: true });
        }, 220);
      } else {
        target.style.transition = 'transform 0.2s ease-out';
        target.style.transform = 'translate3d(0, 0, 0)';

        setTimeout(() => {
          target.style.transform = '';
          target.style.transition = '';
        }, 200);
      }
    }

    resetState() {
      this.isSwiping = false;
      this.isDirectionLocked = false;
      this.targetElement = null;
    }
  }

  class BottomSheetControllerClass {
    constructor() {
      this.activeSheet = null;
      this.activeOverlay = null;
      this.startY = 0;
      this.currentY = 0;
      this.isDragging = false;
      this.touchStartTime = 0;
    }

    init() {
      document.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: true });
      document.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
      document.addEventListener('touchend', (e) => this.onTouchEnd(e), { passive: true });
      document.addEventListener('touchcancel', (e) => this.onTouchEnd(e), { passive: true });
    }

    onTouchStart(e) {
      if (e.touches.length !== 1) return;
      const target = e.target;
      let sheet = null;

      const handle = target.closest('.mhnd, .sheet-drag-handle, .gif-sheet .mhnd');
      if (handle) {
        sheet = handle.closest('.sheet, .bg-sheet, .gif-sheet, .modal, .cpanel, .msheet');
      } else {
        const fullSheet = target.closest('#settings-modal .msheet, #notif-modal .msheet, #chat-settings-modal .msheet, #chat-create-menu .msheet, .vertical-sheet-modal .msheet');
        if (fullSheet && fullSheet.scrollTop <= 0) {
          const rect = fullSheet.getBoundingClientRect();
          if (e.touches[0].clientY - rect.top <= 90) {
            sheet = fullSheet;
          }
        }
      }

      if (!sheet) return;

      this.activeSheet = sheet;
      this.activeOverlay = sheet.closest('.mov, .modal, .sheet-wrapper') || (sheet.parentElement && sheet.parentElement.classList.contains('mov') ? sheet.parentElement : null);

      this.startY = e.touches[0].clientY;
      this.currentY = e.touches[0].clientY;
      this.touchStartTime = Date.now();
      this.isDragging = true;
    }

    onTouchMove(e) {
      if (!this.isDragging || !this.activeSheet) return;
      const touch = e.touches[0];
      const dy = touch.clientY - this.startY;

      if (dy > 0) {
        if (e.cancelable) e.preventDefault();
        this.currentY = touch.clientY;
        this.activeSheet.style.transition = 'none';
        this.activeSheet.style.transform = `translate3d(0, ${dy}px, 0)`;

        if (this.activeOverlay && this.activeOverlay.style) {
          const sheetHeight = this.activeSheet.offsetHeight || 300;
          const alpha = Math.max(0, 1 - (dy / sheetHeight));
          this.activeOverlay.style.transition = 'none';
          this.activeOverlay.style.opacity = alpha;
        }
      }
    }

    onTouchEnd(e) {
      if (!this.isDragging || !this.activeSheet) {
        this.isDragging = false;
        this.activeSheet = null;
        this.activeOverlay = null;
        return;
      }

      const dy = this.currentY - this.startY;
      const dt = Date.now() - this.touchStartTime;
      const velocity = dy / Math.max(1, dt);
      const sheetHeight = this.activeSheet.offsetHeight || 300;

      const shouldClose = dy > (sheetHeight * 0.3) || (velocity > 0.35 && dy > 40);
      const sheet = this.activeSheet;
      const overlay = this.activeOverlay;

      this.isDragging = false;
      this.activeSheet = null;
      this.activeOverlay = null;

      if (shouldClose) {
        sheet.style.transition = 'transform 0.22s cubic-bezier(0.25, 1, 0.5, 1)';
        sheet.style.transform = `translate3d(0, 100%, 0)`;
        if (overlay && overlay.style) {
          overlay.style.transition = 'opacity 0.22s ease-out';
          overlay.style.opacity = '0';
        }

        setTimeout(() => {
          sheet.style.transform = '';
          sheet.style.transition = '';
          if (overlay && overlay.style) {
            overlay.style.opacity = '';
            overlay.style.transition = '';
          }
          window.NavigationManager.goBack({ fromSheetDrag: true });
        }, 220);
      } else {
        sheet.style.transition = 'transform 0.2s ease-out';
        sheet.style.transform = 'translate3d(0, 0, 0)';
        if (overlay && overlay.style) {
          overlay.style.transition = 'opacity 0.2s ease-out';
          overlay.style.opacity = '1';
        }

        setTimeout(() => {
          sheet.style.transform = '';
          sheet.style.transition = '';
          if (overlay && overlay.style) {
            overlay.style.opacity = '';
            overlay.style.transition = '';
          }
        }, 200);
      }
    }
  }

  window.NavigationManager = new NavigationManagerClass();
  window.SwipeBackController = new SwipeBackControllerClass();
  window.BottomSheetController = new BottomSheetControllerClass();

  document.addEventListener('DOMContentLoaded', () => {
    window.NavigationManager.init();
    window.SwipeBackController.init();
    window.BottomSheetController.init();
  });
})();
