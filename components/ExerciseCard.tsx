import React from 'react';
import { Exercise } from '../types';
import { Edit } from 'lucide-react';

interface ExerciseCardProps {
    exercise: Exercise;
    onEdit: () => void;
}

const difficultyColors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-sky-100 text-sky-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-red-100 text-red-800',
};

const ExerciseCard: React.FC<ExerciseCardProps> = ({ exercise, onEdit }) => {
    return (
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col overflow-hidden group">
            <div className="relative">
                <img
                    src={exercise.media.thumbnailUrl}
                    alt={exercise.name}
                    className="w-full h-40 object-cover"
                />
                 <button onClick={onEdit} className="absolute top-3 right-3 bg-white/70 p-2 rounded-full text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-teal-600">
                    <Edit className="w-4 h-4" />
                </button>
            </div>
            <div className="p-4 flex-grow flex flex-col">
                <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-slate-800 flex-1 pr-2">{exercise.name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${difficultyColors[exercise.difficulty]}`}>
                        Nível {exercise.difficulty}
                    </span>
                </div>
                <p className="text-sm text-slate-500 mt-1">{exercise.category}</p>
                <div className="mt-4 flex flex-wrap gap-2 flex-grow content-start">
                    {exercise.bodyParts.slice(0, 3).map(part => (
                        <span key={part} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">{part}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExerciseCard;
