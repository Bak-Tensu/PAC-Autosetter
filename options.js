document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("generate-now").addEventListener("click", generatePACInOptions);

// Retrieve config from storage, or assign defaults if not found
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

// Store config in storage, then retrieve the status from Auto Mode and shortly display a short confirmation
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

// Manually create a PAC URI
async function generatePACInOptions() {
  const statusDiv = document.getElementById("manualUpdateFeedback");
  statusDiv.textContent = "Updating PAC...";
  statusDiv.style.color = "black";
  console.log("Manual update launched from options.")

  try {
    await browser.runtime.getBackgroundPage().then(bg => bg.updatePAC());
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
