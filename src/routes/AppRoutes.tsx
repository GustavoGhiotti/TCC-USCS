import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';

// Páginas públicas
import { Login } from '../pages/Login';
import { ConsentimentoLGPD } from '../pages/ConsentimentoLGPD';

// Páginas gestante — novo design (sidebar escura, idêntico ao médico)
import { GestanteDashboard }    from '../pages/gestante/GestanteDashboard';
import { GestanteRelatos }      from '../pages/gestante/GestanteRelatos';
import { GestanteMedicamentos } from '../pages/gestante/GestanteMedicamentos';
import { GestanteResumosIA }    from '../pages/gestante/GestanteResumosIA';
import { GestantePerfil }       from '../pages/gestante/GestantePerfil';

// Páginas gestante — legado
import { Consultas } from '../pages/Consultas';

// Páginas médico — novo design (rotas canônicas)
import { DoctorDashboard }     from '../pages/doctor/DoctorDashboard';
import { PatientDetails }      from '../pages/doctor/PatientDetails';
import { DoctorAlerts }        from '../pages/doctor/Alerts';
import { DoctorReports }       from '../pages/doctor/Reports';
import { IndicadoresUnidade }  from '../pages/doctor/IndicadoresUnidade';
import { DoctorProfile }       from '../pages/doctor/DoctorProfile';

// Placeholder legado gestante
import { PatientHome } from '../pages/patient/PatientHome';

export function AppRoutes() {
  console.log('AppRoutes: Renderizando rotas…');

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ─── Públicas ──────────────────────────────────────────────────── */}
          <Route path="/login" element={<Login />} />

          {/* ─── LGPD — consentimento (protegida, sem guard de consentimento) ─ */}
          <Route
            path="/consentimento"
            element={
              <ProtectedRoute skipConsentCheck>
                <ConsentimentoLGPD />
              </ProtectedRoute>
            }
          />

          {/* ─── Gestante — novo design ─────────────────────────────────────── */}
          <Route
            path="/gestante/dashboard"
            element={
              <ProtectedRoute requiredRole="gestante">
                <GestanteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestante/relatos"
            element={
              <ProtectedRoute requiredRole="gestante">
                <GestanteRelatos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestante/medicamentos"
            element={
              <ProtectedRoute requiredRole="gestante">
                <GestanteMedicamentos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestante/resumos-ia"
            element={
              <ProtectedRoute requiredRole="gestante">
                <GestanteResumosIA />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gestante/perfil"
            element={
              <ProtectedRoute requiredRole="gestante">
                <GestantePerfil />
              </ProtectedRoute>
            }
          />

          {/* ─── Gestante — legado (redireciona para novo design) ──────────── */}
          <Route path="/gestante/resumos" element={<Navigate to="/gestante/resumos-ia" replace />} />
          <Route
            path="/gestante/consultas"
            element={
              <ProtectedRoute requiredRole="gestante">
                <Consultas />
              </ProtectedRoute>
            }
          />

          {/* ─── Médico — novo design (rotas canônicas) ─────────────────────── */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute requiredRole="medico">
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/patients/:id"
            element={
              <ProtectedRoute requiredRole="medico">
                <PatientDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/alerts"
            element={
              <ProtectedRoute requiredRole="medico">
                <DoctorAlerts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <ProtectedRoute requiredRole="medico">
                <DoctorReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/indicators"
            element={
              <ProtectedRoute requiredRole="medico">
                <IndicadoresUnidade />
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctor/profile"
            element={
              <ProtectedRoute requiredRole="medico">
                <DoctorProfile />
              </ProtectedRoute>
            }
          />

          {/* ─── Médico — legado (redireciona para novo design) ─────────────── */}
          <Route path="/medico/dashboard"    element={<Navigate to="/doctor"             replace />} />
          <Route path="/medico/paciente/:id" element={<Navigate to="/doctor"             replace />} />
          <Route path="/medico/alertas"      element={<Navigate to="/doctor/alerts"      replace />} />
          <Route path="/medico/relatorios"   element={<Navigate to="/doctor/reports"     replace />} />
          <Route path="/medico/indicadores"  element={<Navigate to="/doctor/indicators"  replace />} />
          <Route path="/medico/perfil"       element={<Navigate to="/doctor/profile"     replace />} />

          {/* ─── Gestante — placeholder legado ──────────────────────────────── */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute requiredRole="gestante">
                <PatientHome />
              </ProtectedRoute>
            }
          />

          {/* ─── Catch-all ──────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppRoutes;
