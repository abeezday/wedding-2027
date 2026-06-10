const weddingDate = new Date("2027-03-07T12:00:00+08:00");

function pad(value) { return String(value).padStart(2, "0"); }
function updateCountdown() {
  const diff = weddingDate - new Date();
  const ids = ["days", "hours", "minutes", "seconds"];
  if (diff <= 0) { ids.forEach(id => document.getElementById(id).textContent = "00"); return; }
  const seconds = Math.floor(diff / 1000);
  document.getElementById("days").textContent = Math.floor(seconds / 86400);
  document.getElementById("hours").textContent = pad(Math.floor((seconds % 86400) / 3600));
  document.getElementById("minutes").textContent = pad(Math.floor((seconds % 3600) / 60));
  document.getElementById("seconds").textContent = pad(seconds % 60);
}
updateCountdown();
setInterval(updateCountdown, 1000);

const entry = {
  name: "entry.2047345391",
  relationship: "entry.1339287923",
  attendance: "entry.1336036681",
  adults: "entry.630238932",
  children: "entry.31850087",
  chairs: "entry.1588449523",
  vegetarian: "entry.1535829381",
  invite: "entry.2080928339",
  email: "entry.1521896031",
  address: "entry.1299100011",
  msgAbsent: "entry.1716942766",
  msgPaper: "entry.1736010593",
  msgDigital: "entry.1460457126"
};
const formAction = "https://docs.google.com/forms/d/e/1FAIpQLSfyIvVsf3bES8Ry7PI2CIQUpeXWdNLXV1HU5PCOViYAp2VNGA/formResponse";

const form = document.getElementById("rsvpForm");
const steps = [...document.querySelectorAll(".form-step")];
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const stepLabel = document.getElementById("stepLabel");
const progressBar = document.getElementById("progressBar");
const statusEl = document.getElementById("formStatus");
const emailField = document.getElementById("emailField");
const addressField = document.getElementById("addressField");
let flow = [1, 2, 3, 4, 5];
let currentIndex = 0;

["adults", "children", "chairs", "vegetarian"].forEach(name => {
  const select = form.elements[name];
  for (let i = 0; i <= 5; i++) select.add(new Option(i, i));
});
form.elements.adults.value = "1";

function isAttending() {
  return form.elements.attendance.value.startsWith("當然");
}
function updateFlow() {
  flow = isAttending() ? [1, 2, 3, 4, 5] : [1, 2, 5];
  if (currentIndex >= flow.length) currentIndex = flow.length - 1;
}
function showStep() {
  updateFlow();
  const stepNum = flow[currentIndex];
  steps.forEach(s => s.classList.toggle("active", Number(s.dataset.step) === stepNum));
  prevBtn.style.visibility = currentIndex === 0 ? "hidden" : "visible";
  nextBtn.style.display = currentIndex === flow.length - 1 ? "none" : "inline-block";
  submitBtn.style.display = currentIndex === flow.length - 1 ? "inline-block" : "none";
  stepLabel.textContent = `Step ${currentIndex + 1} of ${flow.length}`;
  progressBar.style.width = `${((currentIndex + 1) / flow.length) * 100}%`;
  updateInviteFields();
}
function currentStepValid() {
  const step = steps.find(s => Number(s.dataset.step) === flow[currentIndex]);
  const fields = [...step.querySelectorAll("input, textarea, select")].filter(el => el.offsetParent !== null);
  for (const field of fields) {
    if (!field.checkValidity()) { field.reportValidity(); return false; }
  }
  return true;
}
function updateInviteFields() {
  const invite = form.elements.invite.value;
  emailField.classList.toggle("show", invite.includes("電子"));
  addressField.classList.toggle("show", invite.includes("紙本"));
  form.elements.email.required = invite.includes("電子");
  form.elements.address.required = invite.includes("紙本");
}
form.addEventListener("change", e => {
  if (e.target.name === "attendance") { updateFlow(); showStep(); }
  if (e.target.name === "invite") updateInviteFields();
});
nextBtn.addEventListener("click", () => { if (currentStepValid()) { currentIndex++; showStep(); } });
prevBtn.addEventListener("click", () => { currentIndex--; showStep(); });

form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentStepValid()) return;
  statusEl.textContent = "送出中...";
  submitBtn.disabled = true;
  const fd = new FormData();
  fd.append(entry.name, form.elements.name.value.trim());
  fd.append(entry.relationship, form.elements.relationship.value);
  fd.append(entry.attendance, form.elements.attendance.value);
  const attending = isAttending();
  if (attending) {
    fd.append(entry.adults, form.elements.adults.value);
    fd.append(entry.children, form.elements.children.value);
    fd.append(entry.chairs, form.elements.chairs.value);
    fd.append(entry.vegetarian, form.elements.vegetarian.value);
    fd.append(entry.invite, form.elements.invite.value);
    if (form.elements.invite.value.includes("電子")) {
      fd.append(entry.email, form.elements.email.value.trim());
      fd.append(entry.msgDigital, form.elements.message.value.trim());
    } else if (form.elements.invite.value.includes("紙本")) {
      fd.append(entry.address, form.elements.address.value.trim());
      fd.append(entry.msgPaper, form.elements.message.value.trim());
    } else {
      fd.append(entry.msgDigital, form.elements.message.value.trim());
    }
  } else {
    fd.append(entry.msgAbsent, form.elements.message.value.trim());
  }

  try {
    await fetch(formAction, { method: "POST", mode: "no-cors", body: fd });
    form.innerHTML = `<div class="thanks"><p class="section-kicker">Thank you</p><h3>謝謝您的回覆</h3><p>期待婚禮當天見到您。</p></div>`;
  } catch (error) {
    statusEl.textContent = "送出時發生問題，請稍後再試。";
    submitBtn.disabled = false;
  }
});
showStep();
