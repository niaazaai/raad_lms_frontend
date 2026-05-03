import { useMemo, useState } from "react";
import LandingNavbar from "@/components/website/LandingNavbar";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getPublicCoursesFromResponse,
  getPublicCoursesPagination,
  usePublicCourses,
} from "@/hooks";
import { NavArrowLeft, NavArrowRight } from "iconoir-react";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function coursePublicViewPath(courseId: number): string {
  return `/course/courses/${courseId}/view`;
}

const ExploreCoursesPage = () => {
  const loginHref = resolveLoginHref();
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data, isLoading, isFetching, isError } = usePublicCourses({ page, per_page: perPage });

  const courses = useMemo(() => getPublicCoursesFromResponse(data), [data]);
  const pagination = useMemo(() => getPublicCoursesPagination(data), [data]);

  return (
    <div className="min-h-screen scroll-smooth bg-background text-foreground">
      <LandingNavbar loginHref={loginHref} />

      <main className="px-4 pb-16 pt-28 md:px-8 md:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center md:mb-12">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Explore courses</h1>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Browse our catalog. Sign in to view full details and enroll.
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-muted-foreground">
              <Spinner className="h-8 w-8" />
            </div>
          ) : isError ? (
            <p className="text-center text-muted-foreground">Could not load courses. Please try again later.</p>
          ) : courses.length === 0 ? (
            <p className="text-center text-muted-foreground">No courses are available yet. Check back soon.</p>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <PublicCourseCard
                    key={course.id}
                    course={course}
                    enrollHref={coursePublicViewPath(course.id)}
                  />
                ))}
              </div>

              {pagination && pagination.total_pages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="gap-1"
                  >
                    <NavArrowLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.current_page} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.has_more_pages || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="gap-1"
                  >
                    Next
                    <NavArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground md:px-8">
        <p>© {new Date().getFullYear()} Raad LMS.</p>
      </footer>
    </div>
  );
};

export default ExploreCoursesPage;
