import { Outlet } from "react-router-dom";
import { useLayoutStore } from "@/store";
import { cn } from "@/lib/utils";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";

const MainLayout = () => {
  const { sidebarCollapsed } = useLayoutStore();

  return (
    <div className="flex min-h-screen bg-layout-body">
      <Sidebar />

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300",
          sidebarCollapsed ? "lg:ml-[4.25rem]" : "lg:ml-52"
        )}
      >
        <Header />

        <main className="flex-1 p-4 pt-20 lg:p-6 lg:pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
