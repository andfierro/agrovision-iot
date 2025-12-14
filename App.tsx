import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, History, Leaf, Info, RefreshCw, Cpu, WifiOff, Database } from 'lucide-react';
import { analyzePlantImage, isModelAvailable } from './services/analysisService';
import { AnalysisResult, SensorData } from './types';
import { SensorDashboard } from './components/SensorDashboard';
import { ResultsView } from './components/ResultsView';

// Simulación de Sensores
const readIoTData = (): SensorData => ({
  temperature: 22 + Math.random() * 8,
  humidity: 50 + Math.random() * 40,
  soilMoisture: 30 + Math.random() * 50,
  lightLevel: 500 + Math.random() * 500,
});

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [modelReady, setModelReady] = useState<boolean>(false);
  const [checkingModel, setCheckingModel] = useState<boolean>(true);
  const [sensorData, setSensorData] = useState<SensorData>(readIoTData());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(readIoTData());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const checkModel = async () => {
    setCheckingModel(true);
    const available = await isModelAvailable();
    setModelReady(available);
    setCheckingModel(false);
  };

  useEffect(() => {
    checkModel();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        runAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (base64Image: string) => {
    setIsAnalyzing(true);
    setTimeout(async () => {
        const analysis = await analyzePlantImage(base64Image, sensorData);
        setResult(analysis);
        setIsAnalyzing(false);
    }, 100);
  };

  const resetApp = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative overflow-hidden shadow-2xl">
      <header className="bg-white px-6 pt-12 pb-4 shadow-sm z-10 sticky top-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-extrabold text-green-700 tracking-tight">AgroVision</h1>
            <p className="text-xs text-gray-500 font-medium">Edge Computing & IoT</p>
          </div>
          
          <button 
            onClick={checkModel}
            disabled={checkingModel}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors ${
              modelReady 
                ? 'bg-green-50 border-green-200 text-green-700' 
                : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
            }`}
          >
             {checkingModel ? (
               <RefreshCw size={12} className="animate-spin" />
             ) : (
               modelReady ? <Cpu size={12} /> : <WifiOff size={12} />
             )}
             <span>{checkingModel ? 'CARGANDO...' : (modelReady ? 'MODELO LOCAL' : 'ERROR')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 overflow-y-auto">
        {!image && (
          <div className="flex flex-col h-full animate-fade-in">
            <SensorDashboard data={sensorData} />

            <div className="flex-1 flex flex-col justify-center items-center gap-6 my-4">
              <div className="bg-green-50 rounded-full p-8 border-2 border-dashed border-green-200 relative group">
                <Camera size={48} className="text-green-300 group-hover:text-green-500 transition-colors" />
                {!modelReady && !checkingModel && (
                   <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-64 bg-red-100 text-red-800 text-[10px] py-2 px-3 rounded-lg border border-red-200 text-center shadow-sm z-20">
                     <div className="flex items-center justify-center gap-1 font-bold mb-1">
                       <Database size={12} />
                       Model Not Found
                     </div>
                     Looking at: <code className="block bg-white/50">{window.location.origin}{window.location.pathname}model/model.json</code>
                   </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-800">Diagnóstico Offline</h2>
                <p className="text-gray-500 mt-2 px-4 text-sm">
                  Análisis mediante Red Neuronal (CNN) ejecutada en el dispositivo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-auto">
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center justify-center p-4 bg-green-600 active:bg-green-700 rounded-2xl text-white shadow-lg transition-all active:scale-95"
               >
                 <Camera size={28} className="mb-2" />
                 <span className="font-bold text-sm">Cámara</span>
               </button>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="flex flex-col items-center justify-center p-4 bg-white active:bg-gray-50 rounded-2xl text-green-700 border border-green-100 shadow-sm transition-all active:scale-95"
               >
                 <Upload size={28} className="mb-2" />
                 <span className="font-bold text-sm">Galería</span>
               </button>
            </div>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleImageUpload} 
        />

        {image && isAnalyzing && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 animate-pulse">
            <div className="relative w-48 h-48 rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img src={image} alt="Analyzing" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Cpu className="text-white animate-spin" size={48} />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800">Procesando...</h3>
              <p className="text-sm text-gray-500 mt-1">
                TensorFlow.js en ejecución
              </p>
            </div>
          </div>
        )}

        {image && !isAnalyzing && result && (
          <ResultsView result={result} onReset={resetApp} />
        )}
      </main>

      {!image && (
        <nav className="bg-white border-t border-gray-100 px-6 py-4 flex justify-between items-center text-gray-400">
          <button className="flex flex-col items-center text-green-600 gap-1">
            <Leaf size={24} />
            <span className="text-[10px] font-bold">Inicio</span>
          </button>
          <button className="flex flex-col items-center hover:text-green-600 transition-colors gap-1">
            <History size={24} />
            <span className="text-[10px] font-medium">Historial</span>
          </button>
          <button className="flex flex-col items-center hover:text-green-600 transition-colors gap-1">
            <Info size={24} />
            <span className="text-[10px] font-medium">Modelo</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;