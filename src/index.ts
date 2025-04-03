import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const NWS_API_BASE = "https://api.seniverse.com/v3/weather/daily.json";
// 填入在心知天气申请的API Key
const WeatherAPIKey = "";

// Create server instance
const server = new McpServer({
  name: "weather",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.tool(
  "get-forecast",
  "Get weather forecast for a location",
  {
    location: z.string().describe("Location name (e.g. '杭州')"),
  },
  async ({ location }) => {
    const requestUrl = `${NWS_API_BASE}?key=${WeatherAPIKey}&location=${location}&language=zh-Hans&unit=c&start=0&days=1`;
    console.log(requestUrl);
    // const resData = await makeNWSRequest<WeatherResp>(requestUrl);
    const res = await fetch(requestUrl);
    const resData = await res.json();

    if (!resData) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve ${location} weather data`,
          },
        ],
      };
    }

    const results = resData.results;

    if (!results) {
      return {
        content: [
          {
            type: "text",
            text: `Retrieved ${location} weather data error`,
          },
        ],
      };
    }

    const daily = results[0].daily[0];
    const forecast = `${location}${daily.date}天气：${daily.text_day} ${daily.low}°C ~ ${daily.high}°C`; 

    return {
      content: [
        {
          type: "text",
          text: forecast,
        },
      ],
    };
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
