(function () {
  const form = document.getElementById("registrationForm");
  const clientError = document.getElementById("clientError");

  if (!form || !clientError) {
    return;
  }

  const ticketTypeSelect = form.ticketType;
  const studentIdInput = form.studentId;
  const studentIdLabel = document.getElementById("studentIdLabel");
  const studentIdRequired = document.getElementById("studentIdRequired");

  function updateStudentIdVisibility() {
    if (ticketTypeSelect.value === "Student") {
      if (studentIdLabel) studentIdLabel.style.display = "";
      if (studentIdRequired) studentIdRequired.style.display = "inline";
      studentIdInput.style.display = "";
      studentIdInput.setAttribute("required", "required");
    } else {
      if (studentIdLabel) studentIdLabel.style.display = "none";
      if (studentIdRequired) studentIdRequired.style.display = "none";
      studentIdInput.style.display = "none";
      studentIdInput.removeAttribute("required");
      studentIdInput.value = "";
    }
  }

  if (ticketTypeSelect && studentIdInput) {
    ticketTypeSelect.addEventListener("change", updateStudentIdVisibility);
    updateStudentIdVisibility();
  }

  form.addEventListener("submit", function (event) {
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const studentId = form.studentId.value.trim();
    const ticketType = form.ticketType.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    clientError.textContent = "";

    if (!fullName || !email || !ticketType) {
      event.preventDefault();
      clientError.textContent = "Please fill in all required fields.";
      return;
    }

    if (ticketType === "Student" && !studentId) {
      event.preventDefault();
      clientError.textContent = "Student ID is required for Student tickets.";
      return;
    }

    if (!emailPattern.test(email)) {
      event.preventDefault();
      clientError.textContent = "Please enter a valid email address.";
    }
  });
})();
