import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppData } from '@/providers';
import { Icon, MOBILE_NAV } from './nav';

const TITLES: Record<string, string> = {
  '/chazarah': 'Timer', '/sessions': 'Sessions', '/obligation': 'Obligation', '/profile': 'Profile',
};

export default function MobileLayout() {
  const { years, selectedYear, setSelectedYear, yearsLoading } = useAppData();
  const { pathname } = useLocation();

  return (
    <div className="app mobile">
      <header className="m-header">
        <h1>{TITLES[pathname] ?? 'Chazarah Tracker'}</h1>
        {!yearsLoading && (
          <select
            className="m-year"
            aria-label="Year"
            value={selectedYear?.JewishYear ?? ''}
            onChange={(e) => {
              const y = years.find((y) => y.JewishYear === Number(e.target.value));
              if (y) setSelectedYear(y);
            }}
          >
            {years.map((y) => <option key={y.JewishYear} value={y.JewishYear}>{y.JewishYear}</option>)}
          </select>
        )}
      </header>

      <main className="m-page"><Outlet /></main>

      <nav className="m-tabs">
        {MOBILE_NAV.map((n) => (
          <NavLink key={n.to} to={n.to}><Icon d={n.icon} /><span>{n.label}</span></NavLink>
        ))}
      </nav>
    </div>
  );
}
