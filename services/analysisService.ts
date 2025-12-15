import * as tf from '@tensorflow/tfjs';
import { AnalysisResult, PlantStatus, SensorData } from "../types";

// =========================================================
// 1. SOLUCIÓN GITHUB PAGES: Generador de URL dinámica
// =========================================================
// ✅ SOLUCIÓN DEFINITIVA para GitHub Pages
const getModelUrl = () => {
  // Si estamos en desarrollo, usa la ruta normal
  if (process.env.NODE_ENV === 'development') {
    return '/model/model.json';
  }
  
  // Para producción (GitHub Pages), usa ruta relativa
  const base = window.location.pathname.includes('/index.html') 
    ? window.location.pathname.replace('/index.html', '') 
    : window.location.pathname;
  
  // Remover trailing slash si existe
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  
  return `${cleanBase}/model/model.json`;
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
    console.log("Verificando disponibilidad en:", url);
	// Primero intenta con fetch normal
    const res = await fetch(url);
    if (res.ok) {
      console.log("✅ Modelo encontrado en:", url);
      return true;
    }
    
    // Si falla, intenta con ruta absoluta
    const absoluteUrl = new URL(url, window.location.origin).href;
    const res2 = await fetch(absoluteUrl);
    if (res2.ok) {
      console.log("✅ Modelo encontrado en:", absoluteUrl);
      return true;
    }
    
    console.error("❌ Modelo no encontrado en ninguna ruta");
    return false;
  } catch (e) {
    console.warn("Fallo verificando modelo:", e);
    return false;
  }
};

const loadModel = async () => {
  if (model) return model;
  try {
    const url = getModelUrl();
    console.log("Cargando modelo TensorFlow desde:", url);
    
    await tf.ready();
    model = await tf.loadLayersModel(url);
    
    console.log("Modelo TF cargado correctamente.");
    return model;
  } catch (error) {
    console.error("Error crítico cargando modelo:", error);
    return null;
  }
};

const enrichWithSensorData = (recommendations: string[], sensorData?: SensorData): string[] => {
  if (!sensorData) return recommendations;
  const newRecs = [...recommendations];
  if (sensorData.humidity > 80) newRecs.unshift("⚠️ ALERTA IOT: Alta humedad detectada, riesgo fúngico elevado.");
  if (sensorData.temperature > 32) newRecs.push("⚠️ ALERTA IOT: Estrés térmico posible.");
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
          if (!loadedModel) throw new Error("Modelo no disponible. Verifique la carpeta /model/ en el repositorio.");

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
            name: `Clase Desconocida (${predictionIndex})`,
            description: "No se encontró información en la base de conocimiento.",
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
            diseaseName: "Error de Inferencia",
            confidence: 0,
            description: error.message || "Fallo en TensorFlow.js",
            recommendations: ["Recargar la página"],
            timestamp: new Date().toISOString(),
          });
        }
      };
      
      img.onerror = () => resolve({
          status: PlantStatus.UNCERTAIN,
          diseaseName: "Error Imagen",
          confidence: 0,
          description: "No se pudo procesar la imagen seleccionada.",
          recommendations: [],
          timestamp: new Date().toISOString()
      });

    } catch (e) {
      resolve({
        status: PlantStatus.UNCERTAIN,
        diseaseName: "Error Sistema",
        confidence: 0,
        description: "Error inesperado en el servicio de análisis.",
        recommendations: [],
        timestamp: new Date().toISOString(),
      });
    }
  });
};