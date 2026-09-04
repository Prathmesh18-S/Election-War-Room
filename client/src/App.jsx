import {
  Routes,
  Route,
} from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";

import ProtectedRoute from "./routes/ProtectedRoute";
import UsersPage from "./pages/users/UsersPage";
import ElectionsPage from "./pages/elections/ElectionsPage";
import BoothsPage from "./pages/booths/BoothsPage";

import TurnoutPage from "./pages/turnout/TurnoutPage";

import IssuesPage from "./pages/issues/IssuesPage";
import ActivitiesPage from "./pages/activities/ActivitiesPage";
import CoordinatorDashboardPage from "./pages/coordinator/CoordinatorDashboardPage";
import SuperAdminDashboard from "./pages/superAdmin/SuperAdminDashboard";
import SectorDashboard from "./pages/sectorOfficer/SectorDashboard";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
  allowedRoles={[
    "PARTY_ADMIN",
  ]}
>
  <DashboardPage />
</ProtectedRoute>
        }
      />

      <Route
        path="/super-admin-dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "SUPER_ADMIN",
            ]}
          >
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sector-dashboard"
        element={
          <ProtectedRoute
            allowedRoles={[
              "SECTOR_OFFICER",
            ]}
          >
            <SectorDashboard />
          </ProtectedRoute>
        }
      />

      <Route
  path="/users"
  element={
    <ProtectedRoute
  allowedRoles={[
    "PARTY_ADMIN",
  ]}
>
  <UsersPage />
</ProtectedRoute>
  }
/>

<Route
  path="/elections"
  element={
    <ProtectedRoute
  allowedRoles={[
    "PARTY_ADMIN",
  ]}
>
  <ElectionsPage />
</ProtectedRoute>
  }
/>

<Route
  path="/booths"
  element={
    <ProtectedRoute
  allowedRoles={[
    "PARTY_ADMIN",
  ]}
>
  <BoothsPage />
</ProtectedRoute>
  }
/>

<Route
  path="/turnout"
  element={
    <ProtectedRoute
  allowedRoles={[
    "PARTY_ADMIN",
    "SECTOR_OFFICER",
    "BOOTH_COORDINATOR",
  ]}
>
  <TurnoutPage />
</ProtectedRoute>
  }
/>

<Route
  path="/issues"
  element={
    <ProtectedRoute
      allowedRoles={[
        "PARTY_ADMIN",
        "SECTOR_OFFICER",
        "BOOTH_COORDINATOR",
      ]}
    >
      <IssuesPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/activities"
  element={
    <ProtectedRoute
      allowedRoles={[
        "PARTY_ADMIN",
        "SECTOR_OFFICER",
        "BOOTH_COORDINATOR",
      ]}
    >
      <ActivitiesPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/coordinator-dashboard"
  element={
    <ProtectedRoute
      allowedRoles={[
        "BOOTH_COORDINATOR",
      ]}
    >
      <CoordinatorDashboardPage />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;