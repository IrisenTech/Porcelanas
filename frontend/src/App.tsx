import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { CatalogPage } from './catalog/CatalogPage';
import { AdminPage } from './admin/AdminPage';
import { LoginScreen } from './components/LoginScreen';
import { isAuthenticated, logout } from './lib/auth';

function TopNav({ adminAuthed, onLogout }: { adminAuthed: boolean; onLogout: () => void }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="topnav">
      <div className="container topnav-inner">
        <div className="topnav-logo">
          Porcelanas
          <span>Colección Exclusiva</span>
        </div>

        <div className="topnav-actions">
          <div className="mode-toggle">
            <NavLink
              to="/"
              className={({ isActive }) => (isActive && !isAdmin ? 'active' : '')}
              end
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              Admin
            </NavLink>
          </div>

          {/* Only show logout when logged into admin */}
          {adminAuthed && isAdmin && (
            <button
              className="logout-btn"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

/** Wraps /admin — shows login screen if not authenticated, otherwise renders children */
function AdminRoute({ authed, onLogin }: { authed: boolean; onLogin: () => void }) {
  if (!authed) {
    return <LoginScreen onSuccess={onLogin} />;
  }
  return <AdminPage />;
}

export default function App() {
  const [adminAuthed, setAdminAuthed] = useState<boolean>(isAuthenticated);

  const handleLogin = () => setAdminAuthed(true);

  const handleLogout = () => {
    logout();
    setAdminAuthed(false);
  };

  return (
    <BrowserRouter>
      <TopNav adminAuthed={adminAuthed} onLogout={handleLogout} />
      <main>
        <Routes>
          {/* PUBLIC — anyone can browse the catalog */}
          <Route path="/" element={<CatalogPage />} />

          {/* PRIVATE — login required to manage items */}
          <Route
            path="/admin"
            element={<AdminRoute authed={adminAuthed} onLogin={handleLogin} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
