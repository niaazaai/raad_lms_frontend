import {
  useCourseEntityList,
  getCourseListFromResponse,
  type CourseRow,
} from "../../hooks/useCourseEntity";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  Spinner,
} from "@/components/ui";

interface MainCategorySubCategoriesDrawerProps {
  open: boolean;
  onClose: () => void;
  mainCategoryId: number | null;
  mainCategoryTitle: string;
}

const MainCategorySubCategoriesDrawer = ({
  open,
  onClose,
  mainCategoryId,
  mainCategoryTitle,
}: MainCategorySubCategoriesDrawerProps) => {
  const { data, isFetching, error } = useCourseEntityList(
    "sub-categories",
    {
      main_category_id: mainCategoryId ?? undefined,
      page: 1,
      per_page: 100,
      sort_by: "title",
      sort_dir: "asc",
    },
    { enabled: open && mainCategoryId != null }
  );

  const rows = getCourseListFromResponse(data);

  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent side="right" className="w-full max-w-md min-w-0 sm:min-w-[380px]">
        <DrawerHeader>
          <DrawerTitle>Sub-categories</DrawerTitle>
          <DrawerDescription className="line-clamp-2">
            Under <span className="font-medium text-foreground">{mainCategoryTitle}</span>
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-3">
          {error ? (
            <p className="text-sm text-destructive">{(error as Error).message}</p>
          ) : isFetching ? (
            <div className="flex min-h-[160px] items-center justify-center py-8">
              <Spinner className="h-8 w-8 text-primary" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No sub-categories for this main category yet.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {rows.map((row: CourseRow) => {
                const id = row.id;
                const title =
                  typeof row.title === "string" && row.title.trim().length > 0
                    ? row.title.trim()
                    : "Untitled";
                return (
                  <li key={String(id)} className="px-4 py-3 text-sm font-medium text-foreground">
                    {title}
                  </li>
                );
              })}
            </ul>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default MainCategorySubCategoriesDrawer;
