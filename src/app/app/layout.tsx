import type { ReactNode } from "react";
import { SidebarApp } from "@/components/layout/sidebar-app";
import { HeaderApp } from "@/components/layout/header-app";
import { RodapeDisclaimer } from "@/components/layout/rodape-disclaimer";
import { GuardiaSessao } from "@/components/layout/guardia-sessao";
import { TourProvider } from "@/components/tutorial/tour-provider";
import { FabAjuda } from "@/components/ajuda/fab-ajuda";
import { HidratacaoEvidencias } from "@/components/evidencias/hidratacao-evidencias";
import { TourOverlay } from "@/components/tutorial/tour-overlay";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TourProvider>
      <HidratacaoEvidencias />
      <div className="flex min-h-full flex-1">
        <SidebarApp />
        <div className="flex min-w-0 flex-1 flex-col">
          <HeaderApp />
          <main className="flex-1 px-4 py-6 md:px-6">
            <GuardiaSessao>{children}</GuardiaSessao>
          </main>
          <div className="[&>footer]:pr-20 md:[&>footer]:pr-24">
            <RodapeDisclaimer />
          </div>
        </div>
      </div>
      <TourOverlay />
      <FabAjuda />
    </TourProvider>
  );
}
