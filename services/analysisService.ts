import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PlantStatus, SensorData } from "../types";

// Initialize the Google GenAI client
// The API key is obtained from the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Check if the API Key is available
export const isModelAvailable = async (): Promise<boolean> => {
  return !!process.env.API_KEY;
};

export const analyzePlantImage = async (base64Image: string, sensorData?: SensorData): Promise<AnalysisResult> => {
  try {
    // Extract the raw base64 data and mime type from the data URL
    const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid image format");
    }
    
    const mimeType = matches[1];
    const data = matches[2];

    // Construct the prompt with sensor data context
    let promptText = `Analiza esta imagen de una planta agrícola.
    Determina si está saludable ('Sana') o enferma ('Enferma').
    Si no puedes identificar una planta con certeza o la imagen es irrelevante, responde 'Incierto'.
    Proporciona el nombre de la enfermedad (si aplica), un porcentaje de confianza estimado (0-100), una descripción detallada en español y recomendaciones prácticas.`;

    if (sensorData) {
      promptText += `\n\nDatos de sensores en tiempo real (considerar para el diagnóstico):
      - Temperatura: ${sensorData.temperature.toFixed(1)}°C
      - Humedad del aire: ${sensorData.humidity.toFixed(1)}%
      - Humedad del suelo: ${sensorData.soilMoisture.toFixed(1)}%
      - Nivel de luz: ${sensorData.lightLevel.toFixed(0)} lx
      
      Si los valores de los sensores son extremos o propicios para ciertas enfermedades, menciónalo en la descripción.`;
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          enum: ["Sana", "Enferma", "Incierto"],
          description: "Estado de salud de la planta.",
        },
        diseaseName: {
          type: Type.STRING,
          description: "Nombre de la enfermedad identificada o 'Planta Sana'.",
        },
        confidence: {
          type: Type.NUMBER,
          description: "Nivel de confianza del diagnóstico (0 a 100).",
        },
        description: {
          type: Type.STRING,
          description: "Descripción detallada del diagnóstico, síntomas visibles y análisis de sensores.",
        },
        recommendations: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Lista de recomendaciones de tratamiento o cuidado.",
        },
      },
      required: ["status", "diseaseName", "confidence", "description", "recommendations"],
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data,
            },
          },
          {
            text: promptText
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Respuesta vacía de Gemini");

    const result = JSON.parse(text);

    let status = PlantStatus.UNCERTAIN;
    if (result.status === 'Sana') status = PlantStatus.HEALTHY;
    else if (result.status === 'Enferma') status = PlantStatus.DISEASED;

    return {
      status: status,
      diseaseName: result.diseaseName || "Desconocido",
      confidence: result.confidence || 0,
      description: result.description || "Sin descripción disponible.",
      recommendations: result.recommendations || [],
      timestamp: new Date().toISOString(),
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      status: PlantStatus.UNCERTAIN,
      diseaseName: "Error de Análisis",
      confidence: 0,
      description: "No se pudo realizar el análisis con el servicio de IA. Verifique su conexión y API Key.",
      recommendations: ["Intentar nuevamente"],
      timestamp: new Date().toISOString(),
    };
  }
};