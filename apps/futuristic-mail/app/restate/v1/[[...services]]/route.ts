import * as restate from "@restatedev/restate-sdk/fetch";
import helloService, { helloWorkflow } from "../../../../restate-services/helloService";
import enrichService from "../../../../restate-services/enrichService";
import { apiService } from "../../../../restate-services/apiService";
import { limiter } from "../../../../restate-services/ratelimit/limiter";

const services = restate
  .endpoint()
  .bind(helloService)
  .bind(enrichService)
  .bind(apiService)
  .bind(limiter)
  .bind(helloWorkflow)
  .handler();

export function GET(request: Request) {
  return services.fetch(request);
}

export function POST(request: Request) {
  return services.fetch(request);
}
