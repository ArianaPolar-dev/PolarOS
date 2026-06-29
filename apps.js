(function () {
  "use strict";

  const fakeFS = {
    "C:": {
      type: "folder",
      children: {
        "System": {
          type: "folder",
          children: {
            "drivers": { type: "folder", children: {} },
            "kernel": { type: "folder", children: {} }
          }
        },
        "Users": {
          type: "folder",
          children: {
            "ariana": {
              type: "folder",
              children: {
                "Desktop": { type: "folder", children: {} },
                "Documents": {
                  type: "folder",
                  children: {
                    "projects.txt": { type: "file", content: "# Active Projects\n\n1. PolarOS - Advanced desktop environment\n2. AI Integration Framework\n3. Cloud Infrastructure Suite" },
                    "notes.md": { type: "file", content: "# Development Notes\n\n- Implement responsive UI components\n- Optimize rendering pipeline\n- Add system monitoring capabilities" }
                  }
                },
                "Downloads": { type: "folder", children: {} },
                "Pictures": { type: "folder", children: {} }
              }
            }
          }
        },
        "Programs": { type: "folder", children: {} },
        "Applications": { type: "folder", children: {} }
      }
    }
  };

  function getFSNode(path) {
    let node = fakeFS[path[0]];
    for (let i = 1; i < path.length; i++) {
      if (!node || !node.children) return null;
      node = node.children[path[i]];
    }
    return node;
  }

  const ICONS = {
    terminal: "⌨️",
    explorer: "📂",
    editor: "📝",
    settings: "⚙️",
    browser: "🌐",
    monitor: "📊",
    folder: "📁",
    file: "📄",
  };

  /* ============ TERMINAL ============ */
  function createTerminalApp(container, windowApi) {
    container.innerHTML = `<div class="terminal-app" id="term-output-${windowApi.id}"></div>`;
    const output = container.querySelector(`#term-output-${windowApi.id}`);
    let currentPath = ["C:", "Users", "ariana"];

    function pathString() {
      return currentPath.join("\\");
    }

    function printLine(html) {
      const p = document.createElement("div");
      p.className = "terminal-line";
      p.innerHTML = html;
      output.appendChild(p);
      output.scrollTop = output.scrollHeight;
    }

    function printPrompt() {
      const row = document.createElement("div");
      row.className = "terminal-input-row terminal-line";
      row.innerHTML = `<span class="term-prompt">polaron</span><span class="term-path">@${pathString()}</span>&nbsp;`;
      const input = document.createElement("input");
      input.autocomplete = "off";
      row.appendChild(input);
      output.appendChild(row);
      output.scrollTop = output.scrollHeight;
      input.focus();

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const cmd = input.value.trim();
          input.disabled = true;
          printLine(`<span class="term-prompt">polaron</span><span class="term-path">@${pathString()}</span>&nbsp;${escapeHtml(cmd)}`);
          runCommand(cmd);
        }
      });
    }

    function escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }

    function runCommand(cmd) {
      const [base, ...args] = cmd.split(" ").filter(Boolean);
      const arg = args.join(" ");

      switch ((base || "").toLowerCase()) {
        case "":
          break;
        case "help":
          printLine(`Available commands:\n  ls/dir         List directory contents\n  cd [path]      Change directory\n  cat [file]     Display file contents\n  pwd            Print working directory\n  clear/cls      Clear screen\n  whoami         Show current user\n  date           Show current date/time\n  neofetch       System information\n  exit           Close terminal`);
          break;
        case "ls":
        case "dir": {
          const node = getFSNode(currentPath);
          if (node && node.children) {
            const entries = Object.entries(node.children);
            if (entries.length === 0) {
              printLine(`<span class="term-info">(empty directory)</span>`);
            } else {
              entries.forEach(([name, n]) => {
                const marker = n.type === "folder" ? "📁" : "📄";
                printLine(`${marker} ${name}`);
              });
            }
          }
          break;
        }
        case "cd": {
          if (!arg || arg === ".") break;
          if (arg === "..") {
            if (currentPath.length > 1) currentPath.pop();
            break;
          }
          const node = getFSNode(currentPath);
          if (node && node.children && node.children[arg] && node.children[arg].type === "folder") {
            currentPath.push(arg);
          } else {
            printLine(`<span class="term-error">cd: ${escapeHtml(arg)}: No such directory</span>`);
          }
          break;
        }
        case "pwd":
          printLine(pathString());
          break;
        case "cat": {
          const node = getFSNode(currentPath);
          if (node && node.children && node.children[arg] && node.children[arg].type === "file") {
            printLine(node.children[arg].content);
          } else {
            printLine(`<span class="term-error">cat: ${escapeHtml(arg)}: No such file</span>`);
          }
          break;
        }
        case "clear":
        case "cls":
          output.innerHTML = "";
          break;
        case "whoami":
          printLine("ariana");
          break;
        case "date":
          printLine(new Date().toString());
          break;
        case "neofetch":
          printLine(`  .-//..:://-. 
 POLARON OS v1.0.0
 \n Host: Advanced Desktop Environment
 Kernel: Quantum v6.2
 CPU: Virtual Processor
 RAM: 16GB
 \n Color Mode: Dark Theme (Cyan Accent)`);
          break;
        case "exit":
          windowApi.close();
          return;
        default:
          printLine(`<span class="term-error">polaron: command not found: ${escapeHtml(base)}</span>`);
      }
      printPrompt();
    }

    printLine(`POLARON Terminal — type <b>help</b> for available commands`);
    printLine("");
    printPrompt();
  }

  /* ============ FILE EXPLORER ============ */
  function createExplorerApp(container, windowApi) {
    let currentPath = ["C:", "Users", "ariana"];

    container.innerHTML = `
      <div class="explorer-app">
        <div class="explorer-navbar">
          <button style="cursor:pointer; background:rgba(0,217,255,0.1); border:none; color:#00d9ff; padding:6px 10px; border-radius:6px; font-size:12px;">← Back</button>
          <button style="cursor:pointer; background:rgba(0,217,255,0.1); border:none; color:#00d9ff; padding:6px 10px; border-radius:6px; font-size:12px;">→ Forward</button>
          <button style="cursor:pointer; background:rgba(0,217,255,0.1); border:none; color:#00d9ff; padding:6px 10px; border-radius:6px; font-size:12px;">🔄 Refresh</button>
        </div>
        <div style="display:flex; height:calc(100% - 48px);">
          <div class="explorer-sidebar">
            <div class="sb-item active" data-path='["C:","Users","ariana"]'>🏠 Home</div>
            <div class="sb-item" data-path='["C:","Users","ariana","Documents"]'>📄 Documents</div>
            <div class="sb-item" data-path='["C:","Users","ariana","Downloads"]'>⬇️ Downloads</div>
            <div class="sb-item" data-path='["C:","Users","ariana","Pictures"]'>🖼️ Pictures</div>
            <div class="sb-item" data-path='["C:"]'>💽 This PC (C:)</div>
          </div>
          <div class="explorer-main">
            <div class="explorer-path-bar" id="explorer-path"></div>
            <div class="explorer-grid" id="explorer-grid"></div>
          </div>
        </div>
      </div>
    `;

    const grid = container.querySelector("#explorer-grid");
    const pathBar = container.querySelector("#explorer-path");
    const sidebarItems = container.querySelectorAll(".sb-item");

    function render() {
      pathBar.textContent = currentPath.join("\\");
      grid.innerHTML = "";
      const node = getFSNode(currentPath);
      if (!node || !node.children) {
        grid.innerHTML = `<div style="color:#888;font-size:12px;">Cannot display this folder.</div>`;
        return;
      }
      const entries = Object.entries(node.children);
      if (entries.length === 0) {
        grid.innerHTML = `<div style="color:#888;font-size:12px;">Empty folder.</div>`;
        return;
      }
      entries.forEach(([name, n]) => {
        const item = document.createElement("div");
        item.className = "explorer-item";
        const icon = n.type === "folder" ? "📁" : "📄";
        item.innerHTML = `<div class="icon-glyph">${icon}</div><div class="icon-label">${name}</div>`;
        item.addEventListener("dblclick", () => {
          if (n.type === "folder") {
            currentPath = [...currentPath, name];
            updateSidebarActive();
            render();
          } else {
            windowApi.openApp("editor", { title: name, content: n.content || "" });
          }
        });
        grid.appendChild(item);
      });
    }

    function updateSidebarActive() {
      sidebarItems.forEach(el => el.classList.remove("active"));
    }

    sidebarItems.forEach(el => {
      el.addEventListener("click", () => {
        currentPath = JSON.parse(el.getAttribute("data-path"));
        sidebarItems.forEach(x => x.classList.remove("active"));
        el.classList.add("active");
        render();
      });
    });

    render();
  }

  /* ============ TEXT EDITOR ============ */
  function createNotepadApp(container, windowApi, options = {}) {
    container.innerHTML = `
      <div class="notepad-app">
        <div class="notepad-toolbar">
          <button>📋 Copy</button>
          <button>📌 Paste</button>
          <button>↩️ Undo</button>
          <button>↪️ Redo</button>
        </div>
        <textarea placeholder="Start typing…">${options.content || ""}</textarea>
      </div>
    `;
  }

  /* ============ SETTINGS ============ */
  function createSettingsApp(container, windowApi) {
    container.innerHTML = `
      <div class="settings-app">
        <div class="settings-section">
          <h3>Display</h3>
          <div class="settings-row">
            <span>Theme</span>
            <div class="theme-options">
              <div class="theme-swatch active" data-theme="cyan" style="background:linear-gradient(135deg,#0a1428,#1a2332)"></div>
              <div class="theme-swatch" data-theme="purple" style="background:linear-gradient(135deg,#1a0a28,#2a1a42)"></div>
              <div class="theme-swatch" data-theme="green" style="background:linear-gradient(135deg,#0a1a0a,#1a2a1a)"></div>
            </div>
          </div>
        </div>
        <div class="settings-section">
          <h3>System</h3>
          <div class="settings-row"><span>User</span><span style="color:#8b9aac">ariana</span></div>
          <div class="settings-row"><span>OS</span><span style="color:#8b9aac">POLARON v1.0.0</span></div>
          <div class="settings-row"><span>Hostname</span><span style="color:#8b9aac">polaron-station</span></div>
        </div>
        <div class="settings-section">
          <h3>Network</h3>
          <div class="settings-row"><span>Connection</span><span style="color:#00d95f">Connected (Ethernet)</span></div>
          <div class="settings-row"><span>IP Address</span><span style="color:#8b9aac">192.168.1.100</span></div>
        </div>
      </div>
    `;
  }

  /* ============ BROWSER ============ */
  function createBrowserApp(container, windowApi) {
    container.innerHTML = `
      <div style="display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;gap:8px;padding:10px;background:rgba(0,217,255,0.05);border-bottom:1px solid rgba(0,217,255,0.15);">
          <input id="browser-url" value="https://polaron.local" style="flex:1;background:rgba(0,217,255,0.08);border:1px solid rgba(0,217,255,0.15);border-radius:6px;padding:8px 12px;color:#e0e8f0;font-size:12px;outline:none;">
        </div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:#8b9aac;">
          <div style="font-size:48px;">🌐</div>
          <div style="font-size:14px;font-weight:600;">Web Browser</div>
          <div style="font-size:12px;opacity:0.7;max-width:300px;text-align:center;">Advanced web browsing environment. Rendering HTML5, CSS3, and JavaScript applications.</div>
        </div>
      </div>
    `;
  }

  /* ============ SYSTEM MONITOR ============ */
  function createMonitorApp(container, windowApi) {
    container.innerHTML = `
      <div style="padding:16px; height:100%; overflow-y:auto;">
        <h3 style="margin:0 0 12px 0; font-size:15px; font-weight:700; color:#00d9ff;">System Monitor</h3>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div style="background:rgba(0,217,255,0.06); padding:12px; border-radius:8px; border:1px solid rgba(0,217,255,0.1);">
            <div style="font-size:12px; color:#546b82; margin-bottom:6px;">CPU Usage</div>
            <div style="font-size:20px; font-weight:700; color:#00d9ff;">45%</div>
            <div style="width:100%; height:4px; background:rgba(0,217,255,0.1); border-radius:2px; margin-top:8px; overflow:hidden;">
              <div style="width:45%; height:100%; background:#00d9ff;"></div>
            </div>
          </div>
          <div style="background:rgba(0,217,255,0.06); padding:12px; border-radius:8px; border:1px solid rgba(0,217,255,0.1);">
            <div style="font-size:12px; color:#546b82; margin-bottom:6px;">Memory</div>
            <div style="font-size:20px; font-weight:700; color:#00d9ff;">8.2 GB</div>
            <div style="width:100%; height:4px; background:rgba(0,217,255,0.1); border-radius:2px; margin-top:8px; overflow:hidden;">
              <div style="width:62%; height:100%; background:#00d9ff;"></div>
            </div>
          </div>
          <div style="background:rgba(0,217,255,0.06); padding:12px; border-radius:8px; border:1px solid rgba(0,217,255,0.1);">
            <div style="font-size:12px; color:#546b82; margin-bottom:6px;">Disk</div>
            <div style="font-size:20px; font-weight:700; color:#00d9ff;">256 GB</div>
            <div style="width:100%; height:4px; background:rgba(0,217,255,0.1); border-radius:2px; margin-top:8px; overflow:hidden;">
              <div style="width:38%; height:100%; background:#00d9ff;"></div>
            </div>
          </div>
          <div style="background:rgba(0,217,255,0.06); padding:12px; border-radius:8px; border:1px solid rgba(0,217,255,0.1);">
            <div style="font-size:12px; color:#546b82; margin-bottom:6px;">Network</div>
            <div style="font-size:20px; font-weight:700; color:#00d95f;">Connected</div>
            <div style="margin-top:8px; font-size:11px; color:#8b9aac;">↓ 2.4 Mbps ↑ 1.1 Mbps</div>
          </div>
        </div>
        <div style="margin-top:16px;">
          <h3 style="margin:0 0 8px 0; font-size:13px; font-weight:700; color:#00d9ff;">Processes</h3>
          <div style="background:rgba(0,217,255,0.06); padding:10px; border-radius:8px; border:1px solid rgba(0,217,255,0.1); font-size:11px; color:#8b9aac; font-family:monospace;">
            system.js       —   12.4 MB
            apps.js         —    8.9 MB
            firefox         —   284.2 MB
            chrome          —   512.4 MB
            explorer        —    24.1 MB
          </div>
        </div>
      </div>
    `;
  }

  window.createTerminalApp = createTerminalApp;
  window.createExplorerApp = createExplorerApp;
  window.createNotepadApp = createNotepadApp;
  window.createSettingsApp = createSettingsApp;
  window.createBrowserApp = createBrowserApp;
  window.createMonitorApp = createMonitorApp;

})();
