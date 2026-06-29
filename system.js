(function () {
  "use strict";

  const state = {
    windows: {},
    zCounter: 10,
    activeWindowId: null,
    eventLog: [],
  };

  const APP_REGISTRY = {
    terminal:    { title: "Terminal",       icon: "⌨️", width: 640, height: 420, render: createTerminalApp },
    explorer:    { title: "File Explorer",  icon: "📂", width: 720, height: 480, render: createExplorerApp },
    editor:      { title: "Text Editor",    icon: "📝", width: 560, height: 400, render: createNotepadApp },
    settings:    { title: "Settings",       icon: "⚙️", width: 600, height: 500, render: createSettingsApp },
    browser:     { title: "Web Browser",    icon: "🌐", width: 800, height: 600, render: createBrowserApp },
    monitor:     { title: "System Monitor", icon: "📊", width: 680, height: 480, render: createMonitorApp },
  };

  const bootMessages = [
    "Initializing kernel…",
    "Loading device drivers…",
    "Mounting filesystems…",
    "Verifying system integrity…",
    "Loading user environment…",
    "Initializing display server…"
  ];

  function runBootSequence() {
    const fill = document.getElementById("boot-fill");
    const status = document.getElementById("boot-status");
    let step = 0;
    const totalSteps = bootMessages.length;

    const interval = setInterval(() => {
      step++;
      const pct = Math.min(100, Math.round((step / totalSteps) * 100));
      fill.style.width = pct + "%";
      status.textContent = bootMessages[Math.min(step, totalSteps - 1)];
      if (step >= totalSteps) {
        clearInterval(interval);
        setTimeout(showLoginScreen, 600);
      }
    }, 450);
  }

  function showLoginScreen() {
    const boot = document.getElementById("boot-screen");
    const login = document.getElementById("login-screen");
    boot.style.opacity = "0";
    setTimeout(() => { boot.style.display = "none"; }, 600);
    login.classList.add("visible");
    updateLoginClock();
    setInterval(updateLoginClock, 1000);
  }

  function updateLoginClock() {
    const now = new Date();
    document.getElementById("login-clock").textContent =
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    document.getElementById("login-date").textContent =
      now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
  }

  function doLogin() {
    const login = document.getElementById("login-screen");
    login.style.opacity = "0";
    login.style.pointerEvents = "none";
    setTimeout(() => {
      login.style.display = "none";
      showDesktop();
    }, 500);
  }

  function showDesktop() {
    const desktop = document.getElementById("desktop");
    desktop.classList.add("visible");
    renderDesktopIcons();
    startClock();
    notify("🚀 Welcome", "Session initialized. PolarOS ready.", "info");
  }

  const desktopIconsData = [
    { id: "terminal", label: "Terminal", icon: "⌨️", action: () => openApp("terminal") },
    { id: "explorer", label: "File Explorer", icon: "📂", action: () => openApp("explorer") },
    { id: "editor", label: "Text Editor", icon: "📝", action: () => openApp("editor") },
    { id: "browser", label: "Web Browser", icon: "🌐", action: () => openApp("browser") },
    { id: "monitor", label: "System Monitor", icon: "📊", action: () => openApp("monitor") },
    { id: "settings", label: "Settings", icon: "⚙️", action: () => openApp("settings") },
  ];

  function renderDesktopIcons() {
    const container = document.getElementById("desktop-icons");
    container.innerHTML = "";
    desktopIconsData.forEach(d => {
      const el = document.createElement("div");
      el.className = "desktop-icon";
      el.innerHTML = `<div class="icon-glyph">${d.icon}</div><div class="icon-label">${d.label}</div>`;
      el.addEventListener("click", (e) => {
        document.querySelectorAll(".desktop-icon").forEach(x => x.classList.remove("selected"));
        el.classList.add("selected");
      });
      el.addEventListener("dblclick", d.action);
      container.appendChild(el);
    });
  }

  function startClock() {
    function tick() {
      const now = new Date();
      document.getElementById("tray-time").textContent =
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      document.getElementById("tray-date").textContent =
        now.toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    tick();
    setInterval(tick, 1000);
  }

  let windowIdCounter = 1;

  function openApp(appType, options = {}) {
    const appDef = APP_REGISTRY[appType];
    if (!appDef) return;

    const id = "win-" + (windowIdCounter++);
    const layer = document.getElementById("windows-layer");

    const offset = (Object.keys(state.windows).length % 5) * 28;
    const winEl = document.createElement("div");
    winEl.className = "window";
    winEl.style.left = (100 + offset) + "px";
    winEl.style.top = (60 + offset) + "px";
    winEl.style.width = appDef.width + "px";
    winEl.style.height = appDef.height + "px";
    winEl.style.zIndex = ++state.zCounter;

    const title = options.title || appDef.title;

    winEl.innerHTML = `
      <div class="titlebar">
        <span class="title-icon">${appDef.icon}</span>
        <span class="title-text">${title}</span>
        <div class="win-controls">
          <button class="win-btn min-btn" title="Minimize">−</button>
          <button class="win-btn max-btn" title="Maximize">⛶</button>
          <button class="win-btn close-btn" title="Close">✕</button>
        </div>
      </div>
      <div class="window-body"></div>
      <div class="resize-handle"></div>
    `;
    layer.appendChild(winEl);

    const body = winEl.querySelector(".window-body");
    const windowApi = {
      id,
      close: () => closeWindow(id),
      minimize: () => minimizeWindow(id),
      openApp: (type, opts) => openApp(type, opts),
      onFocus: null,
    };

    appDef.render(body, windowApi, options);

    state.windows[id] = {
      el: winEl, appType, title, icon: appDef.icon, minimized: false, maximized: false,
      prevRect: null, windowApi
    };

    makeWindowInteractive(winEl, id);
    focusWindow(id);
    renderTaskbarApps();

    return id;
  }

  function closeWindow(id) {
    const w = state.windows[id];
    if (!w) return;
    w.el.classList.add("closing");
    setTimeout(() => {
      w.el.remove();
      delete state.windows[id];
      renderTaskbarApps();
      if (state.activeWindowId === id) state.activeWindowId = null;
    }, 200);
  }

  function minimizeWindow(id) {
    const w = state.windows[id];
    if (!w) return;
    w.minimized = true;
    w.el.classList.add("minimized");
    renderTaskbarApps();
  }

  function restoreWindow(id) {
    const w = state.windows[id];
    if (!w) return;
    w.minimized = false;
    w.el.classList.remove("minimized");
    focusWindow(id);
  }

  function toggleMaximize(id) {
    const w = state.windows[id];
    if (!w) return;
    if (!w.maximized) {
      w.prevRect = {
        left: w.el.style.left, top: w.el.style.top,
        width: w.el.style.width, height: w.el.style.height
      };
      w.el.style.left = "0px";
      w.el.style.top = "0px";
      w.el.style.width = "100vw";
      w.el.style.height = "calc(100vh - 52px)";
      w.el.classList.add("maximized");
      w.maximized = true;
    } else {
      const r = w.prevRect;
      if (r) {
        w.el.style.left = r.left; w.el.style.top = r.top;
        w.el.style.width = r.width; w.el.style.height = r.height;
      }
      w.el.classList.remove("maximized");
      w.maximized = false;
    }
  }

  function focusWindow(id) {
    const w = state.windows[id];
    if (!w) return;
    state.zCounter++;
    w.el.style.zIndex = state.zCounter;
    state.activeWindowId = id;
    if (typeof w.windowApi.onFocus === "function") w.windowApi.onFocus();
    renderTaskbarApps();
  }

  function makeWindowInteractive(winEl, id) {
    const titlebar = winEl.querySelector(".titlebar");
    const minBtn = winEl.querySelector(".min-btn");
    const maxBtn = winEl.querySelector(".max-btn");
    const closeBtn = winEl.querySelector(".close-btn");
    const resizeHandle = winEl.querySelector(".resize-handle");

    winEl.addEventListener("mousedown", () => focusWindow(id));

    minBtn.addEventListener("click", (e) => { e.stopPropagation(); minimizeWindow(id); });
    maxBtn.addEventListener("click", (e) => { e.stopPropagation(); toggleMaximize(id); });
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); closeWindow(id); });
    titlebar.addEventListener("dblclick", () => toggleMaximize(id));

    let dragging = false, startX, startY, startLeft, startTop;
    titlebar.addEventListener("mousedown", (e) => {
      if (e.target.closest(".win-btn")) return;
      if (state.windows[id].maximized) return;
      dragging = true;
      startX = e.clientX; startY = e.clientY;
      startLeft = winEl.offsetLeft; startTop = winEl.offsetTop;
      document.body.style.userSelect = "none";
    });
    window.addEventListener("mousemove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      winEl.style.left = Math.max(0, startLeft + dx) + "px";
      winEl.style.top = Math.max(0, startTop + dy) + "px";
    });
    window.addEventListener("mouseup", () => { dragging = false; document.body.style.userSelect = ""; });

    let resizing = false, rStartX, rStartY, rStartW, rStartH;
    resizeHandle.addEventListener("mousedown", (e) => {
      e.stopPropagation();
      resizing = true;
      rStartX = e.clientX; rStartY = e.clientY;
      rStartW = winEl.offsetWidth; rStartH = winEl.offsetHeight;
    });
    window.addEventListener("mousemove", (e) => {
      if (!resizing) return;
      const dw = e.clientX - rStartX, dh = e.clientY - rStartY;
      winEl.style.width = Math.max(400, rStartW + dw) + "px";
      winEl.style.height = Math.max(280, rStartH + dh) + "px";
    });
    window.addEventListener("mouseup", () => { resizing = false; });
  }

  function renderTaskbarApps() {
    const container = document.getElementById("taskbar-apps");
    container.innerHTML = "";
    Object.entries(state.windows).forEach(([id, w]) => {
      const btn = document.createElement("button");
      btn.className = "taskbar-app" + (id === state.activeWindowId && !w.minimized ? " active" : "");
      btn.innerHTML = `<span>${w.icon} ${w.title}</span>`;
      btn.addEventListener("click", () => {
        if (w.minimized) restoreWindow(id);
        else if (id === state.activeWindowId) minimizeWindow(id);
        else focusWindow(id);
      });
      container.appendChild(btn);
    });
  }

  function renderStartMenu() {
    const menu = document.getElementById("start-menu");
    const apps = Object.entries(APP_REGISTRY);
    menu.innerHTML = `
      <div class="start-menu-header">Applications</div>
      <div class="start-menu-grid">
        ${apps.map(([key, def]) => `
          <div class="start-app" data-app="${key}">
            <div class="icon-glyph">${def.icon}</div>
            <div class="icon-label">${def.title}</div>
          </div>
        `).join("")}
      </div>
      <div class="start-menu-footer">
        <div class="start-user">
          <div class="mini-avatar">A</div>
          <span>ariana</span>
        </div>
        <button class="power-btn" id="power-btn" title="Shutdown">⏻</button>
      </div>
    `;
    menu.querySelectorAll(".start-app").forEach(el => {
      el.addEventListener("click", () => {
        openApp(el.getAttribute("data-app"));
        toggleStartMenu(false);
      });
    });
    menu.querySelector("#power-btn").addEventListener("click", () => {
      toggleStartMenu(false);
      triggerShutdown();
    });
  }

  function toggleStartMenu(force) {
    const menu = document.getElementById("start-menu");
    const startBtn = document.getElementById("start-btn");
    const show = force !== undefined ? force : !menu.classList.contains("visible");
    menu.classList.toggle("visible", show);
    startBtn.classList.toggle("active", show);
  }

  function notify(title, body, type = "info") {
    const stack = document.getElementById("notification-stack");
    const el = document.createElement("div");
    el.className = "notification";
    el.innerHTML = `<div class="notif-title">${title}</div><div class="notif-body">${body}</div>`;
    stack.appendChild(el);

    logEvent(title, body, type);

    setTimeout(() => {
      el.classList.add("closing");
      setTimeout(() => el.remove(), 220);
    }, 4500);
  }

  function logEvent(title, body, type) {
    const icons = { info: "ℹ️", warn: "⚠️", error: "🚨", virus: "🦠" };
    state.eventLog.push({
      title, body, icon: icons[type] || "ℹ️",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
  }

  function triggerShutdown() {
    const desktop = document.getElementById("desktop");
    const taskbar = document.getElementById("taskbar");
    notify("⏻ Shutting Down", "Closing all processes…", "info");
    setTimeout(() => {
      desktop.style.transition = "opacity 0.8s ease";
      desktop.style.opacity = "0";
      taskbar.style.transition = "opacity 0.8s ease";
      taskbar.style.opacity = "0";
      setTimeout(() => {
        document.getElementById("root").innerHTML = `
          <div style="position:absolute;inset:0;background:#000;display:flex;align-items:center;justify-content:center;color:#555;font-family:system-ui;font-size:14px;flex-direction:column;gap:16px;">
            <div style="font-size:13px;letter-spacing:1px;">POLARON SHUTDOWN COMPLETE</div>
            <button onclick="location.reload()" style="padding:10px 20px;border-radius:8px;border:1px solid #333;background:#111;color:#00d9ff;cursor:pointer;font-weight:600;letter-spacing:0.5px;transition:all 0.2s;">Restart System</button>
          </div>
        `;
      }, 850);
    }, 900);
  }

  function setupContextMenu() {
    const ctx = document.getElementById("context-menu");
    const desktop = document.getElementById("desktop");

    desktop.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      ctx.innerHTML = `
        <div class="ctx-item" data-action="terminal">⌨️ Open Terminal</div>
        <div class="ctx-item" data-action="editor">📝 New Document</div>
        <div class="ctx-sep"></div>
        <div class="ctx-item" data-action="settings">⚙️ Settings</div>
        <div class="ctx-item" data-action="refresh">🔄 Refresh</div>
      `;
      ctx.style.left = e.clientX + "px";
      ctx.style.top = e.clientY + "px";
      ctx.classList.add("visible");

      ctx.querySelectorAll(".ctx-item").forEach(item => {
        item.addEventListener("click", () => {
          const action = item.getAttribute("data-action");
          if (action === "terminal") openApp("terminal");
          if (action === "editor") openApp("editor");
          if (action === "settings") openApp("settings");
          if (action === "refresh") notify("🔄 Refresh", "Desktop refreshed.", "info");
          ctx.classList.remove("visible");
        });
      });
    });

    document.addEventListener("click", (e) => {
      if (!ctx.contains(e.target)) ctx.classList.remove("visible");
    });
  }

  function setupGlobalUI() {
    document.getElementById("start-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleStartMenu();
    });
    document.addEventListener("click", (e) => {
      const menu = document.getElementById("start-menu");
      const startBtn = document.getElementById("start-btn");
      if (menu.classList.contains("visible") && !menu.contains(e.target) && !startBtn.contains(e.target)) {
        toggleStartMenu(false);
      }
    });

    document.getElementById("login-btn").addEventListener("click", doLogin);
    document.getElementById("login-password").addEventListener("keydown", (e) => {
      if (e.key === "Enter") doLogin();
    });

    document.getElementById("taskbar-search").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = e.target.value.toLowerCase();
        const match = Object.keys(APP_REGISTRY).find(k =>
          APP_REGISTRY[k].title.toLowerCase().includes(q) || k.includes(q)
        );
        if (match) openApp(match);
        e.target.value = "";
      }
    });
  }

  window.PolarOS = {
    openApp,
    closeWindow,
    notify,
    triggerShutdown,
    get eventLog() { return state.eventLog; },
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderStartMenu();
    setupGlobalUI();
    setupContextMenu();
    runBootSequence();
  });

})();
