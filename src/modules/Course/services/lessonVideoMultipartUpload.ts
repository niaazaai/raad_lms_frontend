import apiClient from "@/services/apiClient";
import { fetchCsrfCookie } from "@/services/callApi";
import type { ApiResponse } from "@/types/api";

export type LessonMultipartUploadOptions = {
  onProgress?: (loadedBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
};

type InitPayload = {
  upload_id: string;
  key: string;
  recommended_part_size_bytes: number;
};

/** Apisauce leaves `response.data` loosely typed; Laravel errors use `message`. */
function readApiMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const m = "message" in data ? (data as { message?: unknown }).message : undefined;
  return typeof m === "string" ? m : "";
}

function parseApiData<T>(body: unknown): T {
  if (!body || typeof body !== "object") throw new Error("Invalid API response");
  const envelope = body as ApiResponse<T>;
  if (!envelope.success) {
    throw new Error(
      typeof envelope.message === "string" ? envelope.message : "Request failed"
    );
  }
  return envelope.data as T;
}

function putPart(
  url: string,
  blob: Blob,
  contentType: string,
  partStartOffset: number,
  fileTotalBytes: number,
  onOverallProgress: (loadedSoFar: number, total: number) => void,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onOverallProgress(partStartOffset + e.loaded, fileTotalBytes);
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const raw = xhr.getResponseHeader("ETag") ?? xhr.getResponseHeader("etag");
        if (!raw) {
          reject(
            new Error(
              "Part upload succeeded but ETag was missing. If uploads go to Garage/S3 on another origin, ensure CORS exposes the ETag header."
            )
          );
          return;
        }
        resolve(raw.replace(/"/g, ""));
        return;
      }
      reject(new Error(`Part upload failed (HTTP ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading a part"));
    xhr.onabort = () => reject(new Error("Upload cancelled"));
    xhr.setRequestHeader("Content-Type", contentType || "application/octet-stream");
    if (signal) {
      if (signal.aborted) {
        reject(new Error("Upload cancelled"));
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(blob);
  });
}

/**
 * Browser → Garage/S3 multipart upload using Laravel presign endpoints.
 * Large files never pass through nginx/PHP body limits (only small JSON + presigned PUTs).
 */
export async function uploadLessonVideoMultipart(
  lessonId: number,
  file: File,
  options: LessonMultipartUploadOptions = {}
): Promise<void> {
  const { onProgress, signal } = options;
  const totalBytes = file.size;

  await fetchCsrfCookie();

  const initRes = await apiClient.post<ApiResponse<InitPayload>>(
    `/lessons/${lessonId}/video/multipart/init`,
    {
      filename: file.name,
      content_type: file.type || "application/octet-stream",
      size_bytes: file.size,
    }
  );
  if (!initRes.ok || !initRes.data) {
    throw new Error(readApiMessage(initRes.data) || "Could not start video upload");
  }
  const init = parseApiData<InitPayload>(initRes.data);
  const partSize = Math.max(
    5 * 1024 * 1024,
    init.recommended_part_size_bytes || 10 * 1024 * 1024
  );

  const parts: Array<{ part_number: number; etag: string }> = [];
  let partNumber = 1;
  for (let offset = 0; offset < totalBytes; offset += partSize) {
    if (signal?.aborted) throw new Error("Upload cancelled");

    const end = Math.min(offset + partSize, totalBytes);
    const blob = file.slice(offset, end);

    const presignRes = await apiClient.post<ApiResponse<{ url: string }>>(
      `/lessons/${lessonId}/video/multipart/presign`,
      { part_number: partNumber }
    );
    if (!presignRes.ok || !presignRes.data) {
      throw new Error(readApiMessage(presignRes.data) || "Could not prepare upload chunk");
    }
    const presignPayload = parseApiData<{ url: string }>(presignRes.data);
    const url = presignPayload.url;
    if (!url) throw new Error("Presign URL missing");

    const etag = await putPart(
      url,
      blob,
      file.type || "application/octet-stream",
      offset,
      totalBytes,
      (loadedSoFar, total) => {
        onProgress?.(loadedSoFar, total);
      },
      signal
    );

    parts.push({ part_number: partNumber, etag });
    partNumber++;
  }

  onProgress?.(totalBytes, totalBytes);

  const completeRes = await apiClient.post(
    `/lessons/${lessonId}/video/multipart/complete`,
    { parts }
  );
  if (!completeRes.ok) {
    const msg = readApiMessage(completeRes.data);
    throw new Error(msg || `Could not finalize video upload (HTTP ${completeRes.status})`);
  }
}

export async function abortLessonMultipartUpload(lessonId: number): Promise<void> {
  await fetchCsrfCookie();
  const res = await apiClient.post(`/lessons/${lessonId}/video/multipart/abort`);
  if (!res.ok && res.status !== 404) {
    throw new Error(readApiMessage(res.data) || "Abort failed");
  }
}
