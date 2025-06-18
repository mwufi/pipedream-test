import * as restate from "@restatedev/restate-sdk/fetch";
import helloService from "./helloService";
import enrichService from "./enrichService";
import { inboxSyncObject } from "./syncing/inboxService";

const services = restate
  .endpoint()
  .bind(helloService)
  .bind(enrichService)
  .bind(inboxSyncObject)
  .handler();

export function GET(request: Request) {
  return services.fetch(request);
}

export function POST(request: Request) {
  return services.fetch(request);
}
