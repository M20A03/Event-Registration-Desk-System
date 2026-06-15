const dotenvResult = require("dotenv").config();
if (dotenvResult.error) {
  console.error("DEBUG: dotenv failed to load:", dotenvResult.error.message);
} else {
  console.log("DEBUG: dotenv loaded successfully. Database URL exists:", !!process.env.DATABASE_URL);
}

const express = require("express");
const path = require("path");
const session = require("express-session");

const db = require("./config/database");
const Registration = require("./models/Registration");
const registrationRoutes = require("./routes/registrationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "development-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60
    }
  })
);

app.use("/", registrationRoutes);
app.use("/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).render("error", {
    title: "Page not found",
    message: "The page you are looking for does not exist."
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  if (db.isDatabaseConnectionError(err)) {
    return res.status(503).render("error", {
      title: "Registration temporarily unavailable",
      message: "The database connection is not configured correctly. Please check the Supabase DATABASE_URL and password, then try again."
    });
  }

  res.status(500).render("error", {
    title: "Something went wrong",
    message: "Please try again in a moment."
  });
});

// Safe database initialization
Registration.ensureInitialized()
  .then(() => {
    console.log("Connected and migrated Supabase Postgres");
  })
  .catch((error) => {
    if (db.isDatabaseConnectionError(error)) {
      console.error("Failed to initialize database. Check DATABASE_URL, Supabase password, and DATABASE_SSL:", error.message);
      return;
    }

    console.error("Failed to initialize database:", error.message);
  });

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Event registration app running at http://localhost:${PORT}`);
  });
}

module.exports = app;
