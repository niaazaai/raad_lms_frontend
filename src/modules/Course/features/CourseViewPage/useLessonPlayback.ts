import { useQueryApi } from "@/hooks/common/useQueryApi";

export type LessonPlaybackPayload = {
  type: "hls" | "progressive";
  src: string;
  qualities?: { label: string; src: string }[] | null;
};

/**
 * Fresh playback info for a lesson (GET /lessons/:id/playback).
 */
export function useLessonPlayback(lessonId: number | null, enabled: boolean) {
  return useQueryApi<LessonPlaybackPayload>({
    queryKey: ["course", "lesson-playback", lessonId],
    url: lessonId != null ? `/lessons/${lessonId}/playback` : `/lessons/0/playback`,
    options: {
      enabled: enabled && lessonId != null,
    },
  });
}
