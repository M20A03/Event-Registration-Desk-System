(function () {
  const form = document.getElementById("registrationForm");
  const clientError = document.getElementById("clientError");

  if (!form || !clientError) {
    return;
  }

  const studentOriginSelect = form.studentOrigin;
  const registerNoInput = form.registerNo;
  const registerNoLabel = document.getElementById("registerNoLabel");
  const collegeNameInput = form.collegeName;
  const collegeNameLabel = document.getElementById("collegeNameLabel");

  function updateStudentFields() {
    const isChristStudent = studentOriginSelect.value === "Christ University";
    const isOutsideStudent = studentOriginSelect.value === "Other College";

    if (registerNoLabel) registerNoLabel.style.display = isChristStudent ? "" : "none";
    registerNoInput.style.display = isChristStudent ? "" : "none";
    if (isChristStudent) {
      registerNoInput.setAttribute("required", "required");
    } else {
      registerNoInput.removeAttribute("required");
      registerNoInput.value = "";
    }

    if (collegeNameLabel) collegeNameLabel.style.display = isOutsideStudent ? "" : "none";
    collegeNameInput.style.display = isOutsideStudent ? "" : "none";
    if (isOutsideStudent) {
      collegeNameInput.setAttribute("required", "required");
    } else {
      collegeNameInput.removeAttribute("required");
      collegeNameInput.value = "";
    }
  }

  if (studentOriginSelect && registerNoInput && collegeNameInput) {
    studentOriginSelect.addEventListener("change", updateStudentFields);
    updateStudentFields();
  }

  form.addEventListener("submit", function (event) {
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const studentOrigin = form.studentOrigin.value;
    const registerNo = form.registerNo.value.trim();
    const collegeName = form.collegeName.value.trim();
    const ticketType = form.ticketType.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    clientError.textContent = "";

    if (!fullName || !email || !studentOrigin || !ticketType) {
      event.preventDefault();
      clientError.textContent = "Please fill in all required fields.";
      return;
    }

    if (studentOrigin === "Christ University" && !registerNo) {
      event.preventDefault();
      clientError.textContent = "Register No. is required for Christ University students.";
      return;
    }

    if (studentOrigin === "Other College" && !collegeName) {
      event.preventDefault();
      clientError.textContent = "College name is required for outside students.";
      return;
    }

    if (!emailPattern.test(email)) {
      event.preventDefault();
      clientError.textContent = "Please enter a valid email address.";
    }
  });
})();
