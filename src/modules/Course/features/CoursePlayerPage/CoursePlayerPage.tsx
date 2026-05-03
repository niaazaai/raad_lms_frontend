import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { NavArrowLeft, PageEdit } from "iconoir-react";
import { Button } from "@/components/ui";
import { Spinner } from "@/components/ui/spinner";
import {
  getCourseLearnFromResponse,
  useCourseLearn,
  type CourseLearnLesson,
  type CourseLearnQuizFile,
} from "@/hooks/useStudentLearning";
import type { ApiResponse } from "@/types/api";
import LessonVideoPlayer from "@/modules/Course/features/CourseViewPage/LessonVideoPlayer";
import {
  useLessonPlayback,
  type LessonPlaybackPayload,
} from "@/modules/Course/features/CourseViewPage/useLessonPlayback";
import { cn } from "@/lib/utils";

function quizFilesForLesson(files: CourseLearnQuizFile[], lessonId: number): CourseLearnQuizFile[] {
  return files.filter((f) => f.lesson_id === lessonId);
}

const CoursePlayerPage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const id = courseId ? Number(courseId) : NaN;
  const validId = !Number.isNaN(id) ? id : null;

  const learnQuery = useCourseLearn(validId, { enabled: validId != null });
  const payload = useMemo(() => getCourseLearnFromResponse(learnQuery.data), [learnQuery.data]);

  const lessons = payload?.lessons ?? [];
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (lessons.length === 0) return;
    setSelectedId((prev) => {
      if (prev != null && lessons.some((l) => l.id === prev)) return prev;
      return lessons[0]?.id ?? null;
    });
  }, [lessons]);

  const selectedLesson: CourseLearnLesson | null = useMemo(
    () => lessons.find((l) => l.id === selectedId) ?? null,
    [lessons, selectedId],
  );

  const canPlay =
    selectedLesson != null &&
    (selectedLesson.video_status === "ready" || selectedLesson.video_status === "active");

  const playbackQuery = useLessonPlayback(selectedId, Boolean(canPlay && selectedId != null));
  const playbackEnvelope = playbackQuery.data as ApiResponse<LessonPlaybackPayload> | undefined;
  const playbackPayload = playbackEnvelope?.data;
  const src =
    playbackPayload && typeof playbackPayload.src === "string" && playbackPayload.src.length > 0
      ? playbackPayload.src
      : "";
  const pType = playbackPayload?.type === "hls" ? "hls" : "progressive";

  const quizFiles = payload?.quiz_files ?? [];

  const loading = validId == null || learnQuery.isLoading;
  const forbidden =
    learnQuery.isError &&
    learnQuery.error instanceof Error &&
    /enrolled|Forbidden|403/i.test(learnQuery.error.message);
  if (validId == null) {
    return (
      <div className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">Invalid course.</p>
        <Button type="button" variant="outline" onClick={() => navigate("/student")}>
          My learning
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    );
  }

  if (forbidden || learnQuery.isError || !payload) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <p className="text-sm text-muted-foreground">
          {forbidden
            ? "You don’t have access to this course yet. Enroll from the catalog or contact support."
            : "Could not load this course."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <Link to={`/course/courses/${validId}/view`}>Course details</Link>
          </Button>
          <Button type="button" onClick={() => navigate("/student")}>
            My learning
          </Button>
        </div>
      </div>
    );
  }

  const course = payload.course;
  const shortDesc = String(course.short_description ?? "").trim();
  const longDesc = String(course.long_description ?? "").trim();
  const prerequisites = String(course.prerequisites ?? "").trim();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2 gap-1 px-0 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/student")}
          >
            <NavArrowLeft className="h-4 w-4" />
            My learning
          </Button>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{course.title}</h1>
          {shortDesc ? <p className="mt-2 text-sm text-muted-foreground md:text-base">{shortDesc}</p> : null}
        </div>
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to={`/course/courses/${validId}/view`}>
            <PageEdit className="mr-2 h-4 w-4" />
            Overview page
          </Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-black/5 dark:bg-black/40">
            {playbackQuery.isLoading ? (
              <div className="flex aspect-video items-center justify-center">
                <Spinner className="h-10 w-10 text-primary" />
              </div>
            ) : src ? (
              <LessonVideoPlayer src={src} playbackType={pType} />
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-2 px-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {selectedLesson
                    ? "Video is not available for this lesson yet."
                    : "Select a lesson to start."}
                </p>
              </div>
            )}
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">About</h2>
            {longDesc ? (
              longDesc.includes("<") ? (
                <div
                  className="prose-custom max-w-none text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: longDesc }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{longDesc}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">No extended description.</p>
            )}
            {prerequisites ? (
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="text-sm font-semibold text-foreground">Prerequisites</h3>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{prerequisites}</p>
              </div>
            ) : null}
          </section>

          {selectedLesson && quizFilesForLesson(quizFiles, selectedLesson.id).length > 0 ? (
            <section className="space-y-2">
              <h3 className="text-base font-semibold">Downloads for this lesson</h3>
              <ul className="space-y-2">
                {quizFilesForLesson(quizFiles, selectedLesson.id).map((qf) => (
                  <li
                    key={qf.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{qf.title}</span>
                    {qf.download_url ? (
                      <a
                        href={qf.download_url}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-2 lg:sticky lg:top-4 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lessons</h2>
          <ul className="space-y-1 border border-border rounded-lg bg-card p-2">
            {lessons.map((lesson) => (
              <li key={lesson.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(lesson.id)}
                  className={cn(
                    "flex w-full flex-col rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    lesson.id === selectedId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  )}
                >
                  <span className="font-medium">{lesson.title}</span>
                  {lesson.description?.trim() ? (
                    <span
                      className={cn(
                        "mt-0.5 line-clamp-2 text-xs",
                        lesson.id === selectedId ? "text-primary-foreground/90" : "text-muted-foreground",
                      )}
                    >
                      {lesson.description.trim()}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
