import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 高德地图api key
const API_KEY = "";

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
    "根据给定的地址获取经纬度坐标",
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
    "根据起始点经纬度获取路径规划，返回规划的路径信息的描述和对应的规划路径的经纬度坐标集合，以便后续将路径规划绘制成图",
    {
        source: z.string().describe("Source's Coordinates (e.g. '116.397,39.909')"),
        destination: z.string().describe("Destination's Coordinates name (e.g. '116.397,39.909')"),
    },
    async ({ source, destination }: { source: string, destination: string }) => {
        const requestUrl = `https://restapi.amap.com/v5/direction/driving?origin=${source}&destination=${destination}&key=${API_KEY}&show_fields=polyline`;
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
                // 返回路径规划的路径信息包括文本和经纬度坐标集合
                content: [
                    {
                        type: "text",                        
                        text: `路径规划描述: \n${resData.route.paths[0].steps.map((step: any) => step.instruction).join("\n")}
                        ` 
                    }, 
                    {
                        type: "text",
                        text: `路径规划的经纬度坐标集合: \n${resData.route.paths[0].steps.map((step: any) => step.polyline).join("\n")}
                        `
                    }
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
    "接收路径规划的一系列路径点坐标数据，返回一张base64编码的路径绘图",
    {
        paths: z.string().describe("Route planning's paths data (e.g. '10,0x0000ff,1,,:116.31604,39.96491;116.320816,39.966606;116.321785,39.966827;116.32361,39.966957')"),
    },
    async ({ paths }: { paths: string}) => {
        const requestUrl = `https://restapi.amap.com/v3/staticmap?zoom=11&size=1024*800&paths=${paths}&key=${API_KEY}&scale=2`;
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
                    text: base64Image
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