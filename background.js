const PROXY_LIST_URL = "";
const DEFAULT_CONFIG = {
  desired_name: ""
};
const DEFAULT_DOMAINS = [
  "whatismyipaddress.com"
];

// Fetch config from storage or use defaults
async function getConfig() {
  const stored = await browser.storage.local.get(["desired_name", "domains"]);
  return {
    desired_name: stored.desired_name || DEFAULT_CONFIG.desired_name,
    domains: stored.domains || DEFAULT_DOMAINS
  };
}

async function fetchProxyList() {
  const res = await fetch(PROXY_LIST_URL);
  if (!res.ok) throw new Error("Failed to fetch proxy list: ${res.status} ${res.statusText}");
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
    const { desired_name, domains } = await getConfig();
    const proxyList = await fetchProxyList();
    const proxy = proxyList.find(p => p.name === desired_name);

    if (!proxy) throw new Error(`Proxy named '${desired_name}' not found`);

    const pacScript = generatePAC(proxy, domains);
    const pacDataURI = "data:," + encodeURIComponent(pacScript);

    await applyPAC(pacDataURI);

    async function applyPAC(pacDataURI) {
      await browser.proxy.settings.set({
        value: {
          proxyType: "autoConfig",
          autoConfigUrl: pacDataURI
        },
      scope: "regular" // Ensures it applies at the right level (non-incognito)
      });
    }

    console.log("PAC updated successfully.");                   // For prod
    console.log("PAC updated successfully: ", pacDataURI);      // For debug only
    console.log("PAC script (human-readable):\n", pacScript);   // For debug only

  } catch (err) {
    console.error("PAC update failed:", err);
  }
}

// Manual trigger
browser.browserAction.onClicked.addListener(updatePAC);

// Periodic updates
browser.alarms.create("auto-pac", { periodInMinutes: 30 });
browser.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === "auto-pac") {
    console.log("Ding! 30 minutes have passed. Updating.");
    updatePAC();
  }
});

// Immediate update on browser startup or installation, or enabling
updatePAC();