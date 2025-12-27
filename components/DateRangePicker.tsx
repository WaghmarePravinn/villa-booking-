
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

  // Sync view date if startDate prop changes (e.g. from external clear or manual entry)
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
    
    // Robust month naming fallback
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthName = date.toLocaleString('default', { month: 'long' }) || monthNames[month];
    
    return {
      name: monthName,
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
          // Add a small delay for visual feedback before closing
          setTimeout(onClose, 300);
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
      className="bg-white rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-gray-100 p-8 md:p-12 w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center border-b border-gray-100 mb-10 pb-6 sticky top-0 bg-white z-10">
        <div className="flex space-x-8">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Select Stay</span>
            <span className="text-xl font-bold text-slate-900 font-serif">Dates</span>
          </div>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="px-6 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-gray-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
        >
          Clear Dates
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-12 md:gap-20 relative">
        <button 
          onClick={handlePrevMonth}
          className="absolute left-[-5px] md:left-[-15px] top-0 p-4 hover:bg-gray-50 rounded-2xl transition-all z-20 group"
        >
          <i className="fa-solid fa-chevron-left text-xs text-slate-300 group-hover:text-amber-500"></i>
        </button>
        <button 
          onClick={handleNextMonth}
          className="absolute right-[-5px] md:right-[-15px] top-0 p-4 hover:bg-gray-50 rounded-2xl transition-all z-20 group"
        >
          <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-amber-500"></i>
        </button>

        {months.map((m, mIdx) => (
          <div key={`${m.name}-${m.year}-${mIdx}`} className="flex-1">
            <h3 className="text-center font-bold text-slate-800 mb-8 font-serif text-lg">
              {m.name} {m.year}
            </h3>
            <div className="grid grid-cols-7 gap-y-1">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase mb-4 tracking-widest">{d}</div>
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
                      relative h-12 w-full flex items-center justify-center text-sm font-bold transition-all
                      ${past ? 'text-gray-200 cursor-not-allowed' : 'text-slate-700 hover:z-10'}
                      ${selected ? 'bg-slate-900 !text-white rounded-full z-20 shadow-xl' : ''}
                      ${range && !selected ? 'bg-amber-50 text-amber-900' : ''}
                      ${range && !selected && !endDate ? 'bg-amber-50/50' : ''}
                      ${!past && !selected && !range ? 'hover:bg-gray-50 hover:rounded-xl' : ''}
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

      <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 sticky bottom-0 bg-white z-10">
         <div className="flex gap-10 items-center">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Check-in</span>
              <span className="text-sm font-bold text-slate-900">{startDate || 'Not selected'}</span>
            </div>
            <i className="fa-solid fa-arrow-right-long text-amber-300"></i>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Check-out</span>
              <span className="text-sm font-bold text-slate-900">{endDate || 'Not selected'}</span>
            </div>
         </div>
         {startDate && endDate && (
           <div className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-reveal">
             Range Set
           </div>
         )}
      </div>
    </div>
  );
};

export default DateRangePicker;
