import { LogOut, TrainFront } from "lucide-react";
import { Navigate, NavLink, Outlet, useNavigate, useSearchParams } from "react-router-dom";
import { StationDot } from "./transit";

const NAV = [
  { to: "/app", label: "Dashboard", color: "#D42E12", end: true },
  { to: "/app/requests/new", label: "Intake", color: "#9900AA", end: false },
  { to: "/app/requests", label: "Requests", color: "#005EC4", end: true },
  { to: "/app/schedule", label: "Schedule", color: "#009645", end: false },
  { to: "/app/whatif", label: "What-If", color: "#FA9E0D", end: false },
  { to: "/app/resources", label: "Resources", color: "#0099AA", end: true },
];

export default function Layout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const persona =
    searchParams.get("demo") === "1" ? "Duty Manager" : localStorage.getItem("cascade.persona");

  if (!persona) return <Navigate to="/login" replace />;

  const signOut = () => {
    localStorage.removeItem("cascade.persona");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-6">
          <NavLink to="/app" className="flex items-center gap-3">
            <span className="block h-[26px] w-[26px] overflow-hidden rounded-[7px]">
              <img src="/cascade-logo.png" alt="Cascade logo" className="h-full w-full scale-[1.14] object-cover" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-[0.08em]">CASCADE</span>
          </NavLink>

          <nav className="relative flex items-center gap-1 sm:gap-2">
            <div className="absolute left-4 right-4 top-1/2 hidden h-px -translate-y-1/2 bg-ink/15 md:block" aria-hidden />
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative z-10 flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold transition-colors sm:px-3 ${
                    isActive ? "text-ink" : "text-ink/45 hover:text-ink/80"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive ? (
                      <span className="animate-train-in flex items-center" style={{ color: item.color }}>
                        <TrainFront className="h-4 w-4" strokeWidth={2.4} />
                      </span>
                    ) : (
                      <StationDot color={item.color} className="bg-paper" />
                    )}
                    <span className="hidden sm:inline">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-ink/15 px-3 py-1 text-[11px] font-semibold text-ink/60 md:inline">
              {persona}
            </span>
            <button
              onClick={signOut}
              title="Sign out"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pb-20">
        <Outlet />
      </main>

      <footer className="border-t border-ink/10 py-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 font-mono text-[11px] text-ink/40">
          <span>CASCADE · ENGINEERING WINDOW 00:00–06:00</span>
          <span>NETWORK: MRT · NIGHT OPS</span>
        </div>
      </footer>
    </div>
  );
}
