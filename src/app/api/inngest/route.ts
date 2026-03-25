import { serve } from "inngest/next";
import { inngest, processJob } from "@/lib/inngest";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processJob],
});
