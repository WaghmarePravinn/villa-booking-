
import React, { useState, useMemo } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose?: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, onClose }) => {
  // Use local date for initial view
  const [viewDate, setViewDate] = useState(() => {
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Helper to get YYYY-MM-DD in local time, completely avoiding timezone offsets
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    return {
      name: date.toLocaleString('default', { month: 'long' }),
      year,
      days
    };
  };

  const months = useMemo(() => {
    const d1 = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const d2 = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    return [generateMonth(d1), generateMonth(d2)];
  }, [viewDate]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleDateClick = (e: React.MouseEvent, date: Date) => {
    e.stopPropagation();
    const dateStr = toLocalDateString(date);
    
    // Logic for range selection
    if (!startDate || (startDate && endDate)) {
      // Start a new range
      onChange(dateStr, '');
    } else {
      // We have a start date but no end date
      if (dateStr < startDate) {
        // New start date if selected is earlier
        onChange(dateStr, '');
      } else if (dateStr === startDate) {
        // Clear if same date
        onChange('', '');
      } else {
        // Finish the range
        onChange(startDate, dateStr);
        if (onClose) {
          // Small delay for visual feedback before closing
          setTimeout(onClose, 200);
        }
      }
    }
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    const dStr = toLocalDateString(date);
    return dStr === startDate || dStr === endDate;
  };

  const isInRange = (date: Date | null) => {
    if (!date || !startDate || !endDate) return false;
    const dStr = toLocalDateString(date);
    return dStr > startDate && dStr < endDate;
  };

  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = toLocalDateString(today);
    const dStr = toLocalDateString(date);
    return dStr < todayStr;
  };

  return (
    <div 
      className="bg-white rounded-[2rem] shadow-[0_30px_70px_rgba(0,0,0,0.15)] border border-gray-100 p-6 md:p-10 w-full max-w-4xl animate-fade-in-up"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center border-b border-gray-100 mb-8 pb-4">
        <div className="flex space-x-6 md:space-x-12">
          <button className="text-xs md:text-sm font-black text-slate-900 border-b-2 border-amber-600 pb-4 tracking-tight">Select Dates</button>
          <button className="text-xs md:text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors tracking-tight">Flexible?</button>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 underline decoration-2 underline-offset-4"
        >
          Clear Dates
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16 relative">
        <button 
          onClick={handlePrevMonth}
          className="absolute left-[-5px] md:left-[-15px] top-0 p-3 hover:bg-gray-50 rounded-full transition-all z-20 active:scale-90"
        >
          <i className="fa-solid fa-chevron-left text-xs text-slate-400"></i>
        </button>
        <button 
          onClick={handleNextMonth}
          className="absolute right-[-5px] md:right-[-15px] top-0 p-3 hover:bg-gray-50 rounded-full transition-all z-20 active:scale-90"
        >
          <i className="fa-solid fa-chevron-right text-xs text-slate-400"></i>
        </button>

        {months.map((m, mIdx) => (
          <div key={mIdx} className="flex-1">
            <h3 className="text-center font-black text-slate-800 mb-6 font-serif text-base md:text-lg">
              {m.name} {m.year}
            </h3>
            <div className="grid grid-cols-7 gap-y-1">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[9px] md:text-[10px] font-black text-gray-300 uppercase mb-4 tracking-widest">{d}</div>
              ))}
              {m.days.map((day, dIdx) => {
                if (!day) return <div key={`empty-${mIdx}-${dIdx}`} />;
                const selected = isSelected(day);
                const range = isInRange(day);
                const past = isPast(day);
                
                return (
                  <button
                    key={dIdx}
                    disabled={past}
                    onClick={(e) => handleDateClick(e, day)}
                    className={`
                      relative h-10 md:h-12 w-full flex items-center justify-center text-xs md:text-sm font-bold transition-all
                      ${past ? 'text-gray-200 cursor-not-allowed' : 'text-slate-700 hover:bg-amber-100 hover:text-amber-800 hover:rounded-full'}
                      ${selected ? 'bg-slate-900 !text-white rounded-full z-10 shadow-lg scale-110' : ''}
                      ${range ? 'bg-amber-50 text-amber-900' : ''}
                    `}
                  >
                    {day.getDate()}
                    {selected && startDate && !endDate && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between text-slate-500 text-[10px] font-black uppercase tracking-widest">
          <span>{startDate ? `From: ${startDate}` : 'Pick start date'}</span>
          <i className="fa-solid fa-arrow-right-long text-amber-500"></i>
          <span>{endDate ? `To: ${endDate}` : 'Pick end date'}</span>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
