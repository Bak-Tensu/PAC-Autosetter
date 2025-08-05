document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);

async function restoreOptions() {
  const { desired_name, domains, auto_mode, last_updated } = await browser.storage.local.get([
    "desired_name",
    "domains",
    "auto_mode",
    "last_updated"
  ]);

  document.getElementById("proxyName").value = desired_name || "";
  document.getElementById("domains").value = (domains || ["whatismyipaddress.com"]).join("\n");
  document.getElementById("autoMode").checked = auto_mode !== false;

  document.getElementById("currentStatus").textContent = auto_mode === false ? "Manual" : "Automatic";
  document.getElementById("lastUpdated").textContent = last_updated || "Never";
}

async function saveOptions() {
  const desired_name = document.getElementById("proxyName").value.trim();
  const domains = document.getElementById("domains").value.split("\n").map(d => d.trim()).filter(Boolean);
  const auto_mode = document.getElementById("autoMode").checked;

  await browser.storage.local.set({
    desired_name,
    domains,
    auto_mode
  });

  document.getElementById("currentStatus").textContent = auto_mode ? "Automatic" : "Manual";
  document.getElementById("status").style.color = "green";
  document.getElementById("status").textContent = "Saved!";
  setTimeout(() => location.reload(), 800);
}