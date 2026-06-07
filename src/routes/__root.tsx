import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, createRootRouteWithContext, useRouter,
  HeadContent, Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PlanProvider } from "../lib/plan-store";
import { MeetingModeProvider, useMeetingMode } from "../lib/meeting-mode";
import { AppSidebar } from "../components/AppSidebar";
import { Scoreboard } from "../components/Scoreboard";
import { TopBar } from "../components/TopBar";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold text-foreground">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">Página não encontrada.</p>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Voltar ao Resumo</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >Tentar novamente</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Legacy Executoria · Plano Comercial Junho 2026" },
      { name: "description", content: "Central de Comando Comercial — acompanhamento executivo do plano de ação comercial Legacy Executoria, Junho 2026." },
      { property: "og:title", content: "Legacy Executoria · Plano Comercial Junho 2026" },
      { name: "twitter:title", content: "Legacy Executoria · Plano Comercial Junho 2026" },
      { property: "og:description", content: "Central de Comando Comercial — acompanhamento executivo do plano de ação comercial Legacy Executoria, Junho 2026." },
      { name: "twitter:description", content: "Central de Comando Comercial — acompanhamento executivo do plano de ação comercial Legacy Executoria, Junho 2026." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8b36b7d2-4254-48db-8224-c40a8efc7ba8/id-preview-3a95cdac--79e168fd-b88a-41f3-b6ee-4951dc873466.lovable.app-1780511184113.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8b36b7d2-4254-48db-8224-c40a8efc7ba8/id-preview-3a95cdac--79e168fd-b88a-41f3-b6ee-4951dc873466.lovable.app-1780511184113.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function Shell() {
  const { meeting } = useMeetingMode();
  return (
    <div className="min-h-screen bg-background">
      {!meeting && <AppSidebar />}
      <main className={`${meeting ? "ml-0" : "md:ml-64"} min-h-screen flex flex-col`}>
        {!meeting && <TopBar />}
        <Scoreboard />
        <div className={`max-w-[1400px] mx-auto w-full px-6 ${meeting ? "md:px-16 py-10 md:py-14" : "md:px-10 py-8 md:py-12"}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <PlanProvider>
        <MeetingModeProvider>
          <Shell />
        </MeetingModeProvider>
      </PlanProvider>
    </QueryClientProvider>
  );
}
