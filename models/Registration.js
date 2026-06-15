const db = require("../config/database");
const { EVENT, TICKET_TYPES } = require("../config/event");

let initializationPromise = null;

function mapRegistration(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    studentId: row.student_id || "",
    studentOrigin: row.student_origin || "",
    registerNo: row.register_no || "",
    collegeName: row.college_name || "",
    phone: row.phone || "",
    ticketType: row.ticket_type,
    registrationId: row.registration_id,
    eventName: row.event_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function initialize() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL,
      student_id VARCHAR(50),
      student_origin VARCHAR(40),
      register_no VARCHAR(50),
      college_name VARCHAR(160),
      phone VARCHAR(30) DEFAULT '',
      ticket_type VARCHAR(40) NOT NULL CHECK (ticket_type IN ('General Admission', 'VIP', 'Student')),
      registration_id VARCHAR(80) NOT NULL UNIQUE,
      event_name TEXT NOT NULL DEFAULT '${EVENT.name.replace(/'/g, "''")}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT registrations_email_event_unique UNIQUE (email, event_name),
      CONSTRAINT registrations_student_id_event_unique UNIQUE (student_id, event_name),
      CONSTRAINT registrations_register_no_event_unique UNIQUE (register_no, event_name)
    );
  `);

  try {
    await db.query(`
      ALTER TABLE registrations ALTER COLUMN student_id DROP NOT NULL;
    `);
  } catch (error) {
    console.log("Migration warning (drop not null):", error.message);
  }

  try {
    await db.query(`
      ALTER TABLE registrations ALTER COLUMN student_id DROP DEFAULT;
    `);
  } catch (error) {
    console.log("Migration warning (drop default):", error.message);
  }

  try {
    await db.query(`
      UPDATE registrations SET student_id = NULL WHERE student_id = '';
    `);
  } catch (error) {
    console.log("Migration warning (set empty student_id to null):", error.message);
  }

  try {
    await db.query(`
      ALTER TABLE registrations ADD CONSTRAINT registrations_student_id_event_unique UNIQUE (student_id, event_name);
    `);
  } catch (error) {
    console.log("Migration warning (student_id constraint):", error.message);
  }

  const columnMigrations = [
    "ALTER TABLE registrations ADD COLUMN IF NOT EXISTS student_origin VARCHAR(40);",
    "ALTER TABLE registrations ADD COLUMN IF NOT EXISTS register_no VARCHAR(50);",
    "ALTER TABLE registrations ADD COLUMN IF NOT EXISTS college_name VARCHAR(160);"
  ];

  for (const migration of columnMigrations) {
    try {
      await db.query(migration);
    } catch (error) {
      console.log("Migration warning (student origin columns):", error.message);
    }
  }

  try {
    await db.query(`
      UPDATE registrations SET register_no = student_id WHERE register_no IS NULL AND student_id IS NOT NULL;
    `);
  } catch (error) {
    console.log("Migration warning (copy student_id to register_no):", error.message);
  }

  try {
    await db.query(`
      ALTER TABLE registrations ADD CONSTRAINT registrations_register_no_event_unique UNIQUE (register_no, event_name);
    `);
  } catch (error) {
    console.log("Migration warning (register_no constraint):", error.message);
  }
}

function ensureInitialized() {
  if (!initializationPromise) {
    initializationPromise = initialize();
  }

  return initializationPromise;
}

async function existsRegistrationId(registrationId) {
  await ensureInitialized();

  const result = await db.query(
    "SELECT 1 FROM registrations WHERE registration_id = $1 LIMIT 1",
    [registrationId]
  );

  return result.rowCount > 0;
}

async function findByEmailAndEvent(email, eventName = EVENT.name) {
  await ensureInitialized();

  const result = await db.query(
    "SELECT * FROM registrations WHERE email = $1 AND event_name = $2 LIMIT 1",
    [email, eventName]
  );

  return mapRegistration(result.rows[0]);
}

async function findByStudentIdAndEvent(studentId, eventName = EVENT.name) {
  if (!studentId) {
    return null;
  }
  await ensureInitialized();

  const result = await db.query(
    "SELECT * FROM registrations WHERE student_id = $1 AND event_name = $2 LIMIT 1",
    [studentId, eventName]
  );

  return mapRegistration(result.rows[0]);
}

async function findByRegisterNoAndEvent(registerNo, eventName = EVENT.name) {
  if (!registerNo) {
    return null;
  }
  await ensureInitialized();

  const result = await db.query(
    "SELECT * FROM registrations WHERE register_no = $1 AND event_name = $2 LIMIT 1",
    [registerNo, eventName]
  );

  return mapRegistration(result.rows[0]);
}

async function findByRegistrationId(registrationId) {
  await ensureInitialized();

  const result = await db.query(
    "SELECT * FROM registrations WHERE registration_id = $1 LIMIT 1",
    [registrationId]
  );

  return mapRegistration(result.rows[0]);
}

async function create(data) {
  if (!TICKET_TYPES.includes(data.ticketType)) {
    throw new Error("Invalid ticket type.");
  }

  await ensureInitialized();

  const result = await db.query(
    `INSERT INTO registrations
      (full_name, email, student_id, student_origin, register_no, college_name, phone, ticket_type, registration_id, event_name)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      data.fullName,
      data.email,
      data.registerNo || data.studentId || null,
      data.studentOrigin,
      data.registerNo || null,
      data.collegeName || null,
      data.phone || "",
      data.ticketType,
      data.registrationId,
      data.eventName || EVENT.name
    ]
  );

  return mapRegistration(result.rows[0]);
}

async function findAllByEvent(eventName = EVENT.name) {
  await ensureInitialized();

  const result = await db.query(
    "SELECT * FROM registrations WHERE event_name = $1 ORDER BY created_at DESC",
    [eventName]
  );

  return result.rows.map(mapRegistration);
}

module.exports = {
  initialize,
  ensureInitialized,
  existsRegistrationId,
  findByEmailAndEvent,
  findByStudentIdAndEvent,
  findByRegisterNoAndEvent,
  findByRegistrationId,
  create,
  findAllByEvent
};
