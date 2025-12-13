import React from 'react';
import { Thermometer, Droplets, Sun, Activity } from 'lucide-react';
import { SensorData } from '../types';

interface SensorDashboardProps {
  data: SensorData;
}

export const SensorDashboard: React.FC<SensorDashboardProps> = ({ data }) => {
  const MetricCard = ({ icon: Icon, label, value, unit, color }: any) => (
    <div className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3`}>
      <div className={`p-2 rounded-full ${color} text-white`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value.toFixed(1)}{unit}</p>
      </div>
    </div>
  );

  return (
    <div className="w-full mb-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Activity size={18} className="text-green-600" />
        <h3 className="font-semibold text-gray-700">Sensores IoT (Tiempo Real)</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Thermometer} label="Temp" value={data.temperature} unit="°C" color="bg-orange-500" />
        <MetricCard icon={Droplets} label="Humedad" value={data.humidity} unit="%" color="bg-blue-500" />
        <MetricCard icon={Droplets} label="Suelo" value={data.soilMoisture} unit="%" color="bg-emerald-600" />
        <MetricCard icon={Sun} label="Luz" value={data.lightLevel} unit=" lx" color="bg-yellow-500" />
      </div>
    </div>
  );
};