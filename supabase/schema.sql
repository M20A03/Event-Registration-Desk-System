CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  ticket_type VARCHAR(40) NOT NULL CHECK (ticket_type IN ('General Admission', 'VIP', 'Student')),
  registration_id VARCHAR(80) NOT NULL UNIQUE,
  event_name TEXT NOT NULL DEFAULT 'Annual Tech Conference 2025',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT registrations_email_event_unique UNIQUE (email, event_name)
);
