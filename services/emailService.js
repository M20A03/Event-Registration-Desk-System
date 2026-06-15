const nodemailer = require("nodemailer");
const { EVENT } = require("../config/event");

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeICalText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function createCalendarInvite(registration) {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const uid = `${registration.registrationId}@annual-tech-conference-2025`;
  const selectedEvents = registration.participatingEvents && registration.participatingEvents.length
    ? registration.participatingEvents.join(", ")
    : "Not selected";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Annual Tech Conference//Registration//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${EVENT.startDate}`,
    `DTEND:${EVENT.endDate}`,
    `SUMMARY:${escapeICalText(EVENT.name)}`,
    `DESCRIPTION:${escapeICalText(`${EVENT.description}. Registration ID: ${registration.registrationId}. Register No.: ${registration.registerNo || 'Not applicable'}. College: ${registration.collegeName || registration.studentOrigin || 'Not provided'}. Ticket: ${registration.ticketType}. Events: ${selectedEvents}.`)}`,
    `LOCATION:${escapeICalText(EVENT.location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
}

async function sendConfirmationEmails(registration) {
  const transporter = createTransporter();
  const from = process.env.SENDER_EMAIL;
  const organizerEmail = process.env.ORGANIZER_EMAIL;
  const calendarInvite = createCalendarInvite(registration);
  const selectedEvents = registration.participatingEvents && registration.participatingEvents.length
    ? registration.participatingEvents.join(", ")
    : "Not selected";

  const attendeeHtml = `
    <p>Hi ${registration.fullName},</p>
    <p>Thank you for registering for <strong>${EVENT.name}</strong>.</p>
    <p>Your unique registration ID is <strong>${registration.registrationId}</strong>.</p>
    <p>University / College: <strong>${registration.studentOrigin || "Not provided"}</strong></p>
    <p>Register No.: <strong>${registration.registerNo || "Not applicable"}</strong></p>
    <p>College Name: <strong>${registration.collegeName || "Not applicable"}</strong></p>
    <p>Events Participating In: <strong>${selectedEvents}</strong></p>
    <p>Your selected ticket type is <strong>${registration.ticketType}</strong>.</p>
    
    <div style="margin: 20px 0; padding: 15px; border: 1px solid #176b63; border-radius: 6px; background-color: #f6faf9; max-width: 500px;">
      <h3 style="margin-top: 0; color: #176b63; font-family: sans-serif;">Venue WiFi Credentials</h3>
      <p style="margin: 5px 0; font-family: sans-serif;"><strong>Network Name (SSID):</strong> ${EVENT.wifiSsid}</p>
      <p style="margin: 5px 0; font-family: sans-serif;"><strong>Password:</strong> ${EVENT.wifiPassword}</p>
    </div>

    <p>We have attached a calendar file so you can add the event to your calendar.</p>
  `;

  const organizerHtml = `
    <p>A new attendee registered for <strong>${EVENT.name}</strong>.</p>
    <ul>
      <li>Name: ${registration.fullName}</li>
      <li>Email: ${registration.email}</li>
      <li>University / College: ${registration.studentOrigin || "Not provided"}</li>
      <li>Register No.: ${registration.registerNo || "Not applicable"}</li>
      <li>College Name: ${registration.collegeName || "Not applicable"}</li>
      <li>Events Participating In: ${selectedEvents}</li>
      <li>Phone: ${registration.phone || "Not provided"}</li>
      <li>Ticket Type: ${registration.ticketType}</li>
      <li>Registration ID: ${registration.registrationId}</li>
    </ul>
  `;

  await transporter.sendMail({
    from,
    to: registration.email,
    subject: `Registration confirmed: ${EVENT.name}`,
    html: attendeeHtml,
    text: `Hi ${registration.fullName}, thank you for registering for ${EVENT.name}. Registration ID: ${registration.registrationId}. University / College: ${registration.studentOrigin || "Not provided"}. Register No.: ${registration.registerNo || "Not applicable"}. College Name: ${registration.collegeName || "Not applicable"}. Events: ${selectedEvents}. Ticket: ${registration.ticketType}. WiFi Details - SSID: ${EVENT.wifiSsid}, Password: ${EVENT.wifiPassword}.`,
    attachments: [
      {
        filename: "annual-tech-conference-2025.ics",
        content: calendarInvite,
        contentType: "text/calendar; charset=utf-8; method=PUBLISH"
      }
    ]
  });

  await transporter.sendMail({
    from,
    to: organizerEmail,
    subject: `New registration: ${registration.fullName}`,
    html: organizerHtml,
    text: `New registration for ${EVENT.name}: ${registration.fullName}, ${registration.email}, ${registration.studentOrigin || "Not provided"}, Register No.: ${registration.registerNo || "Not applicable"}, College Name: ${registration.collegeName || "Not applicable"}, Events: ${selectedEvents}, ${registration.phone || "No phone"}, ${registration.ticketType}, ${registration.registrationId}.`
  });
}

module.exports = {
  sendConfirmationEmails
};
