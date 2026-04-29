import { useQueryApi } from "@/hooks";
import { RequestMethod } from "@/data/constants/methods";

export type MainCategoryOption = {
  id: number;
  title: string;
  status: string;
};

export type InstructorUserOption = {
  id: number;
  name: string;
  email: string;
  type: string;
};

export type CourseFormMetaData = {
  main_categories?: MainCategoryOption[];
  instructor_users?: InstructorUserOption[];
};

export function useCourseFormMeta(forKey: string | null) {
  return useQueryApi<CourseFormMetaData>({
    queryKey: ["course", "form-meta", forKey],
    url: "/course/form-meta",
    method: RequestMethod.GET,
    params: forKey ? { for: forKey } : {},
    options: {
      enabled: Boolean(forKey),
    },
  });
}
