import React from 'react';
import { BookOpen, Clock, BarChart, CheckCircle } from 'lucide-react';
import { Card, Button } from '../ui';
import { Course } from '../../services/coursesService';
import { CourseBadgesOverlay } from './CourseBadge';
import { getOptimizedImageUrl } from '../../utils/image';

interface CourseCardProps {
  course: Course;
  onOpen: (slug: string) => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course, onOpen }) => {
  const coverImage = getOptimizedImageUrl(course.cover_image_url || course.thumbnail_url, 400);
  const progress = course.progress || 0;
  const isCompleted = progress >= 100;

  return (
    <Card
      hoverable
      onClick={() => onOpen(course.slug)}
      className="relative overflow-hidden h-full cursor-pointer group flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-[#3A3A3A]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
            <BookOpen size={40} className="text-white/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

        {/* Custom Badges */}
        {course.badges && course.badges.length > 0 && (
          <CourseBadgesOverlay badges={course.badges} price={course.price} />
        )}

        {/* Progress Badge */}
        {progress > 0 && (
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <div className="flex justify-between text-xs text-white mb-1">
              <span>{Math.round(progress)}% Concluído</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ffac00]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-2 left-2 bg-[#2ECC71] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-20">
            <CheckCircle size={12} />
            Concluído
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-[var(--color-text-main)] font-medium text-base mb-2 line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors">
          {course.title}
        </h3>

        <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)] mt-auto mb-4">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{course.estimated_duration_hours || 0}h</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen size={12} />
            <span>{course.total_lessons || 0} aulas</span>
          </div>
          {course.difficulty_level && (
            <div className="flex items-center gap-1 capitalize">
              <BarChart size={12} />
              <span>{course.difficulty_level}</span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="w-full mt-auto"
          onClick={(e) => {
            e.stopPropagation();
            onOpen(course.slug);
          }}
        >
          {progress > 0 ? 'Continuar' : 'Iniciar'}
        </Button>
      </div>
    </Card>
  );
};

export default CourseCard;
