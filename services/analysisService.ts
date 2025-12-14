import * as tf from '@tensorflow/tfjs';
import { AnalysisResult, PlantStatus, SensorData } from "../types";

// =========================================================
// 1. FUNCIÓN getModelUrl (Solución para GitHub Pages)
// =========================================================
const getModelUrl = () => {
  const loc = window.location;
  
  // Obtenemos la ruta base (ej: /nombre-repo/)
  let pathName = loc.pathname;
  
  // Si la URL termina en index.html, lo quitamos
  if (pathName.endsWith('index.html')) {
    pathName = pathName.substring(0, pathName.lastIndexOf('index.html'));
  }
  
  // Aseguramos que termine en '/'
  if (!pathName.endsWith('/')) {
     pathName += '/';
  }

  // Construimos la ruta absoluta
  // Local: http://localhost:xxxx/model/model.json
  // GitHub: https://usuario.github.io/repo/model/model.json
  return `${loc.origin}${pathName}model/model.json`;
};

const IMAGE_SIZE = 224;

// BASE DE CONOCIMIENTO (38 Clases PlantVillage)
const KNOWLEDGE_BASE: Record<number, any> = {
  0: { status: PlantStatus.DISEASED, name: "Manzana: Sarna (Apple Scab)", description: "Hongo Venturia inaequalis. Manchas verde oliva o negras aterciopeladas.", recommendations: ["Fungicidas preventivos", "Recoger hojas caídas", "Poda de ventilación"] },
  1: { status: PlantStatus.DISEASED, name: "Manzana: Podredumbre Negra", description: "Hongo Botryosphaeria obtusa. Manchas en forma de ojo de rana.", recommendations: ["Eliminar frutos momificados", "Aplicar Captan", "Sanidad del huerto"] },
  2: { status: PlantStatus.DISEASED, name: "Manzana: Roya del Cedro", description: "Manchas amarillo-naranja brillantes en el haz de la hoja.", recommendations: ["Eliminar enebros cercanos", "Fungicidas específicos", "Variedades resistentes"] },
  3: { status: PlantStatus.HEALTHY, name: "Manzana: Sana", description: "Hoja vigorosa sin signos de patógenos.", recommendations: ["Mantenimiento estándar", "Riego regular"] },
  4: { status: PlantStatus.HEALTHY, name: "Arándano: Sano", description: "Follaje sano.", recommendations: ["Mantener pH ácido (4.5-5.5)", "Mulching"] },
  5: { status: PlantStatus.DISEASED, name: "Cereza: Oídio", description: "Polvo blanco harinoso en las hojas.", recommendations: ["Fungicidas con azufre", "Poda para aumentar luz"] },
  6: { status: PlantStatus.HEALTHY, name: "Cereza: Sana", description: "Planta libre de estrés.", recommendations: ["Fertilización equilibrada"] },
  7: { status: PlantStatus.DISEASED, name: "Maíz: Mancha Gris (Cercospora)", description: "Lesiones rectangulares grises delimitadas por las nervaduras.", recommendations: ["Rotación de cultivos", "Híbridos resistentes", "Fungicidas"] },
  8: { status: PlantStatus.DISEASED, name: "Maíz: Roya Común", description: "Pústulas ovaladas color canela en ambas superficies.", recommendations: ["Monitoreo", "Aplicación de fungicidas si es severo"] },
  9: { status: PlantStatus.DISEASED, name: "Maíz: Tizón Foliar Norteño", description: "Lesiones largas elípticas grisáceas.", recommendations: ["Manejo de residuos", "Rotación con soja"] },
  10: { status: PlantStatus.HEALTHY, name: "Maíz: Sano", description: "Cultivo en buen estado.", recommendations: ["Nitrógeno adecuado"] },
  11: { status: PlantStatus.DISEASED, name: "Uva: Podredumbre Negra", description: "Manchas marrones circulares con borde oscuro.", recommendations: ["Programa de fungicidas", "Eliminar tejidos infectados"] },
  12: { status: PlantStatus.DISEASED, name: "Uva: Esca (Sarampión Negro)", description: "Rayas oscuras entre las venas (patrón de tigre).", recommendations: ["Proteger heridas de poda", "Retirar cepas muertas"] },
  13: { status: PlantStatus.DISEASED, name: "Uva: Tizón de la Hoja", description: "Manchas irregulares oscuras.", recommendations: ["Fungicidas foliares", "Control de humedad"] },
  14: { status: PlantStatus.HEALTHY, name: "Uva: Sana", description: "Vid saludable.", recommendations: ["Control de canopia"] },
  15: { status: PlantStatus.DISEASED, name: "Naranja: Huanglongbing (HLB)", description: "Enverdecimiento de los cítricos. Moteado asimétrico y amarillamiento.", recommendations: ["Controlar el psílido vector", "Nutrición foliar", "Erradicar árbol si es positivo"] },
  16: { status: PlantStatus.DISEASED, name: "Durazno: Mancha Bacteriana", description: "Pequeñas manchas angulares y caída de hojas.", recommendations: ["Bactericidas de cobre", "Variedades resistentes"] },
  17: { status: PlantStatus.HEALTHY, name: "Durazno: Sano", description: "Árbol sano.", recommendations: ["Poda de fructificación"] },
  18: { status: PlantStatus.DISEASED, name: "Pimiento: Mancha Bacteriana", description: "Lesiones acuosas que se vuelven necróticas.", recommendations: ["Semillas sanas", "Rotación de cultivos", "Cobre"] },
  19: { status: PlantStatus.HEALTHY, name: "Pimiento: Sano", description: "Planta vigorosa.", recommendations: ["Tutorado", "Riego constante"] },
  20: { status: PlantStatus.DISEASED, name: "Papa: Tizón Temprano", description: "Manchas con anillos concéntricos (diana).", recommendations: ["Fungicidas protectores", "Evitar estrés hídrico"] },
  21: { status: PlantStatus.DISEASED, name: "Papa: Tizón Tardío", description: "Manchas grandes acuosas y oscuras. Muy destructivo.", recommendations: ["Fungicidas sistémicos urgentes", "Destruir follaje infectado"] },
  22: { status: PlantStatus.HEALTHY, name: "Papa: Sana", description: "Cultivo sano.", recommendations: ["Aporque"] },
  23: { status: PlantStatus.HEALTHY, name: "Frambuesa: Sana", description: "Planta sana.", recommendations: ["Poda de cañas viejas"] },
  24: { status: PlantStatus.HEALTHY, name: "Soja: Sana", description: "Cultivo sin daños.", recommendations: ["Monitoreo de insectos"] },
  25: { status: PlantStatus.DISEASED, name: "Calabaza: Oídio", description: "Polvo blanco en la superficie de las hojas.", recommendations: ["Fungicidas (Azufre)", "Espaciamiento para aireación"] },
  26: { status: PlantStatus.DISEASED, name: "Fresa: Quemadura (Leaf Scorch)", description: "Manchas púrpuras irregulares que coalescen.", recommendations: ["Limpieza sanitaria", "Fungicidas"] },
  27: { status: PlantStatus.HEALTHY, name: "Fresa: Sana", description: "Planta saludable.", recommendations: ["Riego por goteo"] },
  28: { status: PlantStatus.DISEASED, name: "Tomate: Mancha Bacteriana", description: "Puntos negros pequeños con halo amarillo.", recommendations: ["Cobre + Mancozeb", "Evitar riego por aspersión"] },
  29: { status: PlantStatus.DISEASED, name: "Tomate: Tizón Temprano", description: "Manchas marrones con anillos concéntricos en hojas viejas.", recommendations: ["Poda de hojas bajas", "Mulching", "Fungicidas"] },
  30: { status: PlantStatus.DISEASED, name: "Tomate: Tizón Tardío", description: "Manchas irregulares verdosas/oscuras de avance rápido.", recommendations: ["Aplicación inmediata de fungicida", "Ventilación"] },
  31: { status: PlantStatus.DISEASED, name: "Tomate: Moho de la Hoja", description: "Manchas amarillas en el haz, moho en el envés.", recommendations: ["Reducir humedad", "Ventilación de invernadero"] },
  32: { status: PlantStatus.DISEASED, name: "Tomate: Septoria", description: "Muchas manchas pequeñas circulares con centro gris.", recommendations: ["Eliminar hojas afectadas", "Rotación"] },
  33: { status: PlantStatus.DISEASED, name: "Tomate: Araña Roja", description: "Punteado amarillo fino, presencia de ácaros.", recommendations: ["Acaricidas", "Jabón potásico", "Azufre"] },
  34: { status: PlantStatus.DISEASED, name: "Tomate: Mancha Objetivo", description: "Lesiones grandes con anillos concéntricos.", recommendations: ["Mejorar circulación de aire", "Fungicidas"] },
  35: { status: PlantStatus.DISEASED, name: "Tomate: Virus TYLCV", description: "Hojas amarillas y curvadas hacia arriba (cuchara).", recommendations: ["Control de mosca blanca", "Variedades resistentes", "Eliminar plantas"] },
  36: { status: PlantStatus.DISEASED, name: "Tomate: Virus del Mosaico", description: "Patrón de mosaico verde claro/oscuro.", recommendations: ["Desinfección de herramientas", "Eliminar plantas enfermas"] },
  37: { status: PlantStatus.HEALTHY, name: "Tomate: Sano", description: "Planta vigorosa.", recommendations: ["Fertirrigación"] },
};

let model: tf.LayersModel | null = null;

export const isModelAvailable = async (): Promise<boolean> => {
  try {
    const url = getModelUrl();
    console.log("Verificando modelo:", url);
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    console.warn("Error conectando con modelo:", e);
    return false;
  }
};

const loadModel = async () => {
  if (model) return model;
  try {
    const url = getModelUrl();
    console.log("Cargando modelo desde:", url);
    await tf.ready();
    model = await tf.loadLayersModel(url);
    console.log("Modelo cargado.");
    return model;
  } catch (error) {
    console.error("Fallo al cargar modelo:", error);
    return null;
  }
};

const enrichWithSensorData = (recommendations: string[], sensorData?: SensorData): string[] => {
  if (!sensorData) return recommendations;
  const newRecs = [...recommendations];
  if (sensorData.humidity > 80) newRecs.unshift("⚠️ ALERTA IOT: Alta humedad, riesgo fúngico.");
  if (sensorData.temperature > 32) newRecs.push("⚠️ ALERTA IOT: Estrés térmico.");
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
          if (!loadedModel) throw new Error("Modelo no disponible");

          const predictionResult = tf.tidy(() => {
            let tensor = tf.browser.fromPixels(img);
            tensor = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);
            tensor = tensor.div(255.0);
            const batch = tensor.expandDims(0);
            return loadedModel.predict(batch) as tf.Tensor;
          });

          const data = await predictionResult.data();
          predictionResult.dispose();

          const probabilities = Array.from(data) as number[];
          const maxProbability = Math.max(...probabilities);
          const predictionIndex = probabilities.indexOf(maxProbability);
          
          const rawDiagnosis = KNOWLEDGE_BASE[predictionIndex] || {
            status: PlantStatus.UNCERTAIN,
            name: `Clase ${predictionIndex}`,
            description: "No identificada",
            recommendations: []
          };

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
            diseaseName: "Error",
            confidence: 0,
            description: error.message || "Error desconocido",
            recommendations: ["Revisar consola"],
            timestamp: new Date().toISOString(),
          });
        }
      };
      
      img.onerror = () => resolve({
          status: PlantStatus.UNCERTAIN,
          diseaseName: "Error Imagen",
          confidence: 0,
          description: "Imagen corrupta",
          recommendations: [],
          timestamp: new Date().toISOString()
      });

    } catch (e) {
      resolve({
        status: PlantStatus.UNCERTAIN,
        diseaseName: "Error Sistema",
        confidence: 0,
        description: "Excepción crítica",
        recommendations: [],
        timestamp: new Date().toISOString(),
      });
    }
  });
};