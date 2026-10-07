import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAppData, useAuth } from '@/providers';
import { handleLogout } from '@/utils/authutil';

import ProfileBar from './ProfileBar';
import { NAV } from './nav';

export function WebLayout() {
  const { years, selectedYear, setSelectedYear, yearsLoading } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const meta = user?.user_metadata ?? {};
  const initials = ((meta.firstname?.[0] ?? '') + (meta.lastname?.[0] ?? '')).toUpperCase() || (user?.email?.[0]?.toUpperCase() ?? '?');
  const name = meta.display_name || user?.email || '';

  const logout = async () => {
    await handleLogout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app web">
      <header className="header">
        <div className="header-inner">
          <NavLink to="/chazarah" className="logo">
            <img src="/AALogo.png" alt="Kollel Ateres Ami" />
          </NavLink>

          <nav className="topnav">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}>{n.label}</NavLink>
            ))}
            <NavLink to="/chart">Chart</NavLink>
          </nav>

          <div className="header-right">
            {!yearsLoading && (
              <label className="year-pick">
                <span>Year</span>
                <select
                  value={selectedYear?.JewishYear ?? ''}
                  onChange={(e) => {
                    const y = years.find((y) => y.JewishYear === Number(e.target.value));
                    if (y) setSelectedYear(y);
                  }}
                >
                  {years.map((y) => <option key={y.JewishYear} value={y.JewishYear}>{y.JewishYear}</option>)}
                </select>
              </label>
            )}
            <div className="user-menu" ref={menuRef}>
              <button className="avatar" aria-label="Account menu" onClick={() => setMenuOpen((o) => !o)}>{initials}</button>
              {menuOpen && (
                <div className="menu">
                  <div className="menu-who">{name}</div>
                  <button onClick={() => { setMenuOpen(false); navigate('/profile'); }}>Profile</button>
                  <button className="red" onClick={logout}>Log out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
      <ProfileBar />

      <main className="page"><Outlet /></main>

    </div>
  );
}
