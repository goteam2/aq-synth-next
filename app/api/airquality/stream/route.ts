import { NextRequest } from "next/server";
import { AirQualityFetcher } from "../fetcher";

const location =
  process.env.LOCATION_CITY && process.env.LOCATION_COUNTRY
    ? { city: process.env.LOCATION_CITY, country: process.env.LOCATION_COUNTRY }
    : { lat: process.env.LOCATION_LAT, lon: process.env.LOCATION_LON };
const pollInterval = process.env.POLL_INTERVAL
  ? parseInt(process.env.POLL_INTERVAL)
  : 300000;

const fetcher = new AirQualityFetcher(location, pollInterval);

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  let keepAliveTimer: NodeJS.Timeout | null = null;
  let pollTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      async function sendData() {
        try {
          const data = await fetcher.fetchData();
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                error: err.message,
              })}\n\n`
            )
          );
        }
      }
      // Initial send
      await sendData();
      // Polling
      pollTimer = setInterval(sendData, pollInterval);
      // Keep-alive
      keepAliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(`: keep-alive\n\n`));
      }, 25000);
    },
    cancel() {
      if (pollTimer) clearInterval(pollTimer);
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
