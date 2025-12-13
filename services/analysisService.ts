import * as tf from '@tensorflow/tfjs';
import { AnalysisResult, PlantStatus, SensorData } from "../types";

// =========================================================
// 1. FUNCIÓN getModelUrl (Aquí es donde se arregla la ruta)
// =========================================================
const getModelUrl = () => {
  // Obtenemos la URL actual donde se está ejecutando la app
  const loc = window.location;
  
  // Limpiamos la ruta para obtener el directorio base (ej: /agrovision-tesis/)
  // Si termina en index.html, lo quitamos.
  let pathName = loc.pathname;
  if (pathName.endsWith('index.html')) {
    pathName = pathName.substring(0, pathName.lastIndexOf('index.html'));
  }
  
  // Aseguramos que termine en /
  if (!pathName.endsWith('/')) {
     pathName += '/';
  }

  // Construimos la ruta absoluta al modelo
  // Resultado Ej: https://usuario.github.io/agrovision-tesis/model/model.json
  const fullPath = `${loc.origin}${pathName}model/model.json`;
  return fullPath;
};

const IMAGE_SIZE = 224; // Tamaño estándar para MobileNetV2

// BASE DE CONOCIMIENTO LOCAL (38 Clases de PlantVillage)
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

// Función para verificar si el archivo existe antes de intentar cargarlo
export const isModelAvailable = async (): Promise<boolean> => {
  try {
    const url = getModelUrl();
    console.log("Verificando existencia del modelo en:", url);
    // Hacemos una petición HEAD solo para ver si el archivo existe (status 200)
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch (e) {
    console.warn("No se pudo conectar con el archivo del modelo:", e);
    return false;
  }
};

const loadModel = async () => {
  if (model) return model;
  try {
    const url = getModelUrl();
    console.log("Iniciando carga de TensorFlow.js desde:", url);
    
    // Preparamos el backend (WebGL para aceleración gráfica)
    await tf.ready();
    
    // Cargamos el modelo
    model = await tf.loadLayersModel(url);
    console.log("Modelo cargado correctamente. Backend:", tf.getBackend());
    return model;
  } catch (error) {
    console.error("Error cargando modelo:", error);
    return null;
  }
};

// Función auxiliar para combinar predicción visual con datos de sensores
const enrichWithSensorData = (recommendations: string[], sensorData?: SensorData): string[] => {
  if (!sensorData) return recommendations;
  
  const newRecs = [...recommendations];
  
  // Reglas simples de experto basadas en sensores
  if (sensorData.humidity > 80) {
    newRecs.unshift("⚠️ ALERTA SENSORES: Humedad ambiental muy alta (>80%). Favorece hongos.");
  }
  if (sensorData.temperature > 32) {
    newRecs.push("⚠️ ALERTA SENSORES: Temperatura crítica (>32°C). Riesgo de estrés térmico.");
  }
  if (sensorData.soilMoisture < 20) {
     newRecs.push("⚠️ ALERTA SENSORES: Suelo muy seco. Riego urgente recomendado.");
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
             throw new Error("El modelo no se ha podido cargar. Verifique la ruta.");
          }

          // 1. Preprocesamiento de imagen para MobileNetV2
          const predictionResult = tf.tidy(() => {
            let tensor = tf.browser.fromPixels(img);
            // Redimensionar a 224x224
            tensor = tf.image.resizeBilinear(tensor, [IMAGE_SIZE, IMAGE_SIZE]);
            // Normalizar valores a [0, 1]
            tensor = tensor.div(255.0);
            // Expandir dimensiones para crear un "batch" de 1 imagen: [1, 224, 224, 3]
            const batch = tensor.expandDims(0);
            return loadedModel.predict(batch) as tf.Tensor;
          });

          // 2. Obtener datos del tensor
          const data = await predictionResult.data();
          predictionResult.dispose(); // Limpiar memoria de la GPU

          // 3. Interpretar resultados
          const probabilities = Array.from(data) as number[];
          const maxProbability = Math.max(...probabilities);
          const predictionIndex = probabilities.indexOf(maxProbability);
          
          // Buscar en la base de conocimiento local
          const rawDiagnosis = KNOWLEDGE_BASE[predictionIndex] || {
            status: PlantStatus.UNCERTAIN,
            name: `Clase Desconocida (ID: ${predictionIndex})`,
            description: "No se encontró información para esta clase en la base de datos.",
            recommendations: []
          };

          // 4. Fusión de datos (Imagen + Sensores)
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
            description: `Hubo un error al ejecutar el modelo: ${error.message}`,
            recommendations: ["Recargue la página", "Verifique su conexión a internet (para cargar librerías)"],
            timestamp: new Date().toISOString(),
          });
        }
      };
      
      img.onerror = () => resolve({
          status: PlantStatus.UNCERTAIN,
          diseaseName: "Error de Imagen",
          confidence: 0,
          description: "No se pudo leer el archivo de imagen proporcionado.",
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