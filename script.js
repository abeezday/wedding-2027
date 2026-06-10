const weddingDate = new Date("2027-03-07T12:00:00+08:00");

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    document.getElementById("days").textContent = "00";
    document.getElementById("hours").textContent = "00";
    document.getElementById("minutes").textContent = "00";
    document.getElementById("seconds").textContent = "00";
    return;
  }

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = pad(hours);
  document.getElementById("minutes").textContent = pad(minutes);
  document.getElementById("seconds").textContent = pad(secs);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const FORM_ACTION = "https://docs.google.com/forms/d/e/1FAIpQLSfyIvVsf3bES8Ry7PI2CIQUpeXWdNLXV1HU5PCOViYAp2VNGA/formResponse";
const ENTRY = {
  name: "entry.2047345391",
  relationship: "entry.1339287923",
  attendance: "entry.1336036681",
  adult: "entry.630238932",
  child: "entry.31850087",
  chair: "entry.1588449523",
  vegetarian: "entry.1535829381",
  invitation: "entry.2080928339",
  email: "entry.1521896031",
  messageGeneral: "entry.1716942766",
  address: "entry.1299100011",
  messagePrinted: "entry.1736010593",
  messageDigital: "entry.1460457126"
};

const INVITATION_NONE = "不用，我已經記起來婚禮資訊了 No, I already remembered the wedding information";
const ATTEND_YES = "當然，一定到! Yes, I will be there 😀";

const form = document.getElementById("rsvpForm");
const formError = document.getElementById("formError");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const stepLabel = document.getElementById("stepLabel");
const progressBar = document.getElementById("progressBar");
const successMessage = document.getElementById("successMessage");
const emailField = document.getElementById("emailField");
const addressField = document.getElementById("addressField");
const attendingFields = document.getElementById("attendingFields");
const step3Title = document.getElementById("step3Title");
let currentStep = 1;

function fillNumberSelects() {
  ["adultCount", "childCount", "chairCount", "vegetarianCount"].forEach((name) => {
    const select = form.elements[name];
    if (!select) return;
    select.innerHTML = "";
    for (let i = 0; i <= 5; i += 1) {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = String(i);
      select.appendChild(option);
    }
  });
  form.elements.adultCount.value = "1";
  form.elements.childCount.value = "0";
  form.elements.chairCount.value = "0";
  form.elements.vegetarianCount.value = "0";
}

function getRadioValue(name) {
  const selected = form.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function setStep(step) {
  currentStep = step;
  document.querySelectorAll(".form-step").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === currentStep);
  });
  stepLabel.textContent = `Step ${currentStep} of 3`;
  progressBar.style.width = `${(currentStep / 3) * 100}%`;
  prevBtn.style.visibility = currentStep === 1 ? "hidden" : "visible";
  nextBtn.style.display = currentStep === 3 ? "none" : "inline-block";
  submitBtn.style.display = currentStep === 3 ? "inline-block" : "none";
  formError.textContent = "";
  updateConditionalFields();
}

function isAttending() {
  return getRadioValue("attendance") === ATTEND_YES;
}

function updateConditionalFields() {
  const attending = isAttending();
  if (attendingFields) attendingFields.style.display = attending ? "block" : "none";
  if (step3Title) step3Title.textContent = attending ? "出席資訊" : "留下祝福";

  const invitation = getRadioValue("invitation");
  emailField.classList.toggle("show", attending && invitation.includes("digital"));
  addressField.classList.toggle("show", attending && invitation.includes("wedding invitation card"));
}

function validateStep() {
  formError.textContent = "";

  if (currentStep === 1) {
    if (!form.elements.guestName.value.trim()) {
      formError.textContent = "請填寫您的姓名。";
      return false;
    }
    if (!getRadioValue("relationship")) {
      formError.textContent = "請選擇與新人的關係。";
      return false;
    }
  }

  if (currentStep === 2 && !getRadioValue("attendance")) {
    formError.textContent = "請選擇是否出席。";
    return false;
  }

  if (currentStep === 3 && isAttending()) {
    if (!getRadioValue("invitation")) {
      formError.textContent = "請選擇是否需要喜帖。";
      return false;
    }
    const invitation = getRadioValue("invitation");
    if (invitation.includes("digital") && !form.elements.email.value.trim()) {
      formError.textContent = "請填寫電子喜帖寄送 Email。";
      return false;
    }
    if (invitation.includes("wedding invitation card") && !form.elements.address.value.trim()) {
      formError.textContent = "請填寫紙本喜帖寄送地址。";
      return false;
    }
  }

  return true;
}

function postToGoogleForm(data) {
  const googleForm = document.createElement("form");
  googleForm.action = FORM_ACTION;
  googleForm.method = "POST";
  googleForm.target = "hiddenGoogleForm";
  googleForm.style.display = "none";

  Object.entries(data).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value == null ? "" : String(value);
    googleForm.appendChild(input);
  });

  document.body.appendChild(googleForm);
  googleForm.submit();
  setTimeout(() => googleForm.remove(), 1000);
}

function buildPayload() {
  const attending = isAttending();
  const message = form.elements.message.value.trim();
  const invitation = attending ? getRadioValue("invitation") : INVITATION_NONE;

  const payload = {
    [ENTRY.name]: form.elements.guestName.value.trim(),
    [ENTRY.relationship]: getRadioValue("relationship"),
    [ENTRY.attendance]: getRadioValue("attendance"),
    [ENTRY.adult]: attending ? form.elements.adultCount.value : "0",
    [ENTRY.child]: attending ? form.elements.childCount.value : "0",
    [ENTRY.chair]: attending ? form.elements.chairCount.value : "0",
    [ENTRY.vegetarian]: attending ? form.elements.vegetarianCount.value : "0",
    [ENTRY.invitation]: invitation,
    [ENTRY.email]: attending ? form.elements.email.value.trim() : "",
    [ENTRY.address]: attending ? form.elements.address.value.trim() : "",
    [ENTRY.messageGeneral]: message,
    [ENTRY.messagePrinted]: message,
    [ENTRY.messageDigital]: message
  };
if (!attending) {
  payload.pageHistory = "0,4";
} else if (invitation.includes("digital")) {
  payload.pageHistory = "0,1,2";
} else if (invitation.includes("wedding invitation card")) {
  payload.pageHistory = "0,1,3";
} else {
  payload.pageHistory = "0,1";
}
  return payload;
}

fillNumberSelects();
setStep(1);

form.addEventListener("change", updateConditionalFields);

nextBtn.addEventListener("click", () => {
  if (!validateStep()) return;
  setStep(Math.min(currentStep + 1, 3));
});

prevBtn.addEventListener("click", () => {
  setStep(Math.max(currentStep - 1, 1));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!validateStep()) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "送出中...";

  postToGoogleForm(buildPayload());

  setTimeout(() => {
    form.style.display = "none";
    document.querySelector(".step-meta").style.display = "none";
    successMessage.style.display = "block";
  }, 700);
});
