// pages/ExerciseLibraryPage.tsx
import React, { useState, useMemo } from 'react';
import { ChevronDown, PlayCircle, Star, Search } from 'lucide-react';
import useExerciseLibrary from '../hooks/useExerciseLibrary';
import PageLoader from '../components/ui/PageLoader';
import PageHeader from '../components/PageHeader';

const ExerciseLibraryPage: React.FC = () => {
  const { protocols, exerciseGroups, isLoading } = useExerciseLibrary();
  const [searchTerm, setSearchTerm] = useState('');
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) {
        // When not searching, open the first group by default
        if (!isLoading && exerciseGroups.length > 0 && openGroupId === null) {
            setOpenGroupId(exerciseGroups[0].id);
        }
        return { protocols, exerciseGroups };
    }

    const lowerCaseSearch = searchTerm.toLowerCase();

    const filteredProtocols = protocols.filter(p => p.name.toLowerCase().includes(lowerCaseSearch));
    
    const filteredGroups = exerciseGroups
      .map(group => ({
        ...group,
        exercises: group.exercises.filter(ex => ex.name.toLowerCase().includes(lowerCaseSearch)),
      }))
      .filter(group => group.exercises.length > 0);
    
     // If searching and there's a result, open the first filtered group
    if (filteredGroups.length > 0 && openGroupId === null) {
        setOpenGroupId(filteredGroups[0].id);
    }

    return { protocols: filteredProtocols, exerciseGroups: filteredGroups };
  }, [searchTerm, protocols, exerciseGroups, isLoading, openGroupId]);

  if (isLoading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Biblioteca de Exercícios"
        subtitle="Encontre exercícios individuais ou protocolos completos para as suas prescrições."
      />
      
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-8">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar exercícios ou protocolos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>


      {/* Seção de Protocolos */}
      {filteredData.protocols.length > 0 && (
         <div>
            <h2 className="text-2xl font-semibold text-slate-700 mb-4">Protocolos de Tratamento</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredData.protocols.map(protocol => (
                <div key={protocol.id} className="bg-white p-5 rounded-lg shadow-sm hover:shadow-xl transition-shadow cursor-pointer border border-slate-200">
                <h3 className="font-bold text-lg text-teal-600">{protocol.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{protocol.description}</p>
                </div>
            ))}
            </div>
        </div>
      )}
     

      {/* Seção de Grupos de Exercícios */}
      <div className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-700 mb-4">Grupos de Exercícios</h2>
        <div className="space-y-3">
          {filteredData.exerciseGroups.map(group => (
            <div key={group.id} className="border border-slate-200 rounded-lg bg-white shadow-sm">
              <button
                onClick={() => setOpenGroupId(openGroupId === group.id ? null : group.id)}
                className="w-full flex justify-between items-center p-4 hover:bg-slate-50 transition-colors duration-200"
              >
                <h3 className="text-lg font-medium text-slate-800">{group.name}</h3>
                <ChevronDown className={`transform transition-transform text-teal-600 ${openGroupId === group.id ? 'rotate-180' : ''}`} />
              </button>
              {openGroupId === group.id && (
                <ul className="divide-y divide-slate-200 p-2">
                  {group.exercises.map(exercise => (
                    <li key={exercise.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-md group">
                      <div className="flex items-center">
                        <PlayCircle className="text-slate-400 mr-4 group-hover:text-teal-500" />
                        <div>
                          <p className="font-medium text-slate-800">{exercise.name}</p>
                          <p className="text-sm text-slate-500">Duração: {exercise.duration}</p>
                        </div>
                      </div>
                      <button className="text-slate-400 hover:text-amber-500"><Star /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default ExerciseLibraryPage;
