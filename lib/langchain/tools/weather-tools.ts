import * as z from "zod";
import { tool } from "langchain";
export const getWeather = tool(({ location }) => `Weather in ${location}: Sunny, 72°F`, {
  name: "get_weather",
  description: "Get weather information for a location",
  schema: z.object({
    location: z.string().describe("The location to get weather for"),
  }),
});
