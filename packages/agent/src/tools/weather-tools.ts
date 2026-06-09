import * as z from "zod";
import { tool } from "langchain";

export const getGeocoding = tool(
  async ({ city }) => {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json&utm_source=chatgpt.com`,
    );
    const data = await res.json();
    return data;
  },
  {
    name: "get_heocoding",
    description: "Get city Geocoding information for city,如果传入city是中文先转换拼音再传入",
    schema: z.object({
      city: z.string().describe("The city to get weather for"),
    }),
  },
);

export const getWeather = tool(
  async ({ latitude, longitude }) => {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m`,
    );
    const data = await res.json();
    return data;
  },
  {
    name: "get_weather",
    description: "Get weather information for location and latitude",
    schema: z.object({
      latitude: z.number().describe("The latitude to get weather for"),
      longitude: z.number().describe("The longitude to get weather for"),
    }),
  },
);
