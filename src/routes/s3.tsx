import { createFileRoute } from "@tanstack/react-router";
import { SprintPage } from "@/components/SprintPage";
export const Route = createFileRoute("/s3")({ head: () => ({ meta: [{ title: "Sprint 3 · Legacy" }] }), component: () => <SprintPage skey="S3" num={3} title="Sprint 3" /> });
