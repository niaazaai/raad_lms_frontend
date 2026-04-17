import { Link } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { COURSE_ENTITY_REGISTRY, COURSE_ENTITY_SLUGS } from "../../data/courseRegistry";
import { useAuth } from "@/features/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";

const CourseHub = () => {
  const { hasPermission } = useAuth();

  const visible = COURSE_ENTITY_SLUGS.filter((slug) =>
    hasPermission(COURSE_ENTITY_REGISTRY[slug].permission)
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="text-primary h-8 w-8" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Course module</h1>
          <p className="text-muted-foreground text-sm">
            Admin tools for categories, courses, lessons, subscriptions, and classes.
          </p>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">You do not have permission to view course admin data.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((slug) => {
            const cfg = COURSE_ENTITY_REGISTRY[slug];
            return (
              <Link key={slug} to={`/course/entities/${slug}`}>
                <Card className="hover:border-primary/40 h-full transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-semibold">{cfg.title}</CardTitle>
                    <ChevronRight className="text-muted-foreground h-4 w-4" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground font-mono text-xs">{cfg.apiPath}</p>
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
