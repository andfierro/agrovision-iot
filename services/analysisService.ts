import * as tf from '@tensorflow/tfjs';
import { AnalysisResult, PlantStatus, SensorData } from "../types";

// =========================================================
// 1. FUNCIÓN para generar la URL correcta en GitHub Pages
// =========================================================
const getModelUrl = () => {
  const loc = window.location;
  
  // Obtenemos la ruta base (ej: /agrovision-tesis/)
  let pathName = loc.pathname;
  
  // Si la URL termina en index.html, lo quitamos para obtener el directorio
  if (pathName.endsWith('index.html')) {
    pathName = pathName.substring(0, pathName.lastIndexOf('index.html'));
  }
  
  // Aseguramos que termine en '/'
  if (!pathName.endsWith('/')) {
     pathName += '/';
  }

  // Construimos la ruta absoluta al modelo
  // Esto genera algo como: https://usuario.github.io/repo/model/model.json
  const fullUrl = `${loc.origin}${pathName}model/model.json`;
  return fullUrl;
};

const IMAGE_SIZE = 224;

// BASE DE CONOCIMIENTO (38 Clases de PlantVillage)
const KNOWLEDGE_BASE: Record<number, any> = {
  0: { status: PlantStatus.DISEASED, name: "Manzana: Sarna (Apple Scab)", description: "Hongo Venturia inaequalis. Manchas verde oliva.", recommendations: ["Fungicidas preventivos", "Recoger hojas caídas", "Poda de ventilación"] },
  1: { status: PlantStatus.DISEASED, name: "Manzana: Podredumbre Negra", description: "Hongo Botryosphaeria obtusa.", recommendations: ["Eliminar frutos momificados", "Aplicar Captan", "Sanidad del huerto"] },
  2: { status: PlantStatus.DISEASED, name: "Manzana: Roya del Cedro", description: "Manchas amarillo-naranja brillantes.", recommendations: ["Eliminar enebros cercanos", "Fungicidas específicos"] },
  3: { status: PlantStatus.HEALTHY, name: "Manzana: Sana", description: "Hoja vigorosa sin signos de patógenos.", recommendations: ["Mantenimiento estándar", "Riego regular"] },
  4: { status: PlantStatus.HEALTHY, name: "Arándano: Sano", description: "Follaje sano.", recommendations: ["Mantener pH ácido (4.5-5.5)", "Mulching"] },
  5: { status: PlantStatus.DISEASED, name: "Cereza: Oídio", description: "Polvo blanco harinoso en las hojas.", recommendations: ["Fungicidas con azufre", "Poda para aumentar luz"] },
  6: { status: PlantStatus.HEALTHY, name: "Cereza: Sana", description: "Planta libre de estrés.", recommendations: ["Fertilización equilibrada"] },
  7: { status: PlantStatus.DISEASED, name: "Maíz: Mancha Gris", description: "Lesiones rectangulares grises.", recommendations: ["Rotación de cultivos", "Híbridos resistentes"] },
  8: { status: PlantStatus.DISEASED, name: "Maíz: Roya Común", description: "Pústulas ovaladas color canela.", recommendations: ["Monitoreo constante", "Fungicidas si es severo"] },
  9: { status: PlantStatus.DISEASED, name: "Maíz: Tizón Foliar Norteño", description: "Lesiones largas elípticas grisáceas.", recommendations: ["Manejo de residuos", "Rotación con soja"] },
  10: { status: PlantStatus.HEALTHY, name: "Maíz: Sano", description: "Cultivo en buen estado.", recommendations: ["Nitrógeno adecuado"] },
  11: { status: PlantStatus.DISEASED, name: "Uva: Podredumbre Negra", description: "Manchas marrones circulares.", recommendations: ["Programa de fungicidas", "Eliminar tejidos infectados"] },
  12: { status: PlantStatus.DISEASED, name: "Uva: Esca", description: "Rayas oscuras entre las venas.", recommendations: ["Proteger heridas de poda", "Retirar cepas muertas"] },
  13: { status: PlantStatus.DISEASED, name: "Uva: Tizón de la Hoja", description: "Manchas irregulares oscuras.", recommendations: ["Fungicidas foliares", "Control de humedad"] },
  14: { status: PlantStatus.HEALTHY, name: "Uva: Sana", description: "Vid saludable.", recommendations: ["Control de canopia"] },
  15: { status: PlantStatus.DISEASED, name: "Naranja: Huanglongbing (HLB)", description: "Moteado asimétrico y amarillamiento.", recommendations: ["Controlar psílido vector", "Nutrición foliar"] },
  16: { status: PlantStatus.DISEASED, name: "Durazno: Mancha Bacteriana", description: "Pequeñas manchas angulares.", recommendations: ["Bactericidas de cobre", "Variedades resistentes"] },
  17: { status: PlantStatus.HEALTHY, name: "Durazno: Sano", description: "Árbol sano.", recommendations: ["Poda de fructificación"] },
  18: { status: PlantStatus.DISEASED, name: "Pimiento: Mancha Bacteriana", description: "Lesiones acuosas necróticas.", recommendations: ["Semillas sanas", "Cobre"] },
  19: { status: PlantStatus.HEALTHY, name: "Pimiento: Sano", description: "Planta vigorosa.", recommendations: ["Tutorado", "Riego constante"] },
  20: { status: PlantStatus.DISEASED, name: "Papa: Tizón Temprano", description: "Manchas con anillos concéntricos.", recommendations: ["Fungicidas protectores", "Evitar estrés hídrico"] },
  21: { status: PlantStatus.DISEASED, name: "Papa: Tizón Tardío", description: "Manchas grandes acuosas y oscuras.", recommendations: ["Fungicidas sistémicos urgentes", "Destruir follaje infectado"] },
  22: { status: PlantStatus.HEALTHY, name: "Papa: Sana", description: "Cultivo sano.", recommendations: ["Aporque"] },
  23: { status: PlantStatus.HEALTHY, name: "Frambuesa: Sana", description: "Planta sana.", recommendations: ["Poda de cañas viejas"] },
  24: { status: PlantStatus.HEALTHY, name: "Soja: Sana", description: "Cultivo sin daños.", recommendations: ["Monitoreo de insectos"] },
  25: { status: PlantStatus.DISEASED, name: "Calabaza: Oídio", description: "Polvo blanco en hojas.", recommendations: ["Azufre", "Espaciamiento para aireación"] },
  26: { status: PlantStatus.DISEASED, name: "Fresa: Quemadura", description: "Manchas púrpuras irregulares.", recommendations: ["Limpieza sanitaria", "Fungicidas"] },
  27: { status: PlantStatus.HEALTHY, name: "Fresa: Sana", description: "Planta saludable.", recommendations: ["Riego por goteo"] },
  28: { status: PlantStatus.DISEASED, name: "Tomate: Mancha Bacteriana", description: "Puntos negros con halo amarillo.", recommendations: ["Cobre + Mancozeb", "Evitar aspersión"] },
  29: { status: PlantStatus.DISEASED, name: "Tomate: Tizón Temprano", description: "Manchas marrones con anillos concéntricos.", recommendations: ["Poda de hojas bajas", "Mulching"] },
  30: { status: PlantStatus.DISEASED, name: "Tomate: Tizón Tardío", description: "Manchas irregulares verdosas/oscuras.", recommendations: ["Aplicación inmediata de fungicida", "Ventilación"] },
  31: { status: PlantStatus.DISEASED, name: "Tomate: Moho de la Hoja", description: "Manchas amarillas, moho en envés.", recommendations: ["Reducir humedad", "Ventilación"] },
  32: { status: PlantStatus.DISEASED, name: "Tomate: Septoria", description: "Manchas pequeñas circulares.", recommendations: ["Eliminar hojas afectadas", "Rotación"] },
  33: { status: PlantStatus.DISEASED, name: "Tomate: Araña Roja", description: "Punteado amarillo fino.", recommendations: ["Acaricidas", "Jabón potásico"] },
  34: { status: PlantStatus.DISEASED, name: "Tomate: Mancha Objetivo", description: "Lesiones grandes con anillos.", recommendations: ["Mejorar circulación de aire", "Fungicidas"] },
  35: { status: PlantStatus.DISEASED, name: "Tomate: Virus TYLCV", description: "Hojas amarillas y curvadas.", recommendations: ["Control de mosca blanca", "Eliminar plantas"] },
  36: { status: PlantStatus.DISEASED, name: "Tomate: Virus del Mosaico", description: "Patrón de mosaico verde.", recommendations: ["Desinfección de herramientas", "Eliminar plantas"] },
  37: { status: PlantStatus.HEALTHY, name: "Tomate: Sano", description: "Planta vigorosa.", recommendations: ["Fertirrigación"] },
};

let model: tf.LayersModel | null = null;

// Verifica si el archivo del modelo es accesible vía HTTP
export const isModelAvailable = async (): Promise<boolean> => {
  try {
    const url = getModelUrl();
    console.log("Verificando modelo en:", url);
    // Usamos fetch HEAD para no descargar todo el archivo, solo comprobar si existe
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok || res.status === 0; 
  } catch (e) {
    console.warn("No se pudo conectar con el modelo:", e);
    return false;
  }
};

const loadModel = async () => {
  if (model) return model;
  try {
    const url = getModelUrl();
    console.log("Cargando modelo desde:", url);
    
    // Inicializamos TensorFlow
    await tf.ready();
    
    // Cargamos el modelo
    model = await tf.loadLayersModel(url);
    console.log("Modelo cargado exitosamente.");
    return model;
  } catch (error) {
    console.error("Error cargando modelo:", error);
    return null;
  }
};

// Función auxiliar para integrar datos de IoT en las recomendaciones
const enrichWithSensorData = (recommendations: string[], sensorData?: SensorData): string[] => {
  if (!sensorData) return recommendations;
  
  const newRecs = [...recommendations];
  
  // Lógica difusa simple para alertas
  if (sensorData.humidity > 80) {
    newRecs.unshift("⚠️ ALERTA IOT: Humedad > 80%. Alto riesgo de hongos.");
  }
  if (sensorData.temperature > 30) {
    newRecs.push("⚠️ ALERTA IOT: Temperatura alta. Verificar riego.");
  }
  
  return newRecs;
};

export const analyzePlantImage = async (base64Image: string, sensorData?: SensorData): Promise<AnalysisResult> => {
  return new Promise(async (resolve) => {
    try {
      const img = new Image();
      img.src = base64Image;
      img.crossOrigin = 'anonymous';

      img.onload = async () => {
        try {
          const loadedModel = await loadModel();
          if (!loadedModel) {
             throw new Error("El modelo no está disponible. Verifique la carpeta /model.");
          }

          // Preprocesamiento de la imagen para la red neuronal
          const predictionResult = tf.tidy(() => {
            let tensor = tf.browser.fromPixels(img);
            tensor = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);
            tensor = tensor.div(255.0); // Normalización [0, 1]
            const batch = tensor.expandDims(0); // [1, 224, 224, 3]
            return loadedModel.predict(batch) as tf.Tensor;
          });

          // Obtener datos
          const data = await predictionResult.data();
          predictionResult.dispose(); // Liberar memoria GPU

          // Encontrar la clase con mayor probabilidad
          const probabilities = Array.from(data) as number[];
          const maxProbability = Math.max(...probabilities);
          const predictionIndex = probabilities.indexOf(maxProbability);
          
          // Mapear índice a nombre de enfermedad
          const rawDiagnosis = KNOWLEDGE_BASE[predictionIndex] || {
            status: PlantStatus.UNCERTAIN,
            name: "Desconocido",
            description: "No se pudo clasificar la imagen con certeza.",
            recommendations: ["Consultar a un especialista"]
          };

          // Mezclar con datos de sensores
          const finalRecommendations = enrichWithSensorData(rawDiagnosis.recommendations, sensorData);

          resolve({
            status: rawDiagnosis.status,
            diseaseName: rawDiagnosis.name,
            confidence: Math.round(maxProbability * 100),
            description: rawDiagnosis.description,
            recommendations: finalRecommendations,
            timestamp: new Date().toISOString(),
          });

        } catch (error: any) {
          console.error(error);
          resolve({
            status: PlantStatus.UNCERTAIN,
            diseaseName: "Error Técnico",
            confidence: 0,
            description: "Fallo al ejecutar el modelo neuronal en el navegador.",
            recommendations: ["Recargar página", "Verificar conexión a internet (librerías)"],
            timestamp: new Date().toISOString(),
          });
        }
      };
      
      img.onerror = () => resolve({
          status: PlantStatus.UNCERTAIN,
          diseaseName: "Error de Imagen",
          confidence: 0,
          description: "No se pudo leer la imagen.",
          recommendations: [],
          timestamp: new Date().toISOString()
      });

    } catch (e) {
      resolve({
        status: PlantStatus.UNCERTAIN,
        diseaseName: "Error Crítico",
        confidence: 0,
        description: "Error inesperado en la aplicación.",
        recommendations: [],
        timestamp: new Date().toISOString(),
      });
    }
  });
};