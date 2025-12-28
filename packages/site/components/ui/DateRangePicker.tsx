import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateRange {
  start: string | null;
  end: string | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Selecionar período',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [tempStart, setTempStart] = useState<string | null>(value.start);
  const [tempEnd, setTempEnd] = useState<string | null>(value.end);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync temp values when value prop changes
  useEffect(() => {
    setTempStart(value.start);
    setTempEnd(value.end);
  }, [value.start, value.end]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    return { daysInMonth, startingDay };
  };

  const formatDateStr = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const parseDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const date = parseDate(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isDateInRange = (dateStr: string): boolean => {
    if (!tempStart || !tempEnd) return false;
    return dateStr >= tempStart && dateStr <= tempEnd;
  };

  const isDateStart = (dateStr: string): boolean => {
    return dateStr === tempStart;
  };

  const isDateEnd = (dateStr: string): boolean => {
    return dateStr === tempEnd;
  };

  const handleDateClick = (day: number) => {
    const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));

    if (selecting === 'start') {
      setTempStart(dateStr);
      setTempEnd(null);
      setSelecting('end');
    } else {
      if (tempStart && dateStr < tempStart) {
        // If selected date is before start, swap them
        setTempEnd(tempStart);
        setTempStart(dateStr);
      } else {
        setTempEnd(dateStr);
      }
      setSelecting('start');
    }
  };

  const handleApply = () => {
    onChange({ start: tempStart, end: tempEnd });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onChange({ start: null, end: null });
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);

  const displayText = value.start && value.end
    ? `${formatDisplayDate(value.start)} — ${formatDisplayDate(value.end)}`
    : value.start
    ? `${formatDisplayDate(value.start)} — ...`
    : placeholder;

  const hasValue = value.start || value.end;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 bg-brand-dark border rounded-sm text-sm transition-colors ${
          hasValue
            ? 'border-brand-yellow/50 text-white'
            : 'border-white/10 text-gray-400 hover:border-white/20'
        }`}
      >
        <Calendar size={16} className={hasValue ? 'text-brand-yellow' : 'text-gray-500'} />
        <span className="whitespace-nowrap">{displayText}</span>
        {hasValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 hover:bg-white/10 rounded"
          >
            <X size={14} className="text-gray-400 hover:text-white" />
          </button>
        )}
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-brand-card border border-white/10 rounded-lg shadow-xl p-4 min-w-[300px]">
          {/* Selection Indicator */}
          <div className="flex items-center gap-2 mb-4 text-xs">
            <div className={`flex-1 p-2 rounded text-center border ${
              selecting === 'start'
                ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                : 'border-white/10 text-gray-400'
            }`}>
              <span className="block text-[10px] uppercase">Data Inicial</span>
              <span className="font-medium">{tempStart ? formatDisplayDate(tempStart) : '—'}</span>
            </div>
            <div className={`flex-1 p-2 rounded text-center border ${
              selecting === 'end'
                ? 'border-brand-yellow bg-brand-yellow/10 text-brand-yellow'
                : 'border-white/10 text-gray-400'
            }`}>
              <span className="block text-[10px] uppercase">Data Final</span>
              <span className="font-medium">{tempEnd ? formatDisplayDate(tempEnd) : '—'}</span>
            </div>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-400" />
            </button>
            <span className="text-white font-medium">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <ChevronRight size={20} className="text-gray-400" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((day) => (
              <div key={day} className="text-center text-[10px] text-gray-500 font-medium py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the first day of the month */}
            {Array.from({ length: startingDay }).map((_, index) => (
              <div key={`empty-${index}`} className="h-8" />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
              const isStart = isDateStart(dateStr);
              const isEnd = isDateEnd(dateStr);
              const inRange = isDateInRange(dateStr);
              const isToday = dateStr === formatDateStr(new Date());

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`
                    h-8 w-full text-sm rounded transition-all relative
                    ${isStart || isEnd
                      ? 'bg-brand-yellow text-brand-darker font-bold'
                      : inRange
                      ? 'bg-brand-yellow/20 text-brand-yellow'
                      : isToday
                      ? 'border border-brand-yellow/50 text-white'
                      : 'text-gray-300 hover:bg-white/10'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                setTempStart(formatDateStr(weekAgo));
                setTempEnd(formatDateStr(today));
              }}
              className="flex-1 text-xs py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Últimos 7 dias
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const monthAgo = new Date(today);
                monthAgo.setDate(today.getDate() - 30);
                setTempStart(formatDateStr(monthAgo));
                setTempEnd(formatDateStr(today));
              }}
              className="flex-1 text-xs py-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
            >
              Últimos 30 dias
            </button>
          </div>

          {/* Apply/Clear Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded hover:bg-white/5 transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!tempStart}
              className="flex-1 py-2 text-sm bg-brand-yellow text-brand-darker font-medium rounded hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
