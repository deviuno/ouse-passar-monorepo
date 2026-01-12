import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen, Music, Headphones, Radio, Mic } from 'lucide-react';
import type { MusicCategory } from '../../services/musicService';

interface CategoryCardProps {
  category: MusicCategory;
  trackCount?: number;
}

const iconMap: Record<string, React.ElementType> = {
  music: Music,
  headphones: Headphones,
  radio: Radio,
  mic: Mic,
  folder: FolderOpen,
};

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, trackCount }) => {
  const Icon = iconMap[category.icon || 'folder'] || FolderOpen;
  const bgColor = category.color || '#3B82F6';

  return (
    <Link
      to={`/music/category/${category.slug}`}
      className="relative overflow-hidden rounded-lg aspect-[4/3] group transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{ backgroundColor: bgColor }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      {/* Icon */}
      <div className="absolute top-4 right-4 opacity-30 group-hover:opacity-50 transition-opacity">
        <Icon className="w-16 h-16 text-white" style={{ transform: 'rotate(15deg)' }} />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-bold text-lg">{category.name}</h3>
        {trackCount !== undefined && (
          <p className="text-white/70 text-sm">{trackCount} faixas</p>
        )}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
};

export default CategoryCard;
