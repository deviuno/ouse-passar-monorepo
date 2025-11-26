

import React from 'react';
import { Course } from '../types';
import { COURSES } from '../constants';
import { BookOpen, ArrowLeft } from 'lucide-react';

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

          {/* Grid Layout of Vertical Cards */}
          <div className="grid grid-cols-2 gap-4">
              {myCourses.map(course => (
                  <button 
                      key={course.id}
                      onClick={() => onSelectCourse(course)}
                      className="w-full aspect-[3/4] rounded-xl overflow-hidden relative group shadow-lg border border-gray-800 hover:border-[#FFB800] transition-all text-left"
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
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                        {/* Content Overlay */}
                        <div className="absolute bottom-0 left-0 w-full p-3">
                              <div className="flex items-center space-x-1 mb-1">
                                   <div className="bg-[#FFB800] rounded-sm p-0.5">
                                       <span className="text-[8px] font-bold text-black uppercase block leading-none">PRO</span>
                                   </div>
                              </div>
                              <h3 className="font-bold text-white text-sm leading-tight mb-0.5 line-clamp-2">{course.title}</h3>
                              <p className="text-[10px] text-gray-300 truncate">{course.subtitle}</p>
                        </div>
                  </button>
              ))}
          </div>
      </div>
    </div>
  );
};

export default SimuladosView;