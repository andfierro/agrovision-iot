import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, PlantStatus } from "./types";

// Initialize the Google GenAI client
// The API key is obtained from the environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We assume the model is available if the API key is configured.
export const isModelAvailable = async (): Promise<boolean> => {
  return !!process.env.API_KEY;
};

export const analyzePlantImage = async (base64Image: string): Promise<AnalysisResult> => {
  return new Promise(async (resolve) => {
    try {
      // Extract the raw base64 data and mime type from the data URL
      const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error("Invalid image format");
      }
      
      const mimeType = matches[1];
      const data = matches[2];

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          status: {
            type: Type.STRING,
            description: "Estado de salud de la planta. Debe ser 'Sana', 'Enferma' o 'Incierto'.",
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
            description: "Descripción detallada del diagnóstico y los síntomas visibles.",
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
              text: `Analiza esta imagen de una planta agrícola.
              Determina si está saludable ('Sana') o enferma ('Enferma').
              Si no puedes identificar una planta con certeza o la imagen es irrelevante, responde 'Incierto'.
              Proporciona el nombre de la enfermedad (si aplica), un porcentaje de confianza estimado, una descripción detallada en español y recomendaciones prácticas.`
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

      resolve({
        status: status,
        diseaseName: result.diseaseName || "Desconocido",
        confidence: result.confidence || 0,
        description: result.description || "Sin descripción disponible.",
        recommendations: result.recommendations || [],
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      resolve({
        status: PlantStatus.UNCERTAIN,
        diseaseName: "Error de Análisis",
        confidence: 0,
        description: "No se pudo realizar el análisis con el servicio de IA.",
        recommendations: ["Intentar nuevamente"],
        timestamp: new Date().toISOString(),
      });
    }
  });
};
