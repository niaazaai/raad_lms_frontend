import { Link } from "react-router-dom";
import { BookStack, NavArrowRight } from "iconoir-react";
import { Button, Card, CardContent } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getMyEnrollmentsFromResponse,
  useMyEnrollments,
} from "@/hooks/useStudentLearning";

const StudentDashboardPage = () => {
  const { data, isLoading, isError } = useMyEnrollments({ page: 1, per_page: 24 });
  const enrollments = getMyEnrollmentsFromResponse(data);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My learning</h1>
        <p className="mt-2 text-muted-foreground">
          Courses you&apos;re enrolled in. Open a course to watch lessons and download materials.
        </p>
      </div>

      {isLoading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <Spinner className="h-10 w-10 text-primary" />
        </div>
      ) : isError ? (
        <p className="text-sm text-muted-foreground">Could not load your courses. Try again later.</p>
      ) : enrollments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
          <BookStack className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            You don&apos;t have any enrollments yet. Browse the catalog to find a course.
          </p>
          <Button type="button" className="mt-6" asChild>
            <Link to="/explore-courses">Explore courses</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((row) => {
            const courseId = Number(row.course_id);
            const learnPath = Number.isFinite(courseId) ? `/learn/course/${courseId}` : "/student";
            const title = row.course_title ?? "Course";
            return (
              <Link
                key={row.id}
                to={learnPath}
                className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`Open course: ${title}`}
              >
                <Card className="h-full overflow-hidden border-border/80 transition-shadow hover:shadow-md group-hover:border-primary/25">
                  <div className="aspect-video w-full bg-muted">
                    {row.course_thumbnail_url ? (
                      <img
                        src={row.course_thumbnail_url}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">
                        <BookStack className="h-14 w-14 opacity-40" />
                      </div>
                    )}
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                        {title}
                      </h2>
                      {row.plan_name ? (
                        <p className="mt-1 text-xs text-muted-foreground">Plan: {row.plan_name}</p>
                      ) : null}
                      {row.subscription_status === "pending" ? (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                          Awaiting approval — you can open the course; lessons unlock once active.
                        </p>
                      ) : null}
                      {row.subscription_end_date ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Access until {row.subscription_end_date}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-muted/50 py-2.5 text-sm font-medium text-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      Continue to lessons
                      <NavArrowRight className="h-4 w-4" aria-hidden />
                    </div>
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

export default StudentDashboardPage;
