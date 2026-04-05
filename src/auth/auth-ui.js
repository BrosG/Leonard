import { signInWithGoogle, sendPhoneVerification, verifyPhoneCode, logOut, getCurrentUser } from "./firebase.js";

export function createAuthModal() {
  const modal = document.createElement("div");
  modal.id = "auth-modal";
  modal.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm";
  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      <!-- Header -->
      <div class="bg-gradient-to-br from-navy-dark via-ocean-blue to-ocean-light p-8 text-center text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gold-bright/10 rounded-full blur-2xl"></div>
        <span class="text-5xl block mb-3 relative z-10">⚓</span>
        <h2 class="text-2xl font-bold font-heading relative z-10">Welcome to Leonard</h2>
        <div class="h-0.5 w-16 bg-gold-bright rounded-full mx-auto mt-2 mb-1"></div>
        <p class="text-sm opacity-90 relative z-10">Your AI Yacht Concierge</p>
      </div>

      <div class="p-8">
        <!-- Google Sign-In -->
        <button id="auth-google-btn"
          class="w-full flex items-center justify-center gap-3 px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-700 mb-4">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <div class="flex items-center gap-4 my-6">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-sm text-gray-400">or</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Phone Sign-In -->
        <div id="phone-step-1">
          <label for="auth-phone-input" class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div class="flex gap-2">
            <input id="auth-phone-input" type="tel" placeholder="+33 6 12 34 56 78"
              class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none transition-colors" />
            <button id="auth-phone-btn"
              class="px-6 py-3 bg-ocean-blue text-white rounded-xl hover:bg-ocean-light transition-colors font-medium whitespace-nowrap">
              Send Code
            </button>
          </div>
          <div id="recaptcha-container"></div>
        </div>

        <!-- OTP Verification -->
        <div id="phone-step-2" class="hidden">
          <label for="auth-otp-input" class="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
          <div class="flex gap-2">
            <input id="auth-otp-input" type="text" placeholder="123456" maxlength="6"
              class="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-ocean-blue focus:outline-none transition-colors text-center text-2xl tracking-widest" />
            <button id="auth-verify-btn"
              class="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium">
              Verify
            </button>
          </div>
          <button id="auth-back-btn" class="mt-3 text-sm text-ocean-blue hover:underline">← Change number</button>
        </div>

        <!-- Error display -->
        <div id="auth-error" class="hidden mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm" role="alert" aria-live="polite"></div>

        <!-- Loading -->
        <div id="auth-loading" class="hidden mt-4 text-center" role="status" aria-live="polite">
          <div class="inline-flex items-center gap-2 text-ocean-blue">
            <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            <span>Authenticating...</span>
          </div>
        </div>
      </div>
    </div>
  `;
  return modal;
}

function showError(msg) {
  const el = document.getElementById("auth-error");
  if (el) {
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 8000);
  }
}

function setLoading(loading) {
  const el = document.getElementById("auth-loading");
  if (el) el.classList.toggle("hidden", !loading);
  // Disable all interactive elements during loading
  document.getElementById("auth-google-btn")?.toggleAttribute("disabled", loading);
  document.getElementById("auth-phone-btn")?.toggleAttribute("disabled", loading);
  document.getElementById("auth-verify-btn")?.toggleAttribute("disabled", loading);
  document.getElementById("auth-phone-input")?.toggleAttribute("disabled", loading);
  document.getElementById("auth-otp-input")?.toggleAttribute("disabled", loading);
}

export function initAuthUI() {
  // Insert modal
  const modal = createAuthModal();
  document.body.appendChild(modal);

  // Google sign-in
  document.getElementById("auth-google-btn")?.addEventListener("click", async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
      closeAuthModal();
    } catch (e) {
      showError(e.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  });

  // Phone - send code
  document.getElementById("auth-phone-btn")?.addEventListener("click", async () => {
    const phone = document.getElementById("auth-phone-input")?.value?.trim();
    if (!phone) return showError("Please enter a phone number");
    try {
      setLoading(true);
      await sendPhoneVerification(phone, "recaptcha-container");
      document.getElementById("phone-step-1")?.classList.add("hidden");
      document.getElementById("phone-step-2")?.classList.remove("hidden");
    } catch (e) {
      showError(e.message || "Failed to send verification code");
    } finally {
      setLoading(false);
    }
  });

  // Phone - verify code
  document.getElementById("auth-verify-btn")?.addEventListener("click", async () => {
    const code = document.getElementById("auth-otp-input")?.value?.trim();
    if (!code) return showError("Please enter the verification code");
    try {
      setLoading(true);
      await verifyPhoneCode(code);
      closeAuthModal();
    } catch (e) {
      showError(e.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  });

  // Back button
  document.getElementById("auth-back-btn")?.addEventListener("click", () => {
    document.getElementById("phone-step-2")?.classList.add("hidden");
    document.getElementById("phone-step-1")?.classList.remove("hidden");
  });
}

export function showAuthModal() {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.remove("hidden");
    // Focus first interactive element
    setTimeout(() => document.getElementById("auth-google-btn")?.focus(), 100);
  }
}

export function closeAuthModal() {
  document.getElementById("auth-modal")?.classList.add("hidden");
}

export function createUserMenu(user) {
  const photo = user.photoURL || null;
  const name = user.displayName || user.phoneNumber || "Captain";
  const initial = name.charAt(0).toUpperCase();

  return `
    <div class="flex items-center gap-3">
      <div class="relative group">
        <button id="user-menu-btn" class="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors">
          ${
            photo
              ? `<img src="${photo}" alt="${name}" class="w-8 h-8 rounded-full border-2 border-ocean-blue" />`
              : `<div class="w-8 h-8 rounded-full bg-ocean-blue text-white flex items-center justify-center font-bold text-sm">${initial}</div>`
          }
          <span class="hidden md:inline text-sm font-medium text-gray-700">${name}</span>
        </button>
        <div id="user-dropdown" class="hidden absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
          <div class="px-4 py-2 border-b border-gray-100">
            <p class="text-sm font-medium text-gray-800">${name}</p>
            <p class="text-xs text-gray-500">${user.email || user.phoneNumber || ""}</p>
          </div>
          <button id="logout-btn" class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  `;
}

export function initUserMenu() {
  document.getElementById("user-menu-btn")?.addEventListener("click", () => {
    document.getElementById("user-dropdown")?.classList.toggle("hidden");
  });

  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await logOut();
    window.location.reload();
  });

  // Close dropdown on click outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#user-menu-btn") && !e.target.closest("#user-dropdown")) {
      document.getElementById("user-dropdown")?.classList.add("hidden");
    }
  });
}
