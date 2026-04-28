import type { CourseEntitySlug } from "./courseRegistry";

export type CourseFormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "date"
  | "checkbox"
  | "json";

export interface CourseEntityFormField {
  name: string;
  label: string;
  type: CourseFormFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface CourseEntityStatusToggle {
  field: string;
  activeValue: string;
  inactiveValue: string;
}

export interface CourseEntityFormDefinition {
  fields: CourseEntityFormField[];
  statusToggle?: CourseEntityStatusToggle;
}

const LANG = [
  { value: "DARI", label: "Dari" },
  { value: "PASHTOO", label: "Pashtoo" },
  { value: "ENGLISH", label: "English" },
];

const LEVEL = [
  { value: "BEGINNER", label: "Beginner" },
  { value: "INTERMEDIATE", label: "Intermediate" },
  { value: "ADVANCED", label: "Advanced" },
];

const ACTIVE_INACTIVE = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const ACTIVE_REVOKED = [
  { value: "active", label: "Active" },
  { value: "revoked", label: "Revoked" },
];

const DISCOUNT_TYPE = [
  { value: "percentage", label: "Percentage" },
  { value: "fixed", label: "Fixed" },
];

const SUB_FREE_PAID = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
];

const CLASS_TYPE = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const CLASS_STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STUDENT_SUB_STATUS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_STATUS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const GRADE_OPTS = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
  { value: "D", label: "D" },
  { value: "F", label: "F" },
  { value: "PENDING", label: "Pending" },
];

const ENROLL_STATUS = [
  { value: "failed", label: "Failed" },
  { value: "passed", label: "Passed" },
  { value: "dropped", label: "Dropped" },
  { value: "in_progress", label: "In progress" },
];

const CONTENT_TYPE = [
  { value: "video", label: "Video" },
  { value: "content", label: "Content" },
];

const VIDEO_TYPE = [
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
];

export const COURSE_ENTITY_FORM_REGISTRY: Record<CourseEntitySlug, CourseEntityFormDefinition> = {
  "main-categories": {
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "sub-categories": {
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "course-faasls": {
    fields: [{ name: "title", label: "Title", type: "text", required: true }],
  },
  courses: {
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "short_description", label: "Short description", type: "textarea" },
      { name: "long_description", label: "Long description", type: "textarea" },
      { name: "prerequisites", label: "Prerequisites", type: "textarea" },
      { name: "language", label: "Language", type: "select", options: LANG },
      { name: "level", label: "Level", type: "select", options: LEVEL },
      { name: "thumbnail", label: "Thumbnail URL", type: "text" },
      { name: "banner", label: "Banner URL", type: "text" },
      { name: "price", label: "Price", type: "number" },
      { name: "is_featured", label: "Featured", type: "checkbox" },
      { name: "is_popular", label: "Popular", type: "checkbox" },
      { name: "is_new", label: "New", type: "checkbox" },
      { name: "is_best_seller", label: "Best seller", type: "checkbox" },
      { name: "is_free", label: "Free", type: "checkbox" },
      {
        name: "course_module_id",
        label: "Course module (faasl) ID",
        type: "number",
        required: true,
      },
      { name: "course_sub_category_id", label: "Sub category ID", type: "number", required: true },
      {
        name: "course_main_category_id",
        label: "Main category ID",
        type: "number",
        required: true,
      },
      { name: "instructor_id", label: "Instructor user ID", type: "number" },
      { name: "estimated_duration", label: "Estimated duration (min)", type: "number" },
      { name: "students_enrolled", label: "Students enrolled", type: "number" },
      { name: "students_completed", label: "Students completed", type: "number" },
      { name: "students_in_progress", label: "Students in progress", type: "number" },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  lessons: {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "content_type", label: "Content type", type: "select", options: CONTENT_TYPE },
      {
        name: "video_sources",
        label: "Video sources (JSON array)",
        type: "json",
        placeholder: "[]",
      },
      { name: "default_resolution", label: "Default resolution", type: "text" },
      { name: "video_duration", label: "Video duration (sec)", type: "number" },
      { name: "video_size", label: "Video size (bytes)", type: "number" },
      { name: "video_type", label: "Video type", type: "select", options: VIDEO_TYPE },
      { name: "video_status", label: "Video status", type: "select", options: ACTIVE_INACTIVE },
      { name: "content_body", label: "Content body", type: "textarea" },
    ],
    statusToggle: { field: "video_status", activeValue: "active", inactiveValue: "inactive" },
  },
  assignments: {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "lesson_id", label: "Lesson ID", type: "number" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "assignment_file_url", label: "Assignment file URL", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "downloadable-resources": {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "lesson_id", label: "Lesson ID", type: "number" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "resource_file_url", label: "Resource file URL", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
      { name: "uploaded_at", label: "Uploaded at", type: "date", required: true },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "quiz-files": {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "lesson_id", label: "Lesson ID", type: "number" },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "quiz_file_url", label: "Quiz file URL", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
      { name: "uploaded_at", label: "Uploaded at", type: "date", required: true },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "student-discounts": {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "user_id", label: "User ID", type: "number", required: true },
      { name: "discount_type", label: "Discount type", type: "select", options: DISCOUNT_TYPE },
      { name: "discount_value", label: "Discount value", type: "number" },
      {
        name: "discount_status",
        label: "Discount status",
        type: "select",
        options: ACTIVE_INACTIVE,
      },
      { name: "discounted_at", label: "Discounted at", type: "date", required: true },
    ],
    statusToggle: { field: "discount_status", activeValue: "active", inactiveValue: "inactive" },
  },
  certificates: {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "user_id", label: "User ID", type: "number", required: true },
      { name: "certificate_file_url", label: "Certificate file URL", type: "text", required: true },
      { name: "issue_date", label: "Issue date", type: "date", required: true },
      { name: "issued_by", label: "Issued by (user ID)", type: "number" },
      {
        name: "certificate_public_id",
        label: "Certificate public ID",
        type: "text",
        required: true,
      },
      { name: "qr_code_url", label: "QR code URL", type: "text", required: true },
      { name: "status", label: "Status", type: "select", options: ACTIVE_REVOKED },
      { name: "signature_hash", label: "Signature hash", type: "text", required: true },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "revoked" },
  },
  "subscription-plans": {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "plan_name", label: "Plan name", type: "text", required: true },
      { name: "plan_description", label: "Plan description", type: "textarea" },
      { name: "price", label: "Price", type: "number", required: true },
      { name: "duration_in_days", label: "Duration (days)", type: "number", required: true },
      {
        name: "subscription_type",
        label: "Subscription type",
        type: "select",
        options: SUB_FREE_PAID,
      },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "course-subscriptions": {
    fields: [
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "plan_id", label: "Plan ID", type: "number", required: true },
      {
        name: "subscription_status",
        label: "Subscription status",
        type: "select",
        options: ACTIVE_INACTIVE,
      },
    ],
    statusToggle: {
      field: "subscription_status",
      activeValue: "active",
      inactiveValue: "inactive",
    },
  },
  "student-subscriptions": {
    fields: [
      { name: "subscription_id", label: "Course subscription ID", type: "number", required: true },
      { name: "plan_id", label: "Plan ID", type: "number", required: true },
      { name: "user_id", label: "User ID", type: "number", required: true },
      { name: "course_id", label: "Course ID", type: "number", required: true },
      {
        name: "subscription_start_date",
        label: "Subscription start",
        type: "date",
        required: true,
      },
      { name: "subscription_end_date", label: "Subscription end", type: "date" },
      {
        name: "subscription_status",
        label: "Subscription status",
        type: "select",
        options: STUDENT_SUB_STATUS,
      },
      { name: "purchase_date", label: "Purchase date", type: "date", required: true },
      { name: "voucher_file_url", label: "Voucher file URL", type: "text" },
      { name: "payment_status", label: "Payment status", type: "select", options: PAYMENT_STATUS },
      { name: "approved_by", label: "Approved by (user ID)", type: "number" },
      { name: "approval_date", label: "Approval date", type: "date" },
      { name: "auto_closed", label: "Auto closed", type: "checkbox" },
      { name: "closed_at", label: "Closed at", type: "date" },
      { name: "notification_sent", label: "Notification sent", type: "checkbox" },
    ],
    statusToggle: {
      field: "subscription_status",
      activeValue: "active",
      inactiveValue: "inactive",
    },
  },
  instructors: {
    fields: [
      { name: "user_id", label: "User ID", type: "number", required: true },
      { name: "bio", label: "Bio", type: "textarea" },
      { name: "specialization", label: "Specialization", type: "text" },
      { name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "lms-classes": {
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "course_id", label: "Course ID", type: "number", required: true },
      { name: "instructor_id", label: "Instructor ID", type: "number", required: true },
      { name: "class_type", label: "Class type", type: "select", options: CLASS_TYPE },
      { name: "start_date", label: "Start date", type: "date" },
      { name: "end_date", label: "End date", type: "date" },
      { name: "start_time", label: "Start time (HH:mm:ss)", type: "text", placeholder: "09:00:00" },
      { name: "end_time", label: "End time (HH:mm:ss)", type: "text", placeholder: "10:30:00" },
      { name: "total_marks", label: "Total marks", type: "number" },
      { name: "status", label: "Status", type: "select", options: CLASS_STATUS },
    ],
    statusToggle: { field: "status", activeValue: "active", inactiveValue: "inactive" },
  },
  "lms-class-students": {
    fields: [
      { name: "class_id", label: "Class ID", type: "number", required: true },
      { name: "user_id", label: "User ID", type: "number", required: true },
      { name: "enrollment_date", label: "Enrollment date", type: "date", required: true },
      { name: "enrolled_by", label: "Enrolled by (user ID)", type: "number" },
      { name: "marks_obtained", label: "Marks obtained", type: "number" },
      { name: "percentage", label: "Percentage", type: "number" },
      { name: "grade", label: "Grade", type: "select", options: GRADE_OPTS },
      { name: "instructor_feedback", label: "Instructor feedback", type: "textarea" },
      { name: "instructor_feedback_date", label: "Feedback date", type: "date" },
      { name: "status", label: "Status", type: "select", options: ENROLL_STATUS },
    ],
  },
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCreateDefaultsForEntity(
  slug: CourseEntitySlug
): Record<string, string | boolean> {
  const def = COURSE_ENTITY_FORM_REGISTRY[slug];
  const out: Record<string, string | boolean> = {};
  const today = todayISO();

  for (const f of def.fields) {
    if (f.type === "checkbox") out[f.name] = false;
    else out[f.name] = "";
  }

  switch (slug) {
    case "main-categories":
    case "courses":
    case "assignments":
    case "subscription-plans":
    case "instructors":
      if ("status" in out) out.status = "active";
      break;
    case "sub-categories":
      out.main_category_id = "";
      if ("status" in out) out.status = "active";
      break;
    case "lessons":
      out.video_status = "active";
      out.content_type = "video";
      break;
    case "downloadable-resources":
    case "quiz-files":
      out.uploaded_at = today;
      out.status = "active";
      break;
    case "student-discounts":
      out.discounted_at = today;
      out.discount_status = "active";
      out.discount_type = "percentage";
      break;
    case "certificates":
      out.issue_date = today;
      out.status = "active";
      break;
    case "course-subscriptions":
      out.subscription_status = "active";
      break;
    case "student-subscriptions":
      out.subscription_start_date = today;
      out.purchase_date = today;
      out.subscription_status = "active";
      out.payment_status = "pending";
      break;
    case "lms-classes":
      out.status = "active";
      out.class_type = "online";
      break;
    case "lms-class-students":
      out.enrollment_date = today;
      out.status = "in_progress";
      out.grade = "PENDING";
      break;
    default:
      break;
  }

  return out;
}

function stringifyForInput(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  if (typeof value === "number") return String(value);
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10);
  return s;
}

export function courseRowToFormValues(
  row: Record<string, unknown>,
  fields: CourseEntityFormField[]
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (const f of fields) {
    const raw = row[f.name];
    if (f.type === "checkbox") {
      out[f.name] = raw === true || raw === 1 || raw === "1";
      continue;
    }
    if (f.type === "json") {
      out[f.name] =
        raw === null || raw === undefined
          ? ""
          : typeof raw === "string"
            ? raw
            : JSON.stringify(raw, null, 2);
      continue;
    }
    out[f.name] = stringifyForInput(raw);
  }
  return out;
}

/** Extra fields not listed in {@link COURSE_ENTITY_FORM_REGISTRY} field arrays (e.g. relation ids). */
export function getSerializeFieldsForSlug(slug: CourseEntitySlug): CourseEntityFormField[] {
  const def = COURSE_ENTITY_FORM_REGISTRY[slug];
  const extra: CourseEntityFormField[] = [];
  if (slug === "sub-categories") {
    extra.push({
      name: "main_category_id",
      label: "Main category",
      type: "number",
      required: true,
    });
    extra.push({ name: "status", label: "Status", type: "select", options: ACTIVE_INACTIVE });
  }
  return [...def.fields, ...extra];
}

export function courseRowToFormValuesForSlug(
  slug: CourseEntitySlug,
  row: Record<string, unknown>,
  fields: CourseEntityFormField[]
): Record<string, string | boolean> {
  const out = courseRowToFormValues(row, fields);
  if (slug === "sub-categories") {
    out.main_category_id = stringifyForInput(row.main_category_id);
    out.status = stringifyForInput(row.status);
  }
  return out;
}

export function serializeCourseEntityPayload(
  values: Record<string, string | boolean | File | null | undefined>,
  fields: CourseEntityFormField[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const f of fields) {
    const raw = values[f.name];

    if (raw instanceof File) {
      out[f.name] = raw;
      continue;
    }

    if (f.type === "checkbox") {
      out[f.name] = Boolean(raw);
      continue;
    }

    if (raw === "" || raw === undefined || raw === null) {
      continue;
    }

    if (f.type === "number") {
      const n = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isNaN(n)) out[f.name] = n;
      continue;
    }

    if (f.type === "json") {
      const s = String(raw).trim();
      if (!s) continue;
      try {
        out[f.name] = JSON.parse(s);
      } catch {
        out[f.name] = s;
      }
      continue;
    }

    out[f.name] = typeof raw === "boolean" ? raw : String(raw);
  }

  return out;
}

export function coursePermission(baseRead: string, action: "create" | "update" | "delete"): string {
  return baseRead.replace(/\.read$/, `.${action}`);
}
