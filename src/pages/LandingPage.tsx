import { useMemo } from "react";
import LightPillar from "@/components/website/LightPillar";
import LandingNavbar from "@/components/website/LandingNavbar";
import PublicCourseCard from "@/components/website/PublicCourseCard";
import SplitText from "@/components/website/SplitText";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getPublicCoursesFromResponse,
  usePublicCourses,
} from "@/hooks";
import { BookStack, GraduationCap, Language, Mail, NavArrowRight, Suitcase } from "iconoir-react";

const programs = [
  {
    title: "Professional Accounting",
    description: "Foundations through applied practice aligned with global professional standards.",
    icon: BookStack,
  },
  {
    title: "Auditing & Assurance",
    description: "Risk, evidence, and reporting skills for audit-ready teams and practitioners.",
    icon: Suitcase,
  },
  {
    title: "Business English",
    description: "Communication clarity for workplace documents, meetings, and client delivery.",
    icon: Language,
  },
  {
    title: "Career Skills",
    description: "Presentation, collaboration, and leadership habits that accelerate professional growth.",
    icon: GraduationCap,
  },
];

function resolveLoginHref(): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, "") ?? "";
  if (base) return `${base}/login`;
  return "/login";
}

function courseEnrollHref(loginHref: string, courseId: number): string {
  const path = `/course/courses/${courseId}/view`;
  return `${loginHref}?redirect=${encodeURIComponent(path)}`;
}

const LandingPage = () => {
  const loginHref = resolveLoginHref();
  const { data, isLoading } = usePublicCourses({ page: 1, per_page: 4 });
  const latestCourses = useMemo(() => getPublicCoursesFromResponse(data).slice(0, 4), [data]);

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
              className="text-balance text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_28px_rgba(0,0,0,0.5)] sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
              triggerOnScroll={false}
            />
            <p className="mx-auto mt-8 max-w-3xl text-pretty text-lg leading-relaxed text-white/92 drop-shadow-md sm:text-xl md:mt-10 md:text-2xl md:leading-relaxed">
              World-Class Professional Education in Accounting, Auditing, English &amp; Career Skills
            </p>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:mt-14 sm:flex-row sm:gap-5">
              <Button
                asChild
                className="h-auto rounded-full border-0 bg-white px-8 py-4 text-base font-semibold text-primary shadow-[0_8px_28px_rgba(0,0,0,0.2)] hover:bg-white/95"
              >
                <a href="/explore-courses" className="inline-flex items-center justify-center gap-2.5">
                  <GraduationCap className="h-5 w-5 shrink-0" />
                  Explore Programs
                  <NavArrowRight className="h-4 w-4 shrink-0 opacity-90" />
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-auto rounded-full border-2 border-white/55 bg-white/12 px-8 py-4 text-base font-semibold text-white backdrop-blur-md hover:bg-white/22 hover:text-white"
              >
                <a href="#contact" className="inline-flex items-center justify-center gap-2.5">
                  <Mail className="h-5 w-5 shrink-0" />
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
                Recently added programs you can explore and enroll in after signing in.
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestCourses.map((course) => (
                <PublicCourseCard
                  key={course.id}
                  course={course}
                  enrollHref={courseEnrollHref(loginHref, course.id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        id="about"
        className="border-t border-border bg-muted/40 px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">About Raad</h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            We combine rigorous curricula with practical skills so learners can grow with confidence in
            accounting, audit, language, and career-ready competencies—wherever they work.
          </p>
        </div>
      </section>

      <section id="programs" className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Programs</h2>
            <p className="mt-3 text-muted-foreground md:text-lg">
              Start with our core tracks—designed for professionals who want measurable progress.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {programs.map(({ title, description, icon: Icon }) => (
              <Card key={title} className="border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg leading-snug">{title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button asChild variant="link" className="h-auto p-0 text-primary">
                    <a href="/explore-courses">Browse catalog</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="border-t border-border bg-muted/30 px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Get in Touch</h2>
          <p className="text-muted-foreground md:text-lg">
            Ready to explore training for your team or yourself? Sign in to the LMS or reach out through
            your usual Raad channel.
          </p>
          <Button asChild size="lg">
            <a href={loginHref}>Sign in to Raad</a>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-sm text-muted-foreground md:px-8">
        <p>© {new Date().getFullYear()} Raad LMS. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
