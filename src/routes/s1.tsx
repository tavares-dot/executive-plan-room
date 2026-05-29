import { createFileRoute } from "@tanstack/react-router";
import { SprintPage } from "@/components/SprintPage";
export const Route = createFileRoute("/s1")({ head: () => ({ meta: [{ title: "Sprint 1 · Legacy" }] }), component: () => <SprintPage skey="S1" num={1} title="Sprint 1" /> });
