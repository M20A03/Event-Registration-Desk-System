(function () {
  const form = document.getElementById("registrationForm");
  const clientError = document.getElementById("clientError");

  if (!form || !clientError) {
    return;
  }

  form.addEventListener("submit", function (event) {
    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const studentId = form.studentId.value.trim();
    const ticketType = form.ticketType.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    clientError.textContent = "";

    if (!fullName || !email || !studentId || !ticketType) {
      event.preventDefault();
      clientError.textContent = "Please fill in your name, email address, student ID, and ticket type.";
      return;
    }

    if (!emailPattern.test(email)) {
      event.preventDefault();
      clientError.textContent = "Please enter a valid email address.";
    }
  });
})();
