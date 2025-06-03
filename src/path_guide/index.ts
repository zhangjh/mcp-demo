import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 高德地图api key
const API_KEY = "f202f79feaa1f513d69720ff654ec33a";

// Create server instance
const server = new McpServer({
    name: "get lating and longitude by address",
    version: "1.0.0",
    capabilities: {
        resources: {},
        tools: {},
    },
});

server.tool(
    "(获取经纬度)get-lating-and-longitude",
    "(根据给定的地址获取经纬度坐标)Get lating and longitude by address",
    {
        address: z.string().describe("Address name (e.g. '杭州')"),
    },
    async ({ address }: { address: string }) => {
        const requestUrl = `https://restapi.amap.com/v3/geocode/geo?key=${API_KEY}&address=${address}`;
        console.log(requestUrl);
        const res = await fetch(requestUrl);
        const resData = await res.json();
        if (!resData) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve ${address} lating and longitude`,
                    },
                ],
            };
        }
        if (resData.status === "1") {
            return {
                content: [
                    {
                        type: "text",
                        text: `${address} lating and longitude is ${resData.geocodes[0].location}`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve ${address} lating and longitude`,
                },
            ],
        };
    }
);

server.tool(
    "(路径规划)Route planning",
    "Make a route plan by coordinates (start point and target point)",
    {
        source: z.string().describe("Source's Coordinates (e.g. '116.397,39.909')"),
        destination: z.string().describe("Destination's Coordinates name (e.g. '116.397,39.909')"),
    },
    async ({ source, destination }: { source: string, destination: string }) => {
        const requestUrl = `https://restapi.amap.com/v5/direction/driving?origin=${source}&destination=${destination}&key=${API_KEY}`;
        console.log(requestUrl);
        const res = await fetch(requestUrl);
        const resData = await res.json();
        if (!resData) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve ${source} and ${destination} route plan`,
                    },
                ],
            };
        }
        if (resData.status === "1") {
            return {
                content: [
                    {
                        type: "text",
                        text: `route plan is: \n` 
                        + resData.route.paths[0].steps.map((step: any) => step.instruction).join("\n"),
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to retrieve ${source} and ${destination} route plan`,
                },
            ],
        };
});

server.tool(
    "(路径绘图)Draw route using paths",
    "(路径绘图)Draw route using paths",
    {
        paths: z.string().describe("Route planning's paths data (e.g. '10,0x0000ff,1,,:116.31604,39.96491;116.320816,39.966606;116.321785,39.966827;116.32361,39.966957')"),
    },
    async ({ paths }: { paths: string}) => {
        const requestUrl = `https://restapi.amap.com/v3/staticmap?zoom=15&size=500*500&paths=${paths}&key=${API_KEY}`;
        console.log(requestUrl);
        const res = await fetch(requestUrl);
        if (!res) {
            return {
                content: [
                    {
                        type: "text",
                        text: `Failed to retrieve ${paths} route plan`,
                    },
                ],
            };
        }
        const arrayBuffer = await res.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString("base64");
    
        return {
            // 返回base64编码的图片
            content: [
                {
                    type: "text",
                    text: "data:image/png;base64," + base64Image
                },
            ],
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("GetLatin&Long MCP Server running on stdio");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});