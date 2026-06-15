const express = require("express");
const { body, validationResult } = require("express-validator");

const Registration = require("../models/Registration");
const { EVENT } = require("../config/event");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  return res.redirect("/admin/login");
}

function csvValue(value) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

router.get("/", requireAdmin, async (req, res, next) => {
  try {
    const registrations = await Registration.findAllByEvent(EVENT.name);

    return res.render("admin-dashboard", {
      title: "Admin Dashboard",
      eventName: EVENT.name,
      registrations
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/login", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect("/admin");
  }

  return res.render("admin-login", {
    title: "Admin Login",
    error: ""
  });
});

router.post(
  "/login",
  [
    body("username").trim().escape(),
    body("password").trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "password";

    if (!errors.isEmpty() || req.body.username !== adminUsername || req.body.password !== adminPassword) {
      return res.status(401).render("admin-login", {
        title: "Admin Login",
        error: "Invalid username or password."
      });
    }

    req.session.isAdmin = true;
    return res.redirect("/admin");
  }
);

router.post("/logout", requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    return res.redirect("/admin/login");
  });
});

router.get("/download", requireAdmin, async (req, res, next) => {
  try {
    const registrations = await Registration.findAllByEvent(EVENT.name);
    const header = [
      "Registration ID",
      "Full Name",
      "University / College",
      "Register No.",
      "College Name",
      "Email",
      "Phone",
      "Ticket Type",
      "Event Name",
      "Registered At"
    ];
    const rows = registrations.map((registration) => [
      registration.registrationId,
      registration.fullName,
      registration.studentOrigin || "",
      registration.registerNo || "",
      registration.collegeName || "",
      registration.email,
      registration.phone,
      registration.ticketType,
      registration.eventName,
      registration.createdAt ? registration.createdAt.toISOString() : ""
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(csvValue).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=attendees.csv");
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
