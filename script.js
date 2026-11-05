/* ============================================================
   Ig9ite 3D — Login Page
   JavaScript: show/hide password, validasi form,
   Remember Me (localStorage), simulasi loading login
   ============================================================ */

// ---------- Referensi elemen ----------
const form        = document.getElementById('loginForm');
const email       = document.getElementById('email');
const password    = document.getElementById('password');
const emailError  = document.getElementById('emailError');
const passError   = document.getElementById('passwordError');
const fieldEmail  = document.getElementById('fieldEmail');
const fieldPass   = document.getElementById('fieldPassword');
const toggleBtn   = document.getElementById('togglePass');
const btnContinue = document.getElementById('btnContinue');
const remember    = document.getElementById('remember');

// ---------- 1. Show / Hide password ----------
toggleBtn.addEventListener('click', () => {
  const showing = password.type === 'text';

  password.type = showing ? 'password' : 'text';
  toggleBtn.classList.toggle('showing', !showing);
  toggleBtn.setAttribute('aria-pressed', String(!showing));
  toggleBtn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
});

// ---------- 2. Remember Me : isi email tersimpan ----------
const SAVED_KEY = 'ig9ite_email';
const savedEmail = localStorage.getItem(SAVED_KEY);
if (savedEmail) {
  email.value = savedEmail;
  remember.checked = true;
}

// ---------- 3. Validasi ----------
function setError(fieldEl, msgEl, message) {
  if (message) {
    fieldEl.classList.add('has-error');
    msgEl.textContent = message;

    // mainkan ulang animasi shake
    fieldEl.classList.remove('shake');
    void fieldEl.offsetWidth; // trik: paksa reflow
    fieldEl.classList.add('shake');
  } else {
    fieldEl.classList.remove('has-error', 'shake');
    msgEl.textContent = '';
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

// hapus error saat pengguna mulai mengetik
email.addEventListener('input',    () => setError(fieldEmail, emailError, ''));
password.addEventListener('input', () => setError(fieldPass,  passError,  ''));

// ---------- 4. Submit (simulasi login, tanpa backend) ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let valid = true;

  // email
  const emailVal = email.value.trim();
  if (!emailVal) {
    setError(fieldEmail, emailError, 'Email address is required.');
    valid = false;
  } else if (!isValidEmail(emailVal)) {
    setError(fieldEmail, emailError, 'Please enter a valid email address.');
    valid = false;
  }

  // password
  if (!password.value) {
    setError(fieldPass, passError, 'Password is required.');
    valid = false;
  } else if (password.value.length < 6) {
    setError(fieldPass, passError, 'Password must be at least 6 characters.');
    valid = false;
  }

  if (!valid) return;

  // simulasi proses login
  btnContinue.disabled = true;
  btnContinue.textContent = 'Signing in\u2026';

  setTimeout(() => {
    // simpan / hapus email sesuai centang Remember Me
    if (remember.checked) localStorage.setItem(SAVED_KEY, emailVal);
    else                  localStorage.removeItem(SAVED_KEY);

    btnContinue.textContent = '\u2713 Signed in successfully!';
    btnContinue.classList.add('success');

    setTimeout(() => {
      btnContinue.disabled = false;
      btnContinue.classList.remove('success');
      btnContinue.textContent = 'Continue';
    }, 2200);
  }, 1400);
});
