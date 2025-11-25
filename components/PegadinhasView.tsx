
import React from 'react';
import { Course } from '../types';
import { COURSES } from '../constants';
import { AlertTriangle, ChevronRight, Lock, ShoppingBag, ArrowLeft, Filter } from 'lucide-react';

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

        {/* Meus Treinos (Based on Owned Courses) */}
        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Meus Treinos</h2>
            </div>

            {myCourses.length > 0 ? (
                <div className="space-y-3">
                    {myCourses.map(course => (
                        <button 
                            key={course.id}
                            // Pass true to enable Pegadinha Mode
                            onClick={() => onSelectCourse(course, true)}
                            className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-orange-900/30 p-4 rounded-2xl flex items-center justify-between transition-all group"
                        >
                            <div className="flex items-center">
                                <div className="w-12 h-12 bg-orange-900/20 rounded-xl flex items-center justify-center text-2xl mr-4 border border-orange-900/50">
                                    {course.icon}
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-gray-500">Filtro de armadilhas ativado</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 group-hover:text-orange-400" size={20} />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-6 text-center border border-dashed border-gray-800 rounded-xl">
                    <p className="text-gray-500 text-sm">Você ainda não possui preparatórios.</p>
                </div>
            )}
        </div>

        {/* Store (Available Courses that include Pegadinhas) */}
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center">
                <ShoppingBag size={18} className="mr-2 text-[#FFB800]"/> 
                Disponíveis para Compra
                </h2>
            </div>

            <div className="space-y-3">
                {storeCourses.map(course => (
                    <button 
                        key={course.id}
                        onClick={() => onBuyCourse(course)}
                        className="w-full bg-[#1A1A1A] border border-dashed border-gray-700 p-4 rounded-2xl flex items-center justify-between opacity-80 hover:opacity-100 hover:border-[#FFB800]/50 transition-all group"
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-[#252525] rounded-xl flex items-center justify-center text-2xl mr-4 text-gray-500 group-hover:text-white">
                                {course.icon}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-gray-300 group-hover:text-white">{course.title}</h3>
                                <p className="text-xs text-gray-500">Inclui módulo de pegadinhas</p>
                                <p className="text-xs text-[#FFB800] font-bold mt-1">{course.price}</p>
                            </div>
                        </div>
                        <Lock className="text-gray-600 group-hover:text-[#FFB800]" size={18} />
                    </button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default PegadinhasView;
