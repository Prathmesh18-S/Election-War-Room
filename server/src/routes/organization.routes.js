const express = require("express");

const {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  toggleOrganizationStatus,
  createPartyAdmin,
} = require("../controllers/organization.controller");
const {
  protect,
  authorize,
} = require("../middlewares/auth.middleware");

const router = express.Router();



router.post(
  "/",
  protect,
  authorize("SUPER_ADMIN"),
  createOrganization
);

router.get(
  "/",
  protect,
  authorize("SUPER_ADMIN"),
  getAllOrganizations
);

router.get(
  "/:id",
  protect,
  authorize("SUPER_ADMIN"),
  getOrganizationById
);

router.put(
  "/:id",
  protect,
  authorize("SUPER_ADMIN"),
  updateOrganization
);

router.patch(
  "/:id/toggle-status",
  protect,
  authorize("SUPER_ADMIN"),
  toggleOrganizationStatus
);

router.post(
  "/:organizationId/party-admin",
  protect,
  authorize("SUPER_ADMIN"),
  createPartyAdmin
);

module.exports = router;