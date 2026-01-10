import React from 'react';
import { BookOpen, Play, CheckCircle } from 'lucide-react';
import { Card } from '../ui';
import { Course } from '../../services/coursesService';
import { CourseBadgesOverlay } from './CourseBadge';
import { getOptimizedImageUrl } from '../../utils/image';

interface NetflixCardProps {
  course: Course;
  onOpen: (slug: string) => void;
}

export const NetflixCard: React.FC<NetflixCardProps> = ({ course, onOpen }) => {
  const posterImage = getOptimizedImageUrl(
    course.poster_image_url || course.thumbnail_url,
    300
  );
  const progress = course.progress || 0;
  const isCompleted = progress >= 100;

  return (
    <Card
      hoverable
      onClick={() => onOpen(course.slug)}
      className="relative overflow-hidden cursor-pointer group"
    >
      {/* Poster Image */}
      <div className="relative w-full aspect-[5/7] rounded-xl overflow-hidden bg-[#3A3A3A]">
        {posterImage ? (
          <img
            src={posterImage}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
            <BookOpen size={48} className="text-white/30" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />

        {/* Custom Badges */}
        {course.badges && course.badges.length > 0 && (
          <CourseBadgesOverlay badges={course.badges} price={course.price} />
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-2 right-2 bg-[#2ECC71] text-white text-xs font-bold p-1.5 rounded-full z-20">
            <CheckCircle size={14} />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <div className="bg-[var(--color-brand)] rounded-full p-4 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={24} className="text-black fill-current" />
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && !isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <div className="h-1 bg-white/20">
              <div
                className="h-full bg-[var(--color-brand)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Title at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
          <h3 className="text-white font-medium text-sm line-clamp-2 drop-shadow-lg">
            {course.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
            <span>{course.total_lessons || 0} aulas</span>
            {progress > 0 && !isCompleted && (
              <span className="text-[var(--color-brand)]">{Math.round(progress)}%</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default NetflixCard;
