const { pool } = require("../config/database");
const { EVENT, TICKET_TYPES } = require("../config/event");

function mapRegistration(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    studentId: row.student_id || "",
    phone: row.phone || "",
    ticketType: row.ticket_type,
    registrationId: row.registration_id,
    eventName: row.event_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function initialize() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL,
      student_id VARCHAR(50) NOT NULL DEFAULT '',
      phone VARCHAR(30) DEFAULT '',
      ticket_type VARCHAR(40) NOT NULL CHECK (ticket_type IN ('General Admission', 'VIP', 'Student')),
      registration_id VARCHAR(80) NOT NULL UNIQUE,
      event_name TEXT NOT NULL DEFAULT '${EVENT.name.replace(/'/g, "''")}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT registrations_email_event_unique UNIQUE (email, event_name),
      CONSTRAINT registrations_student_id_event_unique UNIQUE (student_id, event_name)
    );
  `);

  try {
    await pool.query(`
      ALTER TABLE registrations ADD COLUMN IF NOT EXISTS student_id VARCHAR(50) NOT NULL DEFAULT '';
    `);
  } catch (error) {
    console.log("Migration warning (student_id column):", error.message);
  }

  try {
    await pool.query(`
      ALTER TABLE registrations ADD CONSTRAINT registrations_student_id_event_unique UNIQUE (student_id, event_name);
    `);
  } catch (error) {
    console.log("Migration warning (student_id constraint):", error.message);
  }
}

async function existsRegistrationId(registrationId) {
  const result = await pool.query(
    "SELECT 1 FROM registrations WHERE registration_id = $1 LIMIT 1",
    [registrationId]
  );

  return result.rowCount > 0;
}

async function findByEmailAndEvent(email, eventName = EVENT.name) {
  const result = await pool.query(
    "SELECT * FROM registrations WHERE email = $1 AND event_name = $2 LIMIT 1",
    [email, eventName]
  );

  return mapRegistration(result.rows[0]);
}

async function findByStudentIdAndEvent(studentId, eventName = EVENT.name) {
  const result = await pool.query(
    "SELECT * FROM registrations WHERE student_id = $1 AND event_name = $2 LIMIT 1",
    [studentId, eventName]
  );

  return mapRegistration(result.rows[0]);
}

async function findByRegistrationId(registrationId) {
  const result = await pool.query(
    "SELECT * FROM registrations WHERE registration_id = $1 LIMIT 1",
    [registrationId]
  );

  return mapRegistration(result.rows[0]);
}

async function create(data) {
  if (!TICKET_TYPES.includes(data.ticketType)) {
    throw new Error("Invalid ticket type.");
  }

  const result = await pool.query(
    `INSERT INTO registrations
      (full_name, email, student_id, phone, ticket_type, registration_id, event_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      data.fullName,
      data.email,
      data.studentId || "",
      data.phone || "",
      data.ticketType,
      data.registrationId,
      data.eventName || EVENT.name
    ]
  );

  return mapRegistration(result.rows[0]);
}

async function findAllByEvent(eventName = EVENT.name) {
  const result = await pool.query(
    "SELECT * FROM registrations WHERE event_name = $1 ORDER BY created_at DESC",
    [eventName]
  );

  return result.rows.map(mapRegistration);
}

module.exports = {
  initialize,
  existsRegistrationId,
  findByEmailAndEvent,
  findByStudentIdAndEvent,
  findByRegistrationId,
  create,
  findAllByEvent
};
