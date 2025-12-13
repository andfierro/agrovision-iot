export enum PlantStatus {
  HEALTHY = 'Sana',
  DISEASED = 'Enferma',
  UNCERTAIN = 'Incierto'
}

export interface AnalysisResult {
  status: PlantStatus;
  diseaseName: string;
  confidence: number;
  description: string;
  recommendations: string[];
  timestamp: string;
}

export interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lightLevel: number;
}