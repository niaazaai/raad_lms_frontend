import type { ComponentType, SVGProps } from "react";
import {
  BookStack,
  Book,
  Page,
  GraduationCap,
  Play,
  EditPencil,
  Download,
  ClipboardCheck,
  Wallet,
  CreditCard,
  Cash,
  Calendar,
  Group,
  GridPlus,
  Hat,
} from "iconoir-react";
import type { CourseEntitySlug } from "./courseRegistry";

type Ico = ComponentType<SVGProps<SVGSVGElement>>;

const iconClass = "h-[18px] w-[18px] shrink-0 stroke-[1.5]";

const ENTITY_ICON: Record<CourseEntitySlug, Ico> = {
  "main-categories": BookStack,
  "sub-categories": Book,
  "course-faasls": Page,
  courses: GraduationCap,
  lessons: Play,
  assignments: EditPencil,
  "downloadable-resources": Download,
  "quiz-files": ClipboardCheck,
  "student-discounts": Wallet,
  "subscription-plans": CreditCard,
  "student-subscriptions": Cash,
  instructors: Hat,
  "lms-classes": Calendar,
  "lms-class-students": Group,
};

export function CourseOverviewIcon(props: SVGProps<SVGSVGElement>) {
  return <GridPlus className={iconClass} {...props} />;
}

export function CourseEntitySidebarIcon({
  slug,
  ...rest
}: { slug: CourseEntitySlug } & SVGProps<SVGSVGElement>) {
  const Cmp = ENTITY_ICON[slug];
  return <Cmp className={iconClass} {...rest} />;
}
