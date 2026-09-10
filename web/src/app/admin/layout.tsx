import "./admin.css";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

// Runs before paint so a dark-mode admin never flashes white on load.
const THEME_INIT = `(function(){try{
  var t = localStorage.getItem('fg-admin-theme');
  if(!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  document.currentScript.parentElement.setAttribute('data-theme', t);
}catch(e){}})();`;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="adm" data-theme="light">
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      {children}
    </div>
  );
}
