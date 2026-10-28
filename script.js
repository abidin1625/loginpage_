/* ============================================================
   LOGIN PAGE — "Manusia Berjalan di Atas Teks"
   Mesin animasi walker + sinkronisasi huruf + logika form
   ============================================================ */
(function () {
  "use strict";

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var stage = $("#stage");
  var headline = $("#headline");
  var headlineText = $("#headlineText");
  var walkerSlot = $("#walkerSlot");
  var walker = $("#walker");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Bangun huruf "SELAMAT DATANG" ---------- */
  var TEXT = "SELAMAT DATANG";
  TEXT.split("").forEach(function (ch) {
    var span = document.createElement("span");
    span.className = "char";
    if (ch === " ") {
      span.classList.add("char-space");
      span.innerHTML = "&nbsp;";
    } else {
      span.textContent = ch;
    }
    headlineText.appendChild(span);
  });
  var chars = $$("#headlineText .char");
  var solidChars = chars.filter(function (c) { return !c.classList.contains("char-space"); });

  /* ---------- 2. Bintang latar ---------- */
  var starsBox = $("#stars");
  for (var i = 0; i < 85; i++) {
    var st = document.createElement("span");
    st.className = "star" + (Math.random() < 0.28 ? " amber" : "");
    var size = (Math.random() * 1.7 + 0.7).toFixed(2);
    st.style.width = size + "px";
    st.style.height = size + "px";
    st.style.left = (Math.random() * 100).toFixed(2) + "%";
    st.style.top = (Math.random() * 72).toFixed(2) + "%";
    st.style.setProperty("--dur", (Math.random() * 4 + 2.4).toFixed(2) + "s");
    st.style.setProperty("--delay", (Math.random() * 5).toFixed(2) + "s");
    st.style.opacity = (Math.random() * 0.5 + 0.25).toFixed(2);
    starsBox.appendChild(st);
  }

  /* ---------- 3. Ukur posisi & jadwalkan kaki di "atas" huruf ---------- */
  var centers = []; // pusat-x tiap huruf (px, relatif thd headline)
  function measure() {
    var hRect = headline.getBoundingClientRect();
    centers = chars.map(function (c) {
      var r = c.getBoundingClientRect();
      return r.left + r.width / 2 - hRect.left;
    });
    if (!solidChars.length) return;
    var first = solidChars[0].getBoundingClientRect();
    var capTop, capH;
    try {
      // Ukur tinta glyph "S" secara presisi via canvas metrics
      var cs = getComputedStyle(headline);
      var cv = measure._ctx || (measure._ctx = document.createElement("canvas").getContext("2d"));
      cv.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
      var m = cv.measureText("S");
      var baseline = first.top + (m.fontBoundingBoxAscent || first.height * 0.8);
      capTop = baseline - m.actualBoundingBoxAscent;
      capH = m.actualBoundingBoxAscent;
    } catch (e) {
      capTop = first.top - hRect.top + first.height * 0.2;
      capH = first.height * 0.72;
    }
    // Kaki tepat di puncak huruf (cap height), menembus 1.5px
    walkerSlot.style.bottom = (headline.offsetHeight - (capTop - hRect.top) - 1.5) + "px";
    // Tinggi tubuh manusia proporsional dengan tinggi huruf
    var hPx = Math.max(34, capH * 1.14);
    walkerSlot.style.height = hPx + "px";
    walkerSlot.style.width = (hPx * 100 / 120) + "px";
  }
  measure();
  window.addEventListener("resize", measure);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { setTimeout(measure, 60); });
  }
  window.addEventListener("load", function () { setTimeout(measure, 120); });

  /* ---------- 4. Mesin walker: posisi via rAF + kecepatan halus ---------- */
  var SPEED = { walk: 7.2, run: 34, celebrate: 0 };
  var mode = "walk";
  var x = -8;           // posisi dalam % lebar headline
  var v = SPEED.walk;   // kecepatan terkini (%/detik)
  var targetV = SPEED.walk;
  var pressedIdx = -1;
  var last = performance.now();

  // Percepat / perlambat animasi anggota tubuh via Web Animations API
  function setLimbRate(rate) {
    if (reduced) return;
    var anims = document.getAnimations ? document.getAnimations() : [];
    anims.forEach(function (a) {
      var n = a.animationName || "";
      if (typeof n === "string" && n.indexOf("wk-") === 0) {
        try { a.updatePlaybackRate(rate); } catch (e) { /* noop */ }
      }
    });
  }

  function setMode(next) {
    mode = next;
    stage.dataset.mode = next;
    targetV = SPEED[next];
    if (next === "run") {
      walker.classList.remove("celebrate");
      setLimbRate(3.4);
    } else if (next === "celebrate") {
      walker.classList.add("celebrate");
      setLimbRate(1);
    } else {
      walker.classList.remove("celebrate");
      setLimbRate(1);
    }
  }

  function pressNearest() {
    if (!centers.length) return;
    var hW = headline.clientWidth;
    var cx = (x / 100) * hW;
    var best = -1, bd = Infinity;
    for (var i = 0; i < chars.length; i++) {
      var d = Math.abs(centers[i] - cx);
      if (d < bd) { bd = d; best = i; }
    }
    var threshold = hW * (mode === "run" ? 0.05 : 0.045);
    if (best !== pressedIdx) {
      if (pressedIdx > -1) chars[pressedIdx].classList.remove("is-pressed");
      if (bd < threshold && !chars[best].classList.contains("char-space")) {
        chars[best].classList.add("is-pressed");
        pressedIdx = best;
      } else {
        pressedIdx = -1;
      }
    }
  }

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    v += (targetV - v) * Math.min(1, dt * 3.2);
    x += v * dt;

    if (x > 108) x = -8; // ulang dari kiri

    if (mode === "celebrate" && v < 0.6) {
      // berhenti di area yang terlihat
      if (x < 8) x = 8;
      if (x > 90) x = 90;
    }

    walkerSlot.style.left = x + "%";
    if (v > 0.25) pressNearest();

    requestAnimationFrame(tick);
  }

  if (!reduced) {
    requestAnimationFrame(tick);
  } else {
    walkerSlot.style.left = "35%";
  }

  /* ---------- 5. Toast ---------- */
  var toasts = $("#toasts");
  var ICONS = {
    success: '<svg class="t-icon" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    error: '<svg class="t-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 8v4.5M12 16h.01"/></svg>',
    info: '<svg class="t-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };
  function toast(type, msg, ms) {
    var el = document.createElement("div");
    el.className = "toast " + type;
    el.innerHTML = (ICONS[type] || ICONS.info) + "<span>" + msg + "</span>";
    toasts.appendChild(el);
    setTimeout(function () {
      el.classList.add("out");
      setTimeout(function () { el.remove(); }, 320);
    }, ms || 3400);
  }

  /* ---------- 6. Logika form (demo, tanpa backend) ---------- */
  var form = $("#loginForm");
  var email = $("#email");
  var pass = $("#password");
  var btn = $("#btnLogin");
  var errBox = $("#formError");
  var card = $("#card");
  var formView = $("#formView");
  var successView = $("#successView");
  var userName = $("#userName");
  var loading = false;

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.add("show");
    card.classList.remove("shake");
    void card.offsetWidth; // restart animasi
    card.classList.add("shake");
  }
  function clearError() {
    errBox.textContent = "";
    errBox.classList.remove("show");
  }

  $("#togglePass").addEventListener("click", function () {
    var btnT = this;
    var shown = pass.type === "text";
    pass.type = shown ? "password" : "text";
    btnT.classList.toggle("shown", !shown);
    btnT.setAttribute("aria-pressed", String(!shown));
    btnT.setAttribute("aria-label", shown ? "Tampilkan password" : "Sembunyikan password");
  });

  ["#email", "#password"].forEach(function (sel) {
    $(sel).addEventListener("input", clearError);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (loading) return;
    clearError();

    var okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
    var okPass = pass.value.length >= 6;

    if (!okEmail) {
      showError("Format email belum benar. Contoh: nama@contoh.com");
      email.focus();
      toast("error", "Email belum valid — si kaki-rata tidak bisa jalan. 🙈");
      return;
    }
    if (!okPass) {
      showError("Password minimal 6 karakter.");
      pass.focus();
      toast("error", "Password terlalu pendek, minimal 6 karakter.");
      return;
    }

    // Sukses (simulasi) → manusia berlari
    loading = true;
    btn.disabled = true;
    btn.classList.add("loading");
    btn.querySelector(".btn-label").textContent = "Memeriksa…";
    setMode("run");

    setTimeout(function () {
      var name = email.value.trim().split("@")[0].replace(/[._-]+/g, " ");
      name = name.split(" ").filter(Boolean).map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(" ") || "Kawan";
      userName.textContent = name;

      formView.classList.add("hidden");
      successView.classList.remove("hidden");
      setMode("celebrate");

      // Riak gembira pada huruf
      solidChars.forEach(function (c, idx) {
        setTimeout(function () {
          c.classList.add("pop");
          setTimeout(function () { c.classList.remove("pop"); }, 560);
        }, idx * 55);
      });

      toast("success", "Selamat datang, " + name + "! Login demo berhasil.");
      loading = false;
    }, 1700);
  });

  $("#btnLogout").addEventListener("click", function () {
    successView.classList.add("hidden");
    formView.classList.remove("hidden");
    pass.value = "";
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.querySelector(".btn-label").textContent = "Masuk";
    setMode("walk");
    toast("info", "Sampai jumpa! Si kaki-rata lanjut berjalan lagi.");
  });

  $("#forgot").addEventListener("click", function (e) {
    e.preventDefault();
    toast("info", "Ini halaman demo tampilan — fitur reset password belum aktif.");
  });
  $("#signupLink").addEventListener("click", function (e) {
    e.preventDefault();
    toast("info", "Ini halaman demo tampilan — pendaftaran belum aktif.");
  });
  $$(".btn-social").forEach(function (b) {
    b.addEventListener("click", function () {
      toast("info", "Login via " + b.dataset.provider + " hanya demo di halaman ini.");
    });
  });
})();
