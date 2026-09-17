import type { ReactNode } from "react";
import { SidebarApp } from "@/components/layout/sidebar-app";
import { HeaderApp } from "@/components/layout/header-app";
import { RodapeDisclaimer } from "@/components/layout/rodape-disclaimer";
import { TourProvider } from "@/components/tutorial/tour-provider";
import { TourOverlay } from "@/components/tutorial/tour-overlay";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <div className="flex min-h-full flex-1">
        <SidebarApp />
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderApp />
          <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
          <RodapeDisclaimer />
        </div>
      </div>
      <TourOverlay />
    </TourProvider>
  );
}
