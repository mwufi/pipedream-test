import * as restate from "@restatedev/restate-sdk/fetch";
import helloService from "./helloService";
import enrichService from "./enrichService";
import { inboxSyncObject } from "./syncing/inboxService";
import { calendarSyncObject } from "./syncing/calendarService";
import { contactsSyncObject } from "./syncing/contactsService";
import { apiService } from "./apiService";
import { limiter } from "./ratelimit/limiter";

const services = restate
  .endpoint()
  .bind(helloService)
  .bind(enrichService)
  .bind(inboxSyncObject)
  .bind(calendarSyncObject)
  .bind(contactsSyncObject)
  .bind(apiService)
  .bind(limiter)
  .handler();

export function GET(request: Request) {
  return services.fetch(request);
}

export function POST(request: Request) {
  return services.fetch(request);
}
