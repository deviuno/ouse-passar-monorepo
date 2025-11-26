

import React from 'react';
import { Course } from '../types';
import { COURSES } from '../constants';
import { AlertTriangle, Lock, ShoppingBag, ArrowLeft, Filter } from 'lucide-react';

interface PegadinhasViewProps {
  onSelectCourse: (course: Course, isPegadinhaMode: boolean) => void;
  onBuyCourse: (course: Course) => void;
  ownedCourseIds: string[];
  onBack: () => void;
}

const PegadinhasView: React.FC<PegadinhasViewProps> = ({ onSelectCourse, onBuyCourse, ownedCourseIds, onBack }) => {
  // Use the main COURSES list logic
  const myCourses = COURSES.filter(c => ownedCourseIds.includes(c.id));
  const storeCourses = COURSES.filter(c => !ownedCourseIds.includes(c.id));

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A]">
      {/* Custom Header */}
      <div className="p-4 border-b border-gray-800 flex items-center bg-[#1A1A1A] sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center text-white">
            <AlertTriangle className="mr-2 text-orange-500" />
            Zona de Pegadinhas
        </h1>
      </div>

      <div className="p-4">
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl mb-6 flex items-start">
             <Filter size={20} className="text-orange-500 mr-3 shrink-0 mt-0.5" />
             <p className="text-sm text-gray-300">
                 Aqui você filtra apenas as questões classificadas como "armadilhas" dos seus preparatórios adquiridos.
             </p>
        </div>

        {/* Meus Treinos (Grid of Vertical Cards) */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Meus Treinos</h2>
            </div>

            {myCourses.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                    {myCourses.map(course => (
                        <button 
                            key={course.id}
                            onClick={() => onSelectCourse(course, true)}
                            className="w-full aspect-[3/4] rounded-xl overflow-hidden relative group shadow-lg border border-orange-900/30 hover:border-orange-500 transition-all text-left"
                        >
                            {/* Background Image */}
                            {course.image ? (
                                <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                                <div className="absolute inset-0 bg-[#252525] flex items-center justify-center">
                                    <div className="text-4xl opacity-20">{course.icon}</div>
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-80"></div>
                             
                            {/* Pegadinha Tint */}
                            <div className="absolute inset-0 bg-orange-900/10 group-hover:bg-orange-900/0 transition-colors"></div>

                            {/* Content Overlay */}
                            <div className="absolute bottom-0 left-0 w-full p-3">
                                <h3 className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-2">{course.title}</h3>
                                <div className="flex items-center space-x-1 mt-1">
                                   <AlertTriangle size={10} className="text-orange-500" />
                                   <p className="text-[10px] text-orange-400 truncate">Filtro Ativado</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center border border-dashed border-gray-800 rounded-xl">
                    <p className="text-gray-500 text-sm">Você ainda não possui preparatórios.</p>
                </div>
            )}
        </div>

        {/* Store (Available Courses that include Pegadinhas) - Grid */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center">
                <ShoppingBag size={18} className="mr-2 text-[#FFB800]"/> 
                Disponíveis para Compra
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {storeCourses.map(course => (
                    <button 
                        key={course.id}
                        onClick={() => onBuyCourse(course)}
                        className="w-full aspect-[3/4] rounded-xl overflow-hidden relative group shadow-lg border border-gray-700 hover:border-[#FFB800] transition-all opacity-90 hover:opacity-100 text-left"
                    >
                        {/* Background Image */}
                         {course.image ? (
                             <img src={course.image} alt={course.title} className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105 filter grayscale-[0.3] group-hover:grayscale-0" />
                         ) : (
                             <div className="absolute inset-0 bg-[#252525] flex items-center justify-center">
                                  <div className="text-4xl opacity-20">{course.icon}</div>
                             </div>
                         )}

                         {/* Gradient Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>

                         {/* Lock Icon */}
                         <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full backdrop-blur-sm">
                             <Lock size={12} className="text-[#FFB800]" />
                         </div>

                         {/* Content Overlay */}
                         <div className="absolute bottom-0 left-0 w-full p-3">
                              <h3 className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-2">{course.title}</h3>
                              <p className="text-[10px] text-gray-400 mb-1">+ Módulo Pegadinhas</p>
                              <span className="text-xs font-bold text-[#FFB800] bg-yellow-900/30 px-1.5 py-0.5 rounded inline-block">{course.price}</span>
                         </div>
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PegadinhasView;