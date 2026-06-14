# Event Registration App

A full-stack event registration application for **Annual Tech Conference 2025**. It uses Node.js, Express, Supabase Postgres, Nodemailer, and plain HTML/CSS/JavaScript pages.

## Features

- Public registration form at `/` and `/register`
- Required full name, email address, and ticket type fields
- Optional phone number field
- Server-side and client-side validation
- Input sanitization with `express-validator`
- Unique `registrationId` values such as `REG-12345`
- Duplicate prevention for the same email address and event
- Confirmation email to the attendee with an `.ics` calendar attachment
- Organizer notification email with attendee details
- Thank you page at `/success`
- Simple admin login at `/admin/login`
- Attendee table at `/admin`
- CSV export at `/admin/download`

## Project Structure

```text
event-registration-app/
  app.js
  package.json
  .env.example
  config/
    database.js
    event.js
  models/
    Registration.js
  routes/
    adminRoutes.js
    registrationRoutes.js
  services/
    emailService.js
  views/
    admin-dashboard.ejs
    admin-login.ejs
    error.ejs
    register.ejs
    success.ejs
  public/
    css/styles.css
    js/hyper-scene.js
    js/register.js
  supabase/
    schema.sql
```

## 1. Clone and Install Dependencies

If you are starting from a fresh clone:

```bash
git clone <your-repository-url>
cd event-registration-app
npm install
```

If this folder already exists on your machine:

```bash
cd event-registration-app
npm install
```

## 2. Set Up Environment Variables

Copy the example file:

```bash
cp .env.example .env
```

Update `.env` with your real values:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
DATABASE_SSL=true

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password

SENDER_EMAIL="Annual Tech Conference <no-reply@example.com>"
ORGANIZER_EMAIL=organizer@example.com

ADMIN_USERNAME=admin
ADMIN_PASSWORD=password
SESSION_SECRET=replace-this-with-a-long-random-secret
```

For local testing, services such as Mailtrap, Ethereal Email, Gmail SMTP, SendGrid SMTP, or your organization's SMTP server can be used. Gmail usually requires an app password.

## 3. Set Up Supabase

1. Open your Supabase project.
2. Click **Connect** in the top bar.
3. Choose **Direct connection** or **Session pooler**.
4. Copy the Postgres connection string.
5. Paste it into `.env` as `DATABASE_URL`.

Example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xtnqixwrafvoqrwbbdpl.supabase.co:5432/postgres
DATABASE_SSL=true
```

The app automatically creates the `registrations` table on startup if it does not exist. You can also create it manually in Supabase SQL Editor by running:

```sql
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
```

The same SQL is available in `supabase/schema.sql`.

## 4. Run the Application

```bash
npm start
```

You can also run:

```bash
node app.js
```

Open the app:

```text
http://localhost:3000
```

Admin dashboard:

```text
http://localhost:3000/admin
```

Default demo credentials are:

```text
Username: admin
Password: password
```

Change `ADMIN_PASSWORD` in `.env` before using this beyond a demo.

## Notes

- The attendee email is sent only after the registration is saved to Supabase.
- The organizer email goes to `ORGANIZER_EMAIL`.
- The event details and ticket types are configured in `config/event.js`.
- The demo admin login is intentionally simple and hardcoded through environment variables. Use a proper authentication system for production.
