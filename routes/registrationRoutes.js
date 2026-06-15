const express = require("express");
const { body, matchedData, validationResult } = require("express-validator");

const Registration = require("../models/Registration");
const { EVENT, TICKET_TYPES } = require("../config/event");
const { sendConfirmationEmails } = require("../services/emailService");

const router = express.Router();

const registrationValidators = [
  body("fullName")
    .trim()
    .notEmpty()
    .withMessage("Full name is required.")
    .isLength({ max: 120 })
    .withMessage("Full name must be 120 characters or fewer.")
    .escape(),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required.")
    .isEmail()
    .withMessage("Enter a valid email address.")
    .normalizeEmail(),
  body("studentOrigin")
    .trim()
    .isIn(["Christ University", "Other College"])
    .withMessage("Select whether the student is from Christ University or another college.")
    .escape(),
  body("registerNo")
    .trim()
    .custom((value, { req }) => {
      if (req.body.studentOrigin === "Christ University" && !value) {
        throw new Error("Register No. is required for Christ University students.");
      }
      return true;
    })
    .isLength({ max: 50 })
    .withMessage("Register No. must be 50 characters or fewer.")
    .escape(),
  body("collegeName")
    .trim()
    .custom((value, { req }) => {
      if (req.body.studentOrigin === "Other College" && !value) {
        throw new Error("College name is required for outside students.");
      }
      return true;
    })
    .isLength({ max: 160 })
    .withMessage("College name must be 160 characters or fewer.")
    .escape(),
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage("Phone number must be 30 characters or fewer.")
    .matches(/^[0-9+\-() .]*$/)
    .withMessage("Phone number contains invalid characters.")
    .escape(),
  body("ticketType")
    .trim()
    .isIn(TICKET_TYPES)
    .withMessage("Select a valid ticket type.")
    .escape()
];

function generateRegistrationId() {
  return `REG-${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 90 + 10)}`;
}

async function createUniqueRegistrationId() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const registrationId = generateRegistrationId();
    const existing = await Registration.existsRegistrationId(registrationId);
    if (!existing) {
      return registrationId;
    }
  }

  return `REG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

router.get(["/", "/register"], (req, res) => {
  res.render("register", {
    title: "Register",
    eventName: EVENT.name,
    ticketTypes: TICKET_TYPES,
    errors: [],
    formData: {}
  });
});

router.post("/register", registrationValidators, async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("register", {
        title: "Register",
        eventName: EVENT.name,
        ticketTypes: TICKET_TYPES,
        errors: errors.array(),
        formData: req.body
      });
    }

    const data = matchedData(req, { locations: ["body"] });
    const duplicateEmail = await Registration.findByEmailAndEvent(data.email, EVENT.name);
    const duplicateRegisterNo = data.registerNo ? await Registration.findByRegisterNoAndEvent(data.registerNo, EVENT.name) : null;
    const duplicate = duplicateEmail || duplicateRegisterNo;

    if (duplicate) {
      return res.redirect(`/success?registrationId=${encodeURIComponent(duplicate.registrationId)}&alreadyRegistered=true`);
    }

    const registration = await Registration.create({
      fullName: data.fullName,
      email: data.email,
      studentOrigin: data.studentOrigin,
      registerNo: data.studentOrigin === "Christ University" ? data.registerNo : null,
      collegeName: data.studentOrigin === "Other College" ? data.collegeName : null,
      phone: data.phone || "",
      ticketType: data.ticketType,
      registrationId: await createUniqueRegistrationId(),
      eventName: EVENT.name
    });

    try {
      await sendConfirmationEmails(registration);
    } catch (emailError) {
      console.error("Failed to send confirmation emails:", emailError);
    }

    return res.redirect(`/success?registrationId=${encodeURIComponent(registration.registrationId)}`);
  } catch (error) {
    if (error.code === "23505") {
      const duplicateEmail = await Registration.findByEmailAndEvent(req.body.email, EVENT.name);
      const duplicateRegisterNo = req.body.registerNo ? await Registration.findByRegisterNoAndEvent(req.body.registerNo, EVENT.name) : null;
      const duplicate = duplicateEmail || duplicateRegisterNo;
      if (duplicate) {
        return res.redirect(`/success?registrationId=${encodeURIComponent(duplicate.registrationId)}&alreadyRegistered=true`);
      }
    }

    return next(error);
  }
});

router.get("/success", async (req, res, next) => {
  try {
    const registrationId = String(req.query.registrationId || "").trim();
    const alreadyRegistered = req.query.alreadyRegistered === "true";
    const registration = await Registration.findByRegistrationId(registrationId);

    if (!registration) {
      return res.status(404).render("error", {
        title: "Registration not found",
        message: "We could not find that registration confirmation."
      });
    }

    return res.render("success", {
      title: "Registration Confirmed",
      eventName: EVENT.name,
      event: EVENT,
      registration,
      alreadyRegistered
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
