import { Link } from "react-router-dom";
import { BookStack, NavArrowRight } from "iconoir-react";
import { COURSE_ENTITY_REGISTRY, COURSE_ENTITY_SLUGS } from "../../data/courseRegistry";
import { PermissionDeniedCard, useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const CourseHub = () => {
  const { hasPermission } = useAuth();

  const visible = COURSE_ENTITY_SLUGS.filter((slug) =>
    hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookStack className="text-primary h-8 w-8 stroke-[1.5]" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course module</h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Run your ACCA catalogue end to end—categories, commercial terms, content delivery, and cohorts
            in one place.
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <PermissionDeniedCard />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((slug) => {
            const cfg = COURSE_ENTITY_REGISTRY[slug];
            return (
              <Link key={slug} to={`/course/entities/${slug}`}>
                <Card className="hover:border-primary/40 h-full transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">{cfg.title}</CardTitle>
                    <NavArrowRight className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm leading-snug">{cfg.pageDescription}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CourseHub;
