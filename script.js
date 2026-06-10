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

const form = document.getElementById("rsvpForm");
const steps = Array.from(document.querySelectorAll(".form-step"));
const successMessage = document.getElementById("successMessage");
const attendanceFields = document.getElementById("attendanceFields");
const skipAttendance = document.getElementById("skipAttendance");
const invitationFields = document.getElementById("invitationFields");
const emailField = document.getElementById("emailField");
const addressField = document.getElementById("addressField");
let currentStep = 0;

function fillSelects() {
  document.querySelectorAll("select").forEach((select) => {
    select.innerHTML = "";
    for (let i = 0; i <= 5; i += 1) {
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = String(i);
      select.appendChild(option);
    }
    if (select.name === "adultCount") select.value = "1";
  });
}

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });
  updateConditionalFields();
}

function validateCurrentStep() {
  const fields = Array.from(steps[currentStep].querySelectorAll("input, textarea, select"));
  const visibleFields = fields.filter((field) => !field.closest(".conditional-field") || field.closest(".conditional-field").classList.contains("is-visible"));
  return visibleFields.every((field) => field.reportValidity());
}

function updateConditionalFields() {
  const attending = form.elements.attending?.value || "";
  const invitation = form.elements.invitation?.value || "";
  const isAttending = attending.includes("一定到");

  attendanceFields.classList.toggle("is-hidden", !isAttending);
  skipAttendance.classList.toggle("is-visible", !isAttending && Boolean(attending));
  invitationFields.classList.toggle("is-hidden", !isAttending);

  const invitationRadios = Array.from(form.querySelectorAll('input[name="invitation"]'));
  invitationRadios.forEach((radio) => {
    radio.required = isAttending;
  });

  const showEmail = isAttending && invitation.includes("電子喜帖");
  const showAddress = isAttending && invitation.includes("紙本喜帖");
  emailField.classList.toggle("is-visible", showEmail);
  addressField.classList.toggle("is-visible", showAddress);
  form.elements.email.required = showEmail;
  form.elements.address.required = showAddress;
}

form.addEventListener("click", (event) => {
  if (event.target.matches("[data-next]")) {
    if (!validateCurrentStep()) return;
    showStep(currentStep + 1);
  }
  if (event.target.matches("[data-prev]")) {
    showStep(currentStep - 1);
  }
});

form.addEventListener("change", updateConditionalFields);

function appendIfValue(data, key, value) {
  if (value !== undefined && value !== null && value !== "") {
    data.append(key, value);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;

  const submitButton = form.querySelector(".submit-btn");
  submitButton.disabled = true;
  submitButton.textContent = "送出中...";

  const isAttending = form.elements.attending.value.includes("一定到");
  const message = form.elements.message.value || "";
  const data = new FormData();

  data.append("entry.2047345391", form.elements.guestName.value);
  data.append("entry.1339287923", form.elements.relationship.value);
  data.append("entry.1336036681", form.elements.attending.value);

  if (isAttending) {
    data.append("entry.630238932", form.elements.adultCount.value || "0");
    data.append("entry.31850087", form.elements.childCount.value || "0");
    data.append("entry.1588449523", form.elements.kidChairCount.value || "0");
    data.append("entry.1535829381", form.elements.vegetarianCount.value || "0");
    data.append("entry.2080928339", form.elements.invitation.value);
    appendIfValue(data, "entry.1521896031", form.elements.email.value);
    appendIfValue(data, "entry.1299100011", form.elements.address.value);
  }

  if (!isAttending) {
    appendIfValue(data, "entry.1716942766", message);
  } else if (form.elements.invitation.value.includes("紙本喜帖")) {
    appendIfValue(data, "entry.1736010593", message);
  } else {
    appendIfValue(data, "entry.1460457126", message);
  }

  try {
    await fetch("https://docs.google.com/forms/d/e/1FAIpQLSfyIvVsf3bES8Ry7PI2CIQUpeXWdNLXV1HU5PCOViYAp2VNGA/formResponse", {
      method: "POST",
      mode: "no-cors",
      body: data,
    });

    steps.forEach((step) => step.classList.remove("is-active"));
    successMessage.hidden = false;
    form.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch (error) {
    alert("送出時發生問題，請稍後再試一次。");
    submitButton.disabled = false;
    submitButton.textContent = "送出回覆";
  }
});

fillSelects();
showStep(0);
