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
      className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] border border-gray-100 p-4 sm:p-10 w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar relative animate-scale"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center border-b border-gray-100 mb-4 sm:mb-8 pb-3 sm:pb-5 sticky top-0 bg-white z-[30]">
        <div className="flex flex-col text-left">
          <span className="text-[8px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest mb-0.5">Select Stay</span>
          <span className="text-lg sm:text-2xl font-bold text-slate-900 font-serif">Stay Dates</span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="px-3 py-1.5 rounded-xl text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-all border border-transparent hover:border-red-50 hover:bg-red-50/50"
        >
          Clear Selection
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16 relative">
        <button 
          onClick={handlePrevMonth}
          className="absolute left-[-5px] top-0 p-2 sm:p-3 hover:bg-gray-50 rounded-2xl transition-all z-20 group"
        >
          <i className="fa-solid fa-chevron-left text-xs text-slate-300 group-hover:text-amber-500"></i>
        </button>
        <button 
          onClick={handleNextMonth}
          className="absolute right-[-5px] top-0 p-2 sm:p-3 hover:bg-gray-50 rounded-2xl transition-all z-20 group"
        >
          <i className="fa-solid fa-chevron-right text-xs text-slate-300 group-hover:text-amber-500"></i>
        </button>

        {months.map((m, mIdx) => (
          <div key={`${m.name}-${m.year}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''}`}>
            <h3 className="text-center font-bold text-slate-800 mb-4 sm:mb-6 font-serif text-base sm:text-xl">
              {m.name} {m.year}
            </h3>
            <div className="grid grid-cols-7 gap-y-0.5 sm:gap-y-1">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[8px] sm:text-[10px] font-black text-slate-300 uppercase mb-2 tracking-widest">{d}</div>
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
                      relative h-8 sm:h-11 w-full flex items-center justify-center text-[10px] sm:text-sm font-bold transition-all
                      ${past ? 'text-gray-200 cursor-not-allowed opacity-30' : 'text-slate-700'}
                      ${selected ? 'bg-slate-900 !text-white rounded-full z-20 shadow-md sm:shadow-lg' : ''}
                      ${range && !selected ? 'bg-amber-50 text-amber-900' : ''}
                      ${!past && !selected && !range ? 'hover:bg-gray-100 rounded-xl' : ''}
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

      <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-gray-100 flex items-center justify-between sticky bottom-[-16px] sm:bottom-[-20px] bg-white z-[30] pb-2">
         <div className="flex gap-4 sm:gap-6 items-center">
            <div className="flex flex-col text-left">
              <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Arrival</span>
              <span className="text-[11px] sm:text-sm font-bold text-slate-900">{startDate ? startDate.split('-').reverse().join('/') : '--/--/--'}</span>
            </div>
            <i className="fa-solid fa-arrow-right-long text-amber-300 text-xs"></i>
            <div className="flex flex-col text-left">
              <span className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest">Departure</span>
              <span className="text-[11px] sm:text-sm font-bold text-slate-900">{endDate ? endDate.split('-').reverse().join('/') : '--/--/--'}</span>
            </div>
         </div>
         <div className="flex gap-2">
           <button 
             onClick={(e) => { e.stopPropagation(); onClose?.(); }}
             className="px-5 sm:px-8 py-3 sm:py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
           >
             Confirm Dates
           </button>
         </div>
      </div>
    </div>
  );
};

export default DateRangePicker;