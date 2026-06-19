import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { AuthProvider } from "./lib/AuthProvider";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useAuth, homePathForRole } from "./lib/auth";
import { setNavigate } from "./lib/navigate";
import { Toaster } from "./components/Toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { AuthLayout } from "./layouts/AuthLayout";
import { PatientLayout } from "./layouts/PatientLayout";

import { LoginPage } from "./pages/auth/LoginPage";
import { PatientHome } from "./pages/patient/PatientHome";
import { PatientUpload } from "./pages/patient/PatientUpload";
import { PatientSymptoms } from "./pages/patient/PatientSymptoms";
import { PatientSchedule } from "./pages/patient/PatientSchedule";
import { PatientConsent } from "./pages/patient/PatientConsent";
import { NotFound } from "./pages/NotFound";

// Lazy-loaded as its own chunk: ClinicQueue renders raw_score/confidence,
// which must never ship in the bundle a patient session downloads.
const ClinicLayout = lazy(() =>
  import("./layouts/ClinicLayout").then((m) => ({ default: m.ClinicLayout })),
);
const ClinicQueue = lazy(() =>
  import("./pages/clinic/ClinicQueue").then((m) => ({ default: m.ClinicQueue })),
);

function RootRedirect() {
  const { session } = useAuth();
  return <Navigate to={session ? homePathForRole(session.role) : "/auth"} replace />;
}

function NavigateBridge() {
  // lib/api.ts runs outside the React tree but needs to redirect on 401 —
  // hand it this route's navigate() once, here.
  const navigate = useNavigate();
  useEffect(() => setNavigate(navigate), [navigate]);
  return null;
}

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NavigateBridge />
        <Toaster />
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<AuthLayout />}>
            <Route path="/auth" element={<LoginPage />} />
          </Route>

          <Route
            path="/patient"
            element={
              <ProtectedRoute allow={["patient"]}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientHome />} />
            <Route path="upload" element={<PatientUpload />} />
            <Route path="symptoms" element={<PatientSymptoms />} />
            <Route path="schedule" element={<PatientSchedule />} />
            <Route path="consent" element={<PatientConsent />} />
          </Route>

          <Route
            path="/clinic"
            element={
              <ProtectedRoute allow={["clinician", "admin"]}>
                <Suspense fallback={null}>
                  <ClinicLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route
              index
              element={
                <Suspense fallback={null}>
                  <ClinicQueue />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
