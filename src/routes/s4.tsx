import { createFileRoute } from "@tanstack/react-router";
import { SprintPage } from "@/components/SprintPage";
export const Route = createFileRoute("/s4")({ head: () => ({ meta: [{ title: "Sprint 4 · Legacy" }] }), component: () => <SprintPage skey="S4" num={4} title="Sprint 4" /> });
