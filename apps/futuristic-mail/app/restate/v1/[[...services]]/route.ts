import * as restate from "@restatedev/restate-sdk/fetch";
import helloService from "./helloService";

const services = restate
  .endpoint()
  .bind(helloService)
  .handler();

export function GET(request: Request) {
  return services.fetch(request);
}

export function POST(request: Request) {
  return services.fetch(request);
}
