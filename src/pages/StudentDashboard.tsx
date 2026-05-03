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
          {enrollments.map((row) => (
            <Card
              key={row.id}
              className="overflow-hidden border-border/80 transition-shadow hover:shadow-md"
            >
              <div className="aspect-video w-full bg-muted">
                {row.course_thumbnail_url ? (
                  <img
                    src={row.course_thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <BookStack className="h-14 w-14 opacity-40" />
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 p-4">
                <div>
                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
                    {row.course_title ?? "Course"}
                  </h2>
                  {row.plan_name ? (
                    <p className="mt-1 text-xs text-muted-foreground">Plan: {row.plan_name}</p>
                  ) : null}
                  {row.subscription_end_date ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Access until {row.subscription_end_date}
                    </p>
                  ) : null}
                </div>
                <Button type="button" className="w-full gap-2" asChild>
                  <Link to={`/learn/course/${row.course_id}`}>
                    Continue
                    <NavArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboardPage;
