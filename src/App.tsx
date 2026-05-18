import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from '@/stores/appStore';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Record from '@/pages/Record';
import Query from '@/pages/Query';
import ImportExport from '@/pages/ImportExport';
import LedgerPage from '@/pages/Ledger';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/record" 
          element={
            <ProtectedRoute>
              <Record />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/query" 
          element={
            <ProtectedRoute>
              <Query />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/import-export" 
          element={
            <ProtectedRoute>
              <ImportExport />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ledger" 
          element={
            <ProtectedRoute>
              <LedgerPage />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
