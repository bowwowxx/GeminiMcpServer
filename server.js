import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from "zod";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const server = new McpServer({
  name: "ImageGenerationServer",
  version: "1.0.0",
  description: "Server for generating images using Gemini API with Imagen 3"
});


server.tool(
  "generateImage",
  {
    prompt: z.string(),
    aspectRatio: z.string().optional(),
    outputFormat: z.string().optional()
  },
  async (params) => {
    const prompt = params.prompt || "rendered image of fly pig";
    const outputFormat = params.outputFormat || "png";

    try {
      // Initialize gemini-2.0-flash-exp-image-generation model
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
        generationConfig: {
            responseModalities: ['Text', 'Image'],
        },
      });

      // Generate the image
      const result = await model.generateContent(prompt);
      for (const part of result.response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          return {
            content: [{
              type: "image",
              data: imageData,
              mimeType: `image/${outputFormat}`
            }]
          };
        }
      }
    } catch (error) {
      console.error("Image generation error:", error);
      return {
        content: [{
          type: "text",
          text: `Error generating image: ${error.message}`
        }]
      };
    }
  },
  {
    description: "Generate an image using Gemini API",
    parameters: {
      prompt: { type: "string", description: "The text description of the image to generate" },
      aspectRatio: { type: "string", description: "Aspect ratio of the image (e.g., '1:1', '16:9')", optional: true },
      outputFormat: { type: "string", description: "Output image format ('png' or 'jpeg')", optional: true }
    }
  }
);

// Start the server
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("MCP Image Generation Server is running...");
    console.log("Use the 'generateImage' tool with parameters: prompt, aspectRatio, outputFormat");
  } catch (error) {
    console.error("Server startup error:", error);
  }
}

startServer();