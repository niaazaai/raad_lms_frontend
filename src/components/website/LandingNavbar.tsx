import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface LandingNavbarProps {
  loginHref: string;
  className?: string;
}

const linkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/15 hover:text-white";

const LandingNavbar = ({ loginHref, className }: LandingNavbarProps) => {
  return (
    <header
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:px-8 md:pt-6",
        className,
      )}
    >
      <nav
        className={cn(
          "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl border-[0.5px] border-solid border-neutral-500/45 px-4 py-2.5 shadow-sm md:px-6 md:py-3",
          "backdrop-blur-xl backdrop-saturate-150",
          "bg-white/25 dark:bg-white/10",
        )}
        aria-label="Main"
      >
        <a href="/" className="flex shrink-0 items-center gap-3 pr-2">
          <img src="/logo.png" alt="Raad LMS" className="h-9 w-auto max-h-11 object-contain md:h-11" />
        </a>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2 md:gap-3">
          <div className="flex items-center gap-0.5 overflow-x-auto sm:gap-1">
            <a href="/" className={cn(linkClass, "shrink-0")}>
              Home
            </a>
            <a href="/explore-courses" className={cn(linkClass, "shrink-0")}>
              Programs
            </a>
          </div>

          <Button
            asChild
            className="ml-1 shrink-0 rounded-full border-0 bg-white px-5 py-2.5 text-sm font-semibold text-primary shadow-md hover:bg-white/95 md:ml-2"
          >
            <a href={loginHref}>Sign in</a>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavbar;
