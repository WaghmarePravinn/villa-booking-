
import React, { useState, useMemo, useEffect } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose?: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date();
  });

  useEffect(() => {
    if (startDate) {
      const [y, m, d] = startDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        const newView = new Date(y, m - 1, 1);
        if (newView.getMonth() !== viewDate.getMonth() || newView.getFullYear() !== viewDate.getFullYear()) {
          setViewDate(newView);
        }
      }
    }
  }, [startDate]);

  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

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
    
    const monthName = date.toLocaleString('default', { month: 'long' });
    
    return {
      name: monthName,
      year,
      days
    };
  };

  // Keep dual month on desktop but in a tighter container
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
    
    if (!startDate || (startDate && endDate)) {
      onChange(dateStr, '');
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, '');
      } else if (dateStr === startDate) {
        onChange('', '');
      } else {
        onChange(startDate, dateStr);
        if (onClose) {
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
    if (!date || !startDate) return false;
    const dStr = toLocalDateString(date);
    
    if (endDate) {
      return dStr > startDate && dStr < endDate;
    }
    
    if (hoverDate && dStr > startDate && dStr <= hoverDate) {
      return true;
    }
    
    return false;
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
      className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-slate-100 p-4 sm:p-6 w-full max-w-[340px] sm:max-max-w-none sm:w-auto animate-scale"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Mini Header */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-50">
        <div className="text-left">
          <p className="text-[7px] font-black text-sky-600 uppercase tracking-widest leading-none mb-1">Stay Schedule</p>
          <p className="text-sm font-bold text-slate-900 font-serif leading-none">Choose Dates</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 relative">
        {/* Nav Controls - More discrete */}
        <button 
          onClick={handlePrevMonth}
          className="absolute left-0 top-0 p-1.5 hover:bg-slate-50 rounded-lg transition-all z-20"
        >
          <i className="fa-solid fa-chevron-left text-[10px] text-slate-400"></i>
        </button>
        <button 
          onClick={handleNextMonth}
          className="absolute right-0 top-0 p-1.5 hover:bg-slate-50 rounded-lg transition-all z-20"
        >
          <i className="fa-solid fa-chevron-right text-[10px] text-slate-400"></i>
        </button>

        {months.map((m, mIdx) => (
          <div key={`${m.name}-${m.year}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''} min-w-[260px]`}>
            <h3 className="text-center font-bold text-slate-800 mb-4 font-serif text-sm">
              {m.name} {m.year}
            </h3>
            <div className="grid grid-cols-7 gap-y-1">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[8px] font-black text-slate-300 uppercase mb-1 tracking-widest">{d}</div>
              ))}
              {m.days.map((day, dIdx) => {
                if (!day) return <div key={`empty-${mIdx}-${dIdx}`} />;
                const dStr = toLocalDateString(day);
                const selected = isSelected(day);
                const range = isInRange(day);
                const past = isPast(day);
                
                return (
                  <button
                    key={dIdx}
                    disabled={past}
                    onMouseEnter={() => !endDate && setHoverDate(dStr)}
                    onMouseLeave={() => setHoverDate(null)}
                    onClick={(e) => handleDateClick(e, day)}
                    className={`
                      relative h-8 sm:h-9 w-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all
                      ${past ? 'text-slate-100 cursor-not-allowed' : 'text-slate-600'}
                      ${selected ? 'bg-slate-900 !text-white rounded-lg z-20 shadow-sm' : ''}
                      ${range && !selected ? 'bg-sky-50 text-sky-900' : ''}
                      ${!past && !selected && !range ? 'hover:bg-slate-50 rounded-lg' : ''}
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Tighter Footer */}
      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
         <div className="flex gap-3 items-center">
            <div className="text-left">
              <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block leading-none mb-0.5">Check-In</span>
              <span className="text-[10px] font-bold text-slate-900">{startDate ? startDate.split('-').reverse().slice(0,2).join('/') : '--/--'}</span>
            </div>
            <div className="w-3 h-[1px] bg-slate-100"></div>
            <div className="text-left">
              <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest block leading-none mb-0.5">Check-Out</span>
              <span className="text-[10px] font-bold text-slate-900">{endDate ? endDate.split('-').reverse().slice(0,2).join('/') : '--/--'}</span>
            </div>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onClose?.(); }}
           className="px-5 py-2.5 bg-sky-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-sky-700 transition-colors"
         >
           Confirm Stay
         </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
