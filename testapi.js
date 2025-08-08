import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateAndSaveImage() {
  const prompt = "A 3D rendered image of a pig with wings and a top hat flying over a happy futuristic scifi city with lots of greenery.";

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp-image-generation",
    generationConfig: {
      responseModalities: ['Text', 'Image']
    },
  });

  try {
    console.log("Generating image...");
    const result = await model.generateContent(prompt);
    const response = result.response;

    if (!response || !response.candidates || response.candidates.length === 0) {
      console.error("Error: No candidates found in the response.");
      return;
    }

    const firstCandidate = response.candidates[0];
    if (!firstCandidate.content || !firstCandidate.content.parts) {
      console.error("Error: Candidate content is missing.");
      return;
    }

    let imageSaved = false;
    for (const part of firstCandidate.content.parts) {
      if (part.text) {
        console.log("Model response text:", part.text);
      } else if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, 'base64');
        const filename = 'gemini-native-image.png';
        fs.writeFileSync(filename, buffer);
        console.log(`Image saved as ${filename}`);
        imageSaved = true;
      }
    }

    if (!imageSaved) {
      console.log("No image data found in the response.");
    }
  } catch (error) {
    console.error("Error generating content:", error.message);
    if (error.response && error.response.statusText) {
      console.error("API Response Status:", error.response.statusText);
    }
  }
}

generateAndSaveImage();