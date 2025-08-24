document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("generate-now").addEventListener("click", generatePACInOptions);
document.getElementById("btn-export").addEventListener("click", exportOptions);
document.getElementById("btn-import").addEventListener("click", () => {
  document.getElementById("file-import").click();
});
document.getElementById("file-import").addEventListener("change", importOptions);

// Retrieve config from storage, or assign defaults if not found
async function restoreOptions() {
  const { desired_name, domains, auto_mode, last_updated, proxy_list } = await browser.storage.local.get([
    "desired_name",
    "domains",
    "auto_mode",
    "last_updated",
    "proxy_list"
  ]);

  document.getElementById("proxListURL").value = proxy_list || "";
  document.getElementById("proxyName").value = desired_name || "";
  document.getElementById("domains").value = (domains || ["whatismyipaddress.com"]).join("\n");
  document.getElementById("autoMode").checked = auto_mode !== false;

  document.getElementById("currentStatus").textContent = auto_mode === false ? "Manual" : "Automatic";
  document.getElementById("lastUpdated").textContent = last_updated || "Never";
}

// Store config in storage, then retrieve the status from Auto Mode and shortly display a short confirmation
async function saveOptions() {
  const desired_name = document.getElementById("proxyName").value.trim();
  const domains = document.getElementById("domains").value.split("\n").map(d => d.trim()).filter(Boolean);
  const auto_mode = document.getElementById("autoMode").checked;
  const proxy_list = document.getElementById("proxListURL").value.trim();

  await browser.storage.local.set({
    desired_name,
    domains,
    auto_mode,
    proxy_list
  });

  document.getElementById("currentStatus").textContent = auto_mode ? "Automatic" : "Manual";
  document.getElementById("status").style.color = "green";
  document.getElementById("status").textContent = "Saved!";
  setTimeout(() => location.reload(), 800);
}

// Manually create a PAC URI
async function generatePACInOptions() {
  const statusDiv = document.getElementById("manualUpdateFeedback");
  statusDiv.textContent = "Updating PAC...";
  statusDiv.style.color = "black";
  console.log("Manual update launched from options.")

  try {
    const bg = await browser.runtime.getBackgroundPage();
    await bg.updatePAC(); // Separated so that if this throws, it will be caught here
    statusDiv.textContent = "PAC updated successfully!";
    statusDiv.style.color = "green";
  } catch (err) {
    console.error("PAC update from options page failed:", err);
    statusDiv.textContent = "PAC update failed. See console.";
    statusDiv.style.color = "red";
    alert("Failed to regenerate PAC. See console for details.");
  }

  // Fade out after 5 seconds then reload to update the page's state
  setTimeout(() => {
    statusDiv.textContent = "";
    location.reload();
  }, 5000);
};

// Export config in a local file
async function exportOptions() {
  try {
    // Grab everything we care about
    const { desired_name, domains, auto_mode, proxy_list } = await browser.storage.local.get([
      "desired_name", "domains", "auto_mode", "proxy_list"
    ]);

    // Build the export object with versioning
    const exportData = {
      version: 1,
      desired_name: desired_name || "",
      domains: domains || [],
      auto_mode: auto_mode !== false,
      proxy_list: proxy_list || ""
    };

    // Convert to pretty JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = "PAC-extension-config.json"; // Rename as you like
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Export failed:", err);
    alert("Failed to export settings. See console for details.");
  }
}

// Import config from a local file
async function importOptions(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Check JSON version
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.version !== 1) {
      alert("Unsupported config version: " + data.version);
      return;
    }

    // Import config found in the JSON into browser storage
    const { desired_name, domains, auto_mode, proxy_list } = data;

    await browser.storage.local.set({
      desired_name,
      domains,
      auto_mode,
      proxy_list
    });

    alert("Settings imported successfully!");
    location.reload(); // Reload to refresh the UI
  } catch (err) {
    console.error("Failed to import settings:", err);
    alert("Import failed: invalid file format.");
  }
}