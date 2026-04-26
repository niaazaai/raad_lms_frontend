import { HomeSimple, NavArrowRight } from "iconoir-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
}

const PageBreadcrumb = ({ items }: PageBreadcrumbProps) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-1.5 text-sm">
        <li>
          <Link
            to="/dashboard"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dashboard"
          >
            <HomeSimple className="h-4 w-4" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              <NavArrowRight className="h-3.5 w-3.5 text-muted-foreground/70" />
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default PageBreadcrumb;
