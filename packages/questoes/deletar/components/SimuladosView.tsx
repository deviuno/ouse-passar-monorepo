
import React from 'react';
import { Course } from '../types';
import { COURSES } from '../constants';
import { BookOpen, ChevronRight, ArrowLeft } from 'lucide-react';

interface SimuladosViewProps {
  onSelectCourse: (course: Course) => void;
  onBack: () => void;
}

const SimuladosView: React.FC<SimuladosViewProps> = ({ onSelectCourse, onBack }) => {
  const myCourses = COURSES.filter(c => c.isOwned);

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A]">
      {/* Custom Header with Back Button */}
      <div className="p-4 border-b border-gray-800 flex items-center bg-[#1A1A1A] sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white">
            <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold flex items-center text-white">
            <BookOpen className="mr-2 text-[#FFB800]" />
            Simulados
        </h1>
      </div>

      <div className="p-4">
          <p className="text-gray-400 text-sm mb-6">
              Selecione o preparatório para iniciar seus estudos.
          </p>

          {/* Meus Preparatórios */}
          <div className="mb-8">
            <div className="space-y-3">
                {myCourses.map(course => (
                    <button 
                        key={course.id}
                        onClick={() => onSelectCourse(course)}
                        className="w-full bg-[#252525] hover:bg-[#2A2A2A] border border-gray-800 p-4 rounded-2xl flex items-center justify-between transition-all group"
                    >
                        <div className="flex items-center">
                            <div className="w-12 h-12 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-2xl mr-4 border border-gray-800 group-hover:border-[#FFB800]/50">
                                {course.icon}
                            </div>
                            <div className="text-left">
                                <h3 className="font-bold text-white group-hover:text-[#FFB800] transition-colors">{course.title}</h3>
                                <p className="text-xs text-gray-500">{course.subtitle}</p>
                            </div>
                        </div>
                        <ChevronRight className="text-gray-600 group-hover:text-[#FFB800]" size={20} />
                    </button>
                ))}
            </div>
          </div>
      </div>
    </div>
  );
};

export default SimuladosView;
