import type { ReactNode } from 'react';

// Split-screen layout shared by login / signup / forgot / reset pages
export default function AuthShell({ title, subtitle, children, footer }: {
  title: string; subtitle?: string; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <img src="/AALogo.png" alt="Ateres Ami" />
        <h2>Chazarah Tracker</h2>
        <p>Track your learning sessions, stay on top of your weekly obligation, and watch the kollel’s progress together.</p>
      </aside>
      <main className="auth-main">
        <div className="auth-panel">
          <img className="auth-mobile-logo" src="/AALogo.png" alt="Ateres Ami" />
          <h1>{title}</h1>
          {subtitle && <p className="sub">{subtitle}</p>}
          {children}
          {footer && <div className="auth-footer">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
