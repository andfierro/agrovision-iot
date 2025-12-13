import React from 'react';
import { AnalysisResult, PlantStatus } from '../types';
import { CheckCircle, AlertTriangle, AlertOctagon, Activity } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsViewProps {
  result: AnalysisResult;
  onReset: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({ result, onReset }) => {
  const isHealthy = result.status === PlantStatus.HEALTHY;
  
  const chartData = [
    { name: 'Confianza', value: result.confidence },
    { name: 'Incertidumbre', value: 100 - result.confidence },
  ];
  
  const COLORS = isHealthy ? ['#22c55e', '#e5e7eb'] : ['#ef4444', '#e5e7eb'];

  return (
    <div className="animate-fade-in pb-20">
      <div className={`rounded-3xl p-6 text-white mb-6 shadow-lg ${isHealthy ? 'bg-gradient-to-br from-green-500 to-emerald-700' : 'bg-gradient-to-br from-red-500 to-orange-700'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isHealthy ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
            <span className="text-2xl font-bold">{result.status}</span>
          </div>
          <span className="text-sm opacity-90 bg-white/20 px-3 py-1 rounded-full">
            {result.confidence}% Confianza
          </span>
        </div>
        
        <p className="text-white/90 text-lg font-medium leading-tight">
          {result.diseaseName}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 className="text-gray-800 font-bold mb-3 flex items-center gap-2">
          <Activity size={18} className="text-blue-600" />
          Análisis Fitopatológico
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm text-justify">
          {result.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Precisión del Modelo</h4>
            <div className="h-24 w-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    innerRadius={30}
                    outerRadius={40}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <span className={`font-bold ${isHealthy ? 'text-green-600' : 'text-red-500'}`}>{result.confidence}%</span>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
             <h4 className="text-xs text-gray-400 uppercase font-bold mb-2">Acción Recomendada</h4>
             <ul className="text-xs text-gray-600 space-y-2">
                {result.recommendations.slice(0, 3).map((rec, i) => (
                    <li key={i} className="flex gap-2">
                        <span className="text-green-500 font-bold">•</span>
                        {rec}
                    </li>
                ))}
             </ul>
        </div>
      </div>

      <button
        onClick={onReset}
        className="w-full py-4 rounded-xl bg-gray-900 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform"
      >
        Analizar Nueva Planta
      </button>
    </div>
  );
};