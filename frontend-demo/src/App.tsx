import { type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { SessionProvider, useSession } from "./lib/session";
import type { Role } from "./lib/types";
import { GradientBackdrop } from "./components/GradientBackdrop";
import { Toaster } from "./components/Toaster";

import { Landing } from "./screens/Landing";
import { Login } from "./screens/Login";
import { PatientLayout } from "./screens/patient/PatientLayout";
import { PatientHome } from "./screens/patient/PatientHome";
import { PatientSymptoms } from "./screens/patient/PatientSymptoms";
import { PatientUpload } from "./screens/patient/PatientUpload";
import { PatientAppointments } from "./screens/patient/PatientAppointments";
import { ClinicLayout } from "./screens/clinic/ClinicLayout";
import { ClinicQueue } from "./screens/clinic/ClinicQueue";
import { ClinicPatient } from "./screens/clinic/ClinicPatient";

function Require({ role, children }: { role: Role; children: ReactNode }) {
  const { role: current } = useSession();
  if (current === null) return <Navigate to="/login" replace />;
  if (current !== role) return <Navigate to={current === "patient" ? "/patient" : "/clinic"} replace />;
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split("/").slice(0, 2).join("/")}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/patient"
          element={
            <Require role="patient">
              <PatientLayout />
            </Require>
          }
        >
          <Route index element={<PatientHome />} />
          <Route path="symptoms" element={<PatientSymptoms />} />
          <Route path="upload" element={<PatientUpload />} />
          <Route path="appointments" element={<PatientAppointments />} />
        </Route>

        <Route
          path="/clinic"
          element={
            <Require role="clinician">
              <ClinicLayout />
            </Require>
          }
        >
          <Route index element={<ClinicQueue />} />
          <Route path="patients/:id" element={<ClinicPatient />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <SessionProvider>
      <GradientBackdrop />
      <Toaster />
      <AnimatedRoutes />
    </SessionProvider>
  );
}
