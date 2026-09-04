require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const connectDB = require("./src/config/db");

const app = express();

const authRoutes = require("./src/routes/auth.routes");

const boothRoutes = require(
  "./src/routes/booth.routes"
);

const organizationRoutes = require(
  "./src/routes/organization.routes"
);

const userRoutes = require(
  "./src/routes/user.routes"
);

const electionRoutes = require(
  "./src/routes/election.routes"
);

const turnoutRoutes = require(
  "./src/routes/turnout.routes"
);

const issueRoutes = require(
  "./src/routes/issue.routes"
);

const coordinatorActivityRoutes =
  require(
    "./src/routes/coordinatorActivity.routes"
  );

const superAdminRoutes = require("./src/routes/superAdmin.routes");
const sectorRoutes = require("./src/routes/sector.routes");
const coordinatorRoutes = require("./src/routes/coordinator.routes");

const {
  protect,
  authorize,
} = require("./src/middlewares/auth.middleware");

const dashboardRoutes = require(
  "./src/routes/dashboard.routes"
);

const aiRoutes = require(
  "./src/routes/ai.routes"
);

const analyticsRoutes = require(
  "./src/routes/analytics.routes"
);

connectDB();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);

app.use(
  "/api/organizations",
  organizationRoutes
);

app.use("/api/users", userRoutes);

app.use(
  "/api/elections",
  electionRoutes
);

app.use("/api/booths", boothRoutes);

app.use(
  "/api/turnout",
  turnoutRoutes
);

app.use(
  "/api/issues",
  issueRoutes
);

app.use(
  "/api/coordinator-activities",
  coordinatorActivityRoutes
);

app.use(
  "/api/dashboard",
  dashboardRoutes
);

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/analytics",
  analyticsRoutes
);

app.use("/api/super-admin", superAdminRoutes);
app.use("/api/sector", sectorRoutes);
app.use("/api/coordinator", coordinatorRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Election War Room API Running"
  });
});

app.get("/api/protected", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Protected route accessed",
    user: req.user,
  });
});

app.get(
  "/api/admin",
  protect,
  authorize("SUPER_ADMIN"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome Super Admin",
    });
  }
);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});