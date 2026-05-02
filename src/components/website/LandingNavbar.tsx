import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface LandingNavbarProps {
  loginHref: string;
  className?: string;
}

const linkClass =
  "rounded-full px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:text-[#004a80]";

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
          "pointer-events-auto flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 md:px-6 md:py-3",
          "border-2 border-white/90",
          "shadow-[0_10px_40px_rgba(0,105,180,0.14),0_2px_8px_rgba(0,60,100,0.08),inset_0_1px_0_rgba(255,255,255,0.98),inset_0_0_0_1px_rgba(0,105,180,0.06)]",
          "backdrop-blur-2xl backdrop-saturate-150",
          "bg-[linear-gradient(145deg,rgba(255,255,255,0.94)_0%,rgba(245,250,255,0.9)_38%,rgba(236,246,255,0.88)_72%,rgba(248,250,252,0.92)_100%)]",
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
            <a href="/#about" className={cn(linkClass, "hidden sm:inline-flex")}>
              About us
            </a>
            <a href="/explore-courses" className={cn(linkClass, "shrink-0")}>
              Programs
            </a>
            <a href="/#about" className={cn(linkClass, "sm:hidden")}>
              About
            </a>
          </div>

          <Button
            asChild
            className="ml-1 shrink-0 rounded-full border-0 bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary-active md:ml-2"
          >
            <a href={loginHref}>Sign in</a>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavbar;
