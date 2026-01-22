const PROXY_LIST_URL = "";
const DEFAULT_CONFIG = { desired_name: "" };
const DEFAULT_DOMAINS = ["whatismyipaddress.com"];

async function getConfig() {
  const stored = await browser.storage.local.get(["mode", "desired_name", "domains", "auto_mode", "proxy_list", "proxy_direct_host", "proxy_direct_port" ]);
  return {
    mode: stored.mode || "mode1",
    
    // Mode 1: First Mode with only desired_name, auto_mode, proxy_list
    desired_name: stored.desired_name || DEFAULT_CONFIG.desired_name,
    proxy_list: stored.proxy_list || PROXY_LIST_URL,
    auto_mode: stored.auto_mode !== false, // defaults to true

    // Mode 2: Second mode with direct proxy settings (not yet implemented)
    proxy_direct_host: stored.proxy_direct_host || "",
    proxy_direct_port: stored.proxy_direct_port || "",

    // Shared between modes
    domains: stored.domains || DEFAULT_DOMAINS
    
    
  };
}

async function fetchProxyList(proxy_list) {
  const res = await fetch(proxy_list);
  if (!res.ok) throw new Error(`Failed to fetch proxy list: ${res.status} ${res.statusText}`);
  return await res.json();
}

// Generate PAC script based on selected proxy and domains (used by Modes 1 and 2)
// Note : Discarding testing of strict mode as too many sites break. Find another solution to implement strict and loose modes later.
// Maybe on a domain basis.
function generatePAC(proxy, domains) {
  return `function FindProxyForURL(url, host) {
    const domains = ${JSON.stringify(domains)};
    for (let i = 0; i < domains.length; i++) {
      if (host === domains[i] || host.endsWith("." + domains[i])) {
        return "PROXY ${proxy.host}:${proxy.port}";
      }
    }
    return "DIRECT";
  }`;
}

// Main function to update PAC settings based on current Mode
async function updatePAC() {
  try {
    const { mode, desired_name, domains, proxy_list, proxy_direct_host, proxy_direct_port } = await getConfig();

    console.log("Updating PAC in", mode);

    let proxy;
    if (mode === "mode1") {
      // === MODE 1: Fetch proxy list and select by name ===
      const proxyList = await fetchProxyList(proxy_list);
      proxy = proxyList.find(p => p.name === desired_name);

      if (!proxy) {
        throw new Error(`Proxy named '${desired_name}' not found`);
      }

    } else if (mode === "mode2") {
      // === MODE 2: Direct proxy (host + port) ===
      if (!proxy_direct_host || !proxy_direct_port) {
        throw new Error("Direct proxy host or port missing (Mode 2)");
      }
    proxy = {
      host: proxy_direct_host,
      port: Number(proxy_direct_port) // Ensure port is a number.
    };

    } else {
      throw new Error(`Unknown mode: ${mode}`);
    }

    // Mode-agnostic PAC generation
    const pacScript = generatePAC(proxy, domains);
    const pacDataURI = "data:," + encodeURIComponent(pacScript);
    await browser.proxy.settings.set({
      value: {
        proxyType: "autoConfig",
        autoConfigUrl: pacDataURI
      },
      scope: "regular" // Ensures it applies at the right level (non-incognito)
    });

    const now = new Date().toLocaleString();
    await browser.storage.local.set({ last_updated: now });

    console.log("PAC updated successfully at", now);
    console.log("PAC script (machine readable):\n", pacDataURI);      // For debug only
    console.log("PAC script (human-readable):\n", pacScript);         // For debug only

  } catch (err) {
    console.error("PAC update failed:", err);
    throw err; // Important: let callers (ie. when updatePAC is called from the options page) see the failure
  }
}

// Setup or clear alarms based on current mode and automatic renewal setting
async function setupAlarmBasedOnAutoMode() {
  const { mode, auto_mode } = await getConfig();
  await browser.alarms.clearAll();
  if (mode === "mode1" && auto_mode) {
    browser.alarms.create("auto-pac", { periodInMinutes: 30 });
  }
}

// Manual trigger
browser.browserAction.onClicked.addListener(updatePAC);  

// Handle periodic update
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "auto-pac") {
    console.log("Ding! 30 minutes passed. Updating PAC in 10 seconds.");
    setTimeout(updatePAC, 10000); // Short delay so that it does not immediately fails after waking up from sleep.
  }
});

// Initial setup (Installation, browser startup or enabling). Disregard error if any (eg. first install when no config yet).
(async function initializeExtension () {
  try {
    await updatePAC();
  } catch (e) {
    console.warn("Disregard if 1st install or re-enabling. Initial PAC setup skipped:", e.message);
  }
  await setupAlarmBasedOnAutoMode();
})();

// Create the "Options" menu when right-clicking on the Toolbar Icon.
browser.menus.create({
    title: "Options",
    contexts: ["browser_action"],
    onclick: function () {
        browser.runtime.openOptionsPage();
    },
});

// Creating listener to react immediately to either Mode 1/2 OR Automatic mode toggle (after saving changes)
// Needed to not having to relaunch browser after a change
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.auto_mode || changes.mode)) {
    console.log("Mode (1/2) or Automatic Mode (On/Off) changed, reconfiguring alarms...");
    setupAlarmBasedOnAutoMode();
  }
});