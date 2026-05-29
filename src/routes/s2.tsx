import { createFileRoute } from "@tanstack/react-router";
import { SprintPage } from "@/components/SprintPage";
export const Route = createFileRoute("/s2")({ head: () => ({ meta: [{ title: "Sprint 2 · Legacy" }] }), component: () => <SprintPage skey="S2" num={2} title="Sprint 2" /> });
