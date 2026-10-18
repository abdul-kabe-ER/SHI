const PLATFORM_ROLE_POLICIES = {
  hospital: {
    email: "billing@cityhospital.org",
    name: "City Hospital",
    role: "Hospital Representative",
    avatar: "H",
    allowedViews: ["hospital-dashboard-view", "new-claim-form-view"],
    menuItems: [
      { id: "nav-hosp-dash", label: "Claims Dashboard", icon: "fa-chart-pie", targetView: "hospital-dashboard-view" },
      { id: "nav-new-claim", label: "Submit New Claim", icon: "fa-plus-circle", targetView: "new-claim-form-view" }
    ]
  },
  policyholder: {
    email: "priya.r@gmail.com",
    name: "Rasheed Ahmed",
    role: "Policy Holder Account",
    avatar: "P",
    allowedViews: ["policyholder-dashboard-view"],
    menuItems: [
      { id: "nav-holder-dash", label: "My Claims Ledger", icon: "fa-user-shield", targetView: "policyholder-dashboard-view" }
    ]
  },
  officer: {
    email: "a.khan@insurance.com",
    name: "A. Khan",
    role: "Senior Officer",
    avatar: "AK",
    allowedViews: ["officer-review-view"],
    menuItems: [
      { id: "nav-officer-rev", label: "Review Queue", icon: "fa-list-check", targetView: "officer-review-view" }
    ]
  },
  admin: {
    email: "admin@shicpfds.com",
    name: "Core System Kernel",
    role: "System Infrastructure Admin",
    avatar: "A",
    allowedViews: ["admin-audit-view"],
    menuItems: [
      { id: "nav-admin-audit", label: "System Audit Logs", icon: "fa-clock-rotate-left", targetView: "admin-audit-view" }
    ]
  }
};


let MASTER_CLAIMS_REGISTRY = [
  { id: "CLM-2026-0890", policyholder: "Jameel Khan", policyId: "POL-2024-00088", hospital: "City Hospital", procedure: "MRI – lumbar spine, without contrast", cpt: "72148", amount: 3870, status: "Escalated", risk: "High", riskScore: 78, date: "8 Jun 2026", time: "14:14" },
  { id: "CLM-2026-0008", policyholder: "Rasheed Ahmed", policyId: "POL-2024-00142", hospital: "City Hospital", procedure: "Appendectomy – open", cpt: "44950", amount: 8100, status: "Pending review", risk: "Medium", riskScore: 45, date: "10 Jun 2026", time: "15:28" },
  { id: "CLM-2026-0889", policyholder: "Rasheed Ahmed", policyId: "POL-2024-00142", hospital: "City Hospital", procedure: "Appendectomy – open", cpt: "44950", amount: 9300, status: "Pending review", risk: "Medium", riskScore: 45, date: "7 Jun 2026", time: "11:05" }
];

let AUDIT_LOGS = [
  { timestamp: "10 Jun 2026, 15:28:49", interface: "POST /api/v1/claims", subsystem: "INGEST_ENGINE", message: "Claim CLM-2026-0008 payload verification complete.", sha: "sha256:7f9a1" },
  { timestamp: "10 Jun 2026, 15:28:49", interface: "VALIDATE_RULES", subsystem: "POLICY_CHECK", message: "Eligibility validation passed – active, in-network.", sha: "sha256:3c2b8" }
];

const ENROLLED_POLICIES = {
  "POL-2024-00142": { name: "Rasheed Ahmed", tier: "GOLD", limit: "$14,200" },
  "POL-2024-00088": { name: "Jameel Khan", tier: "PLATINUM", limit: "$22,500" }
};

let CURRENT_ROLE = "hospital";
let SELECTED_CLAIM_ID = null;


const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const loginForm = document.getElementById("login-form");
const loginEmail = document.getElementById("login-email");
const roleButtons = document.querySelectorAll(".dock-role-btn");
const dynamicMenu = document.getElementById("dynamic-sidebar-menu");
const userAvatar = document.getElementById("current-user-role");
const userDisplayName = document.getElementById("user-display-name");
const userDisplayRole = document.getElementById("user-display-role");
const logoutBtn = document.getElementById("logout-btn");


roleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    CURRENT_ROLE = btn.dataset.role;
    loginEmail.value = PLATFORM_ROLE_POLICIES[CURRENT_ROLE].email;
  });
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  authScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  configurePortalLayout();
});

logoutBtn.addEventListener("click", () => {
  appScreen.classList.add("hidden");
  authScreen.classList.remove("hidden");
});


function configurePortalLayout() {
  const profile = PLATFORM_ROLE_POLICIES[CURRENT_ROLE];
  userAvatar.textContent = profile.avatar;
  userDisplayName.textContent = profile.name;
  userDisplayRole.textContent = profile.role;

  dynamicMenu.innerHTML = "";
  profile.menuItems.forEach(item => {
    const a = document.createElement("a");
    a.href = "#";
    a.id = item.id;
    a.innerHTML = `<i class="fa-solid ${item.icon}"></i> <span>${item.label}</span>`;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll("#dynamic-sidebar-menu a").forEach(link => link.classList.remove("active"));
      a.classList.add("active");
      switchWorkspaceView(item.targetView);
    });
    dynamicMenu.appendChild(a);
  });

  const standardEntryLink = dynamicMenu.querySelector("a");
  if (standardEntryLink) standardEntryLink.click();
}

function switchWorkspaceView(targetViewId) {
  document.querySelectorAll(".content-view").forEach(v => v.classList.add("hidden"));
  document.getElementById(targetViewId).classList.remove("hidden");
  
  if (targetViewId === "hospital-dashboard-view") renderHospitalMetricsTable();
  if (targetViewId === "policyholder-dashboard-view") renderPolicyholderMetricsTable();
  if (targetViewId === "officer-review-view") renderOfficerQueueTable();
  if (targetViewId === "admin-audit-view") renderAdminAuditTable();
}


document.getElementById("open-new-claim-btn").addEventListener("click", () => {
  const claimMenuOption = document.getElementById("nav-new-claim");
  if(claimMenuOption) {
    claimMenuOption.click();
  } else {
    switchWorkspaceView("new-claim-form-view");
  }
});

function renderHospitalMetricsTable() {
  const tbody = document.getElementById("hospital-claims-table-body");
  tbody.innerHTML = "";
  
  document.getElementById("hosp-metric-total").textContent = MASTER_CLAIMS_REGISTRY.length;
  document.getElementById("hosp-metric-pending").textContent = MASTER_CLAIMS_REGISTRY.filter(c => c.status.toLowerCase().includes("pending")).length;
  document.getElementById("hosp-metric-approved").textContent = MASTER_CLAIMS_REGISTRY.filter(c => c.status === "Approved").length;
  document.getElementById("hosp-metric-flagged").textContent = MASTER_CLAIMS_REGISTRY.filter(c => c.status === "Escalated").length;
  document.getElementById("hosp-table-badge").textContent = `${MASTER_CLAIMS_REGISTRY.length} Entries`;

  MASTER_CLAIMS_REGISTRY.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono'; font-weight:500;">${c.id}</td>
      <td><strong>${c.policyholder}</strong></td>
      <td>${c.procedure}</td>
      <td style="font-weight:600;">$${c.amount.toLocaleString()}</td>
      <td><span class="status-badge ${c.status.toLowerCase().replace(/\s+/g, '')}">${c.status}</span></td>
      <td><span class="risk-badge ${c.risk.toLowerCase()}">${c.risk}</span></td>
      <td class="text-muted">${c.date}</td>
    `;
    tbody.appendChild(tr);
  });
}


const policyField = document.getElementById("claim-policy-id");
const dateField = document.getElementById("claim-date");
const lookupIndicator = document.getElementById("lookup-success-indicator");
const dispatchBtn = document.getElementById("submit-claim-btn");

const cptCodeField = document.getElementById("cpt-code-field");
const cptDescField = document.getElementById("cpt-desc-field");
const cptQtyField = document.getElementById("cpt-qty-field");
const cptAmountField = document.getElementById("cpt-amount-field");

[policyField, dateField, cptCodeField, cptDescField, cptQtyField, cptAmountField].forEach(field => {
  field.addEventListener("input", runFormValidationMatrix);
});

function runFormValidationMatrix() {
  const match = ENROLLED_POLICIES[policyField.value.trim()];
  let isValid = true;

  
  if (policyField.value.trim() && dateField.value && cptCodeField.value.trim() && cptDescField.value.trim() && cptAmountField.value) {
    document.getElementById("rule-fields-complete").classList.add("checked");
    document.getElementById("rule-fields-complete").querySelector("i").className = "fa-solid fa-square-check";
  } else {
    document.getElementById("rule-fields-complete").classList.remove("checked");
    document.getElementById("rule-fields-complete").querySelector("i").className = "fa-solid fa-square";
    isValid = false;
  }

  
  if (match) {
    document.getElementById("lookup-name").textContent = match.name;
    document.getElementById("lookup-balance").textContent = `Limit: ${match.limit}`;
    lookupIndicator.classList.remove("hidden");
    
    document.getElementById("side-holder").textContent = match.name;
    document.getElementById("side-tier").textContent = match.tier;
    
    document.getElementById("rule-valid-policy").classList.add("checked");
    document.getElementById("rule-valid-policy").querySelector("i").className = "fa-solid fa-square-check";
  } else {
    lookupIndicator.classList.add("hidden");
    document.getElementById("side-holder").textContent = "—";
    document.getElementById("side-tier").textContent = "—";
    
    document.getElementById("rule-valid-policy").classList.remove("checked");
    document.getElementById("rule-valid-policy").querySelector("i").className = "fa-solid fa-square";
    isValid = false;
  }

  
  if (cptCodeField.value.trim().length >= 5) {
    document.getElementById("rule-cpt-match").classList.add("checked");
    document.getElementById("rule-cpt-match").querySelector("i").className = "fa-solid fa-square-check";
  } else {
    document.getElementById("rule-cpt-match").classList.remove("checked");
    document.getElementById("rule-cpt-match").querySelector("i").className = "fa-solid fa-square";
    isValid = false;
  }

  
  const grossVal = (parseFloat(cptAmountField.value) || 0) * (parseInt(cptQtyField.value) || 1);
  document.getElementById("side-total").textContent = `$${grossVal.toLocaleString()}`;

  if (isValid) {
    dispatchBtn.removeAttribute("disabled");
  } else {
    dispatchBtn.setAttribute("disabled", "true");
  }
}


dispatchBtn.addEventListener("click", () => {
  const match = ENROLLED_POLICIES[policyField.value.trim()];
  const grossVal = (parseFloat(cptAmountField.value) || 0) * (parseInt(cptQtyField.value) || 1);
  const generatedId = `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  let autoRisk = "Low";
  let autoRiskScore = 18;
  if (grossVal > 5000) {
    autoRisk = "Medium";
    autoRiskScore = 48;
  }
  if (grossVal > 9000) {
    autoRisk = "High";
    autoRiskScore = 82;
  }

  const newClaimPayload = {
    id: generatedId,
    policyholder: match.name,
    policyId: policyField.value.trim(),
    hospital: "City Hospital",
    procedure: cptDescField.value.trim(),
    cpt: cptCodeField.value.trim(),
    amount: grossVal,
    status: "Pending review",
    risk: autoRisk,
    riskScore: autoRiskScore,
    date: "10 Jun 2026",
    time: "12:15"
  };

  MASTER_CLAIMS_REGISTRY.unshift(newClaimPayload);

  AUDIT_LOGS.unshift({
    timestamp: "10 Jun 2026, 12:15:00",
    interface: "POST /api/v1/claims",
    subsystem: "INGEST_ENGINE",
    message: `Claim ${generatedId} injected successfully.`,
    sha: `sha256:${Math.random().toString(16).substr(2, 5)}`
  });

  document.getElementById("modal-claim-id").textContent = generatedId;
  document.getElementById("success-modal").classList.remove("hidden");

  // Reset Input Forms
  policyField.value = "";
  dateField.value = "";
  cptCodeField.value = "";
  cptDescField.value = "";
  cptQtyField.value = "1";
  cptAmountField.value = "";
  runFormValidationMatrix();
});

document.getElementById("modal-dashboard-btn").addEventListener("click", () => {
  document.getElementById("success-modal").classList.add("hidden");
  const dashLink = document.getElementById("nav-hosp-dash");
  if(dashLink) dashLink.click();
});


function renderPolicyholderMetricsTable() {
  const tbody = document.getElementById("holder-claims-table-body");
  tbody.innerHTML = "";

  const myClaims = MASTER_CLAIMS_REGISTRY.filter(c => c.policyholder === "Rasheed Ahmed");
  document.getElementById("holder-metric-total").textContent = myClaims.length;

  myClaims.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono'; font-weight:500;">${c.id}</td>
      <td><strong>${c.procedure}</strong><br><span class="text-muted" style="font-size:0.75rem;">Facility: ${c.hospital}</span></td>
      <td style="font-weight:600;">$${c.amount.toLocaleString()}</td>
      <td><span class="status-badge ${c.status.toLowerCase().replace(/\s+/g, '')}">${c.status}</span></td>
      <td class="text-muted">${c.date} ${c.time}</td>
    `;
    tbody.appendChild(tr);
  });
}


const reviewModal = document.getElementById("review-modal");
document.getElementById("close-modal-btn").addEventListener("click", () => reviewModal.classList.add("hidden"));

function renderOfficerQueueTable() {
  const tbody = document.getElementById("officer-queue-table-body");
  tbody.innerHTML = "";

  MASTER_CLAIMS_REGISTRY.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-family:'JetBrains Mono'; font-weight:500;">${c.id}</td>
      <td>${c.hospital}</td>
      <td><strong>${c.policyholder}</strong><br><span class="text-muted" style="font-size:0.75rem;">${c.policyId}</span></td>
      <td style="font-weight:600;">$${c.amount.toLocaleString()}</td>
      <td>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <span class="risk-badge ${c.risk.toLowerCase()}">${c.risk}</span>
          <span class="text-muted" style="font-size:0.8rem;">(${c.riskScore}%)</span>
        </div>
      </td>
      <td>
        <button class="action-btn core-btn-primary" style="padding:0.4rem 0.8rem; font-size:0.8rem;" onclick="triggerAdjudicationReview('${c.id}')">
          Evaluate Matrix
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.triggerAdjudicationReview = function(claimId) {
  SELECTED_CLAIM_ID = claimId;
  const claim = MASTER_CLAIMS_REGISTRY.find(c => c.id === claimId);
  if (!claim) return;

  document.getElementById("modal-claim-ref").textContent = claim.id;
  document.getElementById("modal-patient-name").textContent = claim.policyholder;
  document.getElementById("modal-provider").textContent = claim.hospital;
  document.getElementById("modal-amount").textContent = `$${claim.amount.toLocaleString()}`;
  document.getElementById("modal-procedure").textContent = `[CPT ${claim.cpt}] - ${claim.procedure}`;

  reviewModal.classList.remove("hidden");
};

document.getElementById("adj-approve-btn").addEventListener("click", () => finalizeAdjudicationDecision("Approved"));
document.getElementById("adj-flag-btn").addEventListener("click", () => finalizeAdjudicationDecision("Escalated"));
document.getElementById("adj-reject-btn").addEventListener("click", () => finalizeAdjudicationDecision("Rejected"));

function finalizeAdjudicationDecision(targetStatus) {
  if (!SELECTED_CLAIM_ID) return;
  const claim = MASTER_CLAIMS_REGISTRY.find(c => c.id === SELECTED_CLAIM_ID);
  if (claim) {
    claim.status = targetStatus;
    if(targetStatus === "Approved") claim.risk = "Low";
    
    AUDIT_LOGS.unshift({
      timestamp: "10 Jun 2026, 12:15:00",
      interface: "ADJUDICATE_CLAIM",
      subsystem: "UNDERWRITING_DESK",
      message: `Claim ${claim.id} manually overriden to ${targetStatus} by Senior Officer.`,
      sha: "sha256:9b1a4"
    });
  }
  reviewModal.classList.add("hidden");
  renderOfficerQueueTable();
}
function renderAdminAuditTable() {
  const tbody = document.getElementById("admin-logs-table-body");
  tbody.innerHTML = "";

  AUDIT_LOGS.forEach(log => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${log.timestamp}</td>
      <td><span class="status-badge info">${log.interface}</span></td>
      <td><strong>${log.subsystem}</strong></td>
      <td class="text-muted">${log.message}</td>
      <td><span class="sha-stamp" style="color:#38bdf8;">${log.sha}</span></td>
    `;
    tbody.appendChild(tr);
  });
}