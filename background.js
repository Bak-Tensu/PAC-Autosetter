const PROXY_LIST_URL = "";
const DEFAULT_CONFIG = { desired_name: "" };
const DEFAULT_DOMAINS = ["whatismyipaddress.com"];

async function getConfig() {
  const stored = await browser.storage.local.get(["desired_name", "domains", "auto_mode", "proxy_list"]);
  return {
    desired_name: stored.desired_name || DEFAULT_CONFIG.desired_name,
    domains: stored.domains || DEFAULT_DOMAINS,
    auto_mode: stored.auto_mode !== false, // defaults to true
    proxy_list: stored.proxy_list || PROXY_LIST_URL
  };
}

async function fetchProxyList(proxy_list) {
  const res = await fetch(proxy_list);
  if (!res.ok) throw new Error(`Failed to fetch proxy list: ${res.status} ${res.statusText}`);
  return await res.json();
}

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

async function updatePAC() {
  try {
    const { desired_name, domains, proxy_list } = await getConfig();
    const proxyList = await fetchProxyList(proxy_list);
    const proxy = proxyList.find(p => p.name === desired_name);
    if (!proxy) throw new Error(`Proxy named '${desired_name}' not found`);
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

async function setupAlarmBasedOnAutoMode() {
  const { auto_mode } = await getConfig();
  await browser.alarms.clearAll();
  if (auto_mode) {
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

// Initial setup (Installation, browser startup or enabling)
(async function initializeExtension () {
  await updatePAC();
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

// Creating listener to react immediately to Automatic mode toggle (after saving changes)
// Needed to not having to relaunch browser after a change
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.auto_mode) {
    console.log("Automatic mode (auto_mode) changed, reconfiguring alarms...");
    setupAlarmBasedOnAutoMode();
  }
});