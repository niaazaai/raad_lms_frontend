import { useMemo } from "react";
import LightPillar from "@/components/website/LightPillar";
import LandingNavbar from "@/components/website/LandingNavbar";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import SplitText from "@/components/website/SplitText";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getPublicCoursesFromResponse,
  usePublicCourses,
} from "@/hooks";
import { NavArrowRight } from "iconoir-react";

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function coursePublicViewPath(courseId: number): string {
  return `/course/courses/${courseId}/view`;
}

const LandingPage = () => {
  const loginHref = resolveLoginHref();
  const { data, isLoading } = usePublicCourses({ page: 1, per_page: 3 });
  const latestCourses = useMemo(() => getPublicCoursesFromResponse(data).slice(0, 3), [data]);

  return (
    <div id="top" className="min-h-screen scroll-smooth bg-background text-foreground">
      <LandingNavbar loginHref={loginHref} />

      <section className="relative flex min-h-dvh flex-col overflow-hidden">
        <div className="absolute inset-0 bg-[#050a18]" aria-hidden />
        <div className="absolute inset-0">
          <LightPillar
            topColor="#0069B4"
            bottomColor="#9B3D9A"
            intensity={1.05}
            rotationSpeed={0.28}
            glowAmount={0.006}
            pillarWidth={3.2}
            pillarHeight={0.42}
            noiseIntensity={0.45}
            pillarRotation={0}
            interactive={false}
            mixBlendMode="screen"
            quality="high"
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center px-4 pb-12 pt-24 md:px-10 md:pb-16 md:pt-28">
          <div className="mx-auto w-full max-w-5xl text-center">
            <SplitText
              tag="h1"
              text="Empowering the Next Generation of Global Professionals"
              className="hyphens-manual break-normal text-pretty text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              delay={80}
              duration={0.55}
              ease="power3.out"
              splitType="words"
              from={{ opacity: 0, y: 36 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              triggerOnScroll={false}
            />
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:mt-14 sm:flex-row sm:gap-6">
              <Button
                asChild
                className="h-auto rounded-full border-0 bg-white px-10 py-4 text-base font-bold tracking-wide text-primary shadow-[0_6px_28px_rgba(0,0,0,0.22)] ring-1 ring-white/30 transition hover:bg-white hover:shadow-[0_10px_36px_rgba(0,0,0,0.28)]"
              >
                <a href="/explore-courses" className="inline-flex items-center justify-center">
                  Explore Programs
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto rounded-full border-2 border-white/70 bg-white/15 px-10 py-4 text-base font-bold tracking-wide text-white shadow-[0_6px_24px_rgba(0,0,0,0.12)] backdrop-blur-md transition hover:border-white hover:bg-white/28 hover:text-white"
              >
                <a href={loginHref} className="inline-flex items-center justify-center">
                  Get in Touch
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-background px-4 py-14 md:px-8 md:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end md:mb-10">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Latest courses</h2>
              <p className="mt-2 text-muted-foreground md:text-lg">
                Recently added programs—open any course to preview content and subscription options.
              </p>
            </div>
            <Button asChild variant="outline" className="shrink-0 gap-2">
              <a href="/explore-courses" className="inline-flex items-center gap-2">
                View all courses
                <NavArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
          {isLoading ? (
            <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
              <Spinner className="h-8 w-8" />
            </div>
          ) : latestCourses.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No courses to show yet. Visit the catalog to check again soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestCourses.map((course) => (
                <PublicCourseCard
                  key={course.id}
                  course={course}
                  enrollHref={coursePublicViewPath(course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground md:px-8">
        <p>© {new Date().getFullYear()} Raad LMS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
