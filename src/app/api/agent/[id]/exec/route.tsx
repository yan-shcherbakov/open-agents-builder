// route.ts
import { NextRequest } from "next/server";
import { nanoid } from "nanoid";
import { getErrorMessage } from "@/lib/utils";

import ServerAgentRepository from "@/data/server/server-agent-repository";
import { Agent } from "@/data/client/models";
import { authorizeSaasContext } from "@/lib/generic-api";
import { authorizeRequestContext } from "@/lib/authorization-api";
import { createExecFlowTool } from "@/tools/execFlowTool";
import { ZodError } from "zod";


export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Basic checks
    const recordLocator = params.id; // The agent's ID from the URL
    const databaseIdHash = request.headers.get("Database-Id-Hash");
    const sessionId = request.headers.get("Agent-Session-Id") || nanoid();
    const agentId = recordLocator || request.headers.get("Agent-Id");

    if (!databaseIdHash || !agentId || !sessionId) {
      return new Response(
        JSON.stringify("The required HTTP headers: Database-Id-Hash, Agent-Session-Id and Agent-Id are missing."),
        { status: 400 }
      );
    }

    // Date/time info
    const currentDateTimeIso = request.headers.get("Current-Datetime-Iso") || new Date().toISOString();
    const currentLocalDateTime = request.headers.get("Current-Datetime") || new Date().toLocaleString();
    const currentTimezone = request.headers.get("Current-Timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Authorize SaaS context
    const saasContext = await authorizeSaasContext(request);
    if (saasContext.isSaasMode && !saasContext.hasAccess) {
      return new Response(JSON.stringify({ message: "Unauthorized", status: 403 }), { status: 403 });
    }

    // Load the agent from database
    const agentsRepo = new ServerAgentRepository(databaseIdHash);
    const dto = await agentsRepo.findOne({ id: recordLocator });
    if (!dto) {
      return new Response(JSON.stringify({ message: "Agent not found" }), { status: 404 });
    }
    const masterAgent = Agent.fromDTO(dto);

    // If agent is not published, require admin privileges
    if (!masterAgent.published) {
      try {
        await authorizeRequestContext(request);
      } catch {
        return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });
      }
    }

    // Parse request body
    const body = await request.json();
    const outputMode = body.outputMode ?? "stream";
    const execMode = body.execMode ?? "sync";

    // Base context (initially with streamingController = null)
    const baseContext = {
      masterAgent,
      databaseIdHash,
      saasContext,
      sessionId,
      agentId,
      currentDateTimeIso,
      currentLocalDateTime,
      currentTimezone,
      streamingController: null as ReadableStreamDefaultController<any> | null,
    };

    // If user wants stream (and it's sync mode), we create a ReadableStream
    if (outputMode === "stream" && execMode === "sync") {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Create the tool with a streaming controller
            const { tool: execFlowTool } = createExecFlowTool({
              ...baseContext,
              streamingController: controller,
            });

            // Execute the tool with the parsed body
            await execFlowTool.execute(body, {
                messages: [],
                toolCallId: nanoid(), 
            });
          } catch (err) {
            console.error(err);

            let errorChunk = errorFormat(err);

            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify(errorChunk) + "\n"
              )
            );
          } finally {
            // Make sure to close the stream
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Transfer-Encoding": "chunked",
        },
      });
    } else {
      // buffer or async mode - no streaming
      const { tool: execFlowTool } = createExecFlowTool(baseContext);
      const result = await execFlowTool.execute(body, {
        messages: [],
        toolCallId: nanoid(), 
    });
      return new Response(JSON.stringify(result), { status: 200 });
    }
  } catch (error) {
    console.error(error);
    let errorChunk = errorFormat(error);
    return new Response(JSON.stringify(errorChunk), {
      status: 499,
    });
  }
}
function errorFormat(err: unknown) {
  let errorChunk = { type: "error", message: getErrorMessage(err) };

  if (err instanceof ZodError) {
    errorChunk = {
      type: "error",
      ...err
    };
  }
  return errorChunk;
}

