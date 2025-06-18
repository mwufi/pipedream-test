import * as restate from "@restatedev/restate-sdk/fetch";
import helloService from "./helloService";
import enrichService from "./enrichService";
import { gmailInboxObject } from "./syncing/inboxService";
import { googleCalendarObject } from "./syncing/calendarService";
import { googleContactsObject } from "./syncing/contactsService";
import { apiService } from "./apiService";
import { limiter } from "./ratelimit/limiter";

const services = restate
  .endpoint()
  .bind(helloService)
  .bind(enrichService)
  .bind(gmailInboxObject)
  .bind(googleCalendarObject)
  .bind(googleContactsObject)
  .bind(apiService)
  .bind(limiter)
  .handler();

export function GET(request: Request) {
  return services.fetch(request);
}

export function POST(request: Request) {
  return services.fetch(request);
}
