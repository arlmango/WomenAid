import { useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { setNavigate } from "./lib/navigate";
import { GradientBackdrop } from "./components/GradientBackdrop";
import { Toaster } from "./components/Toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";

import { Landing } from "./screens/Landing";
import { Login } from "./screens/Login";
import { RegisterFlow } from "./screens/register/RegisterFlow";
import { PatientLayout } from "./screens/patient/PatientLayout";
import { PatientHome } from "./screens/patient/PatientHome";
import { PatientSymptoms } from "./screens/patient/PatientSymptoms";
import { NotFound } from "./screens/NotFound";

function NavigateBridge() {
  // lib/api.ts runs outside the React tree but needs to redirect on 401.
  const navigate = useNavigate();
  useEffect(() => setNavigate(navigate), [navigate]);
  return null;
}

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname.split("/").slice(0, 2).join("/")}>
        <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage><RegisterFlow /></AnimatedPage>} />

        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientHome />} />
          <Route path="symptoms" element={<PatientSymptoms />} />
        </Route>

        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

export function App() {
  return (
    <>
      <NavigateBridge />
      <GradientBackdrop />
      <Toaster />
      <AnimatedRoutes />
    </>
  );
}
