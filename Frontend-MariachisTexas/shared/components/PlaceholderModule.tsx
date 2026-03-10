import React from 'react';
import { Hammer } from 'lucide-react';

interface Props {
  title: string;
}

export const PlaceholderModule: React.FC<Props> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
      <div className="bg-slate-100 p-6 rounded-full mb-6 animate-pulse">
        <Hammer size={64} className="text-slate-400" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Módulo: {title}</h2>
      <p className="text-slate-500 max-w-md">
        Esta carpeta está organizada en <code>src/features/{title.toLowerCase().replace(' ', '-')}</code>.
        La lógica será implementada en la siguiente fase.
      </p>
    </div>
  );
};