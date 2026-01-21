
import React, { useState, useMemo, useEffect } from 'react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onClose?: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (startDate && startDate.includes('-')) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date();
  });

  useEffect(() => {
    if (startDate && startDate.includes('-')) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        const newView = new Date(parts[0], parts[1] - 1, 1);
        if (newView.getMonth() !== viewDate.getMonth() || newView.getFullYear() !== viewDate.getFullYear()) {
          setViewDate(newView);
        }
      }
    }
  }, [startDate]);

  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const generateMonthData = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    
    const monthName = date.toLocaleString('default', { month: 'long' });
    return { name: monthName, year, days };
  };

  const months = useMemo(() => {
    const d1 = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const d2 = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    return [generateMonthData(d1), generateMonthData(d2)];
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
    if (endDate) return dStr > startDate && dStr < endDate;
    if (hoverDate && dStr > startDate && dStr <= hoverDate) return true;
    return false;
  };

  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '--/--';
    const parts = dateStr.split('-');
    return `${parts[2]}/${parts[1]}`;
  };

  return (
    <div 
      className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 sm:p-6 w-full max-w-[95vw] md:max-w-2xl animate-scale overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header - Compact */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-left">
          <p className="text-[7px] font-black text-sky-600 uppercase tracking-[0.2em] mb-0.5">Reservation</p>
          <h2 className="text-base sm:text-xl font-bold text-slate-900 font-serif">Stay Dates</h2>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="text-[8px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-all px-2 py-1"
        >
          CLEAR
        </button>
      </div>

      {/* Calendar Area */}
      <div className="overflow-y-auto no-scrollbar flex-grow">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 lg:gap-10">
          {months.map((m, mIdx) => (
            <div key={`${m.name}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''}`}>
              <div className="flex items-center justify-between mb-3 px-1">
                {mIdx === 0 ? (
                  <button onClick={handlePrevMonth} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400 border border-slate-100">
                    <i className="fa-solid fa-chevron-left text-[8px]"></i>
                  </button>
                ) : <div className="w-7" />}
                
                <h3 className="font-bold text-slate-800 font-serif text-sm">
                  {m.name} {m.year}
                </h3>

                {mIdx === 1 ? (
                  <button onClick={handleNextMonth} className="w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400 border border-slate-100">
                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                  </button>
                ) : (
                  <button onClick={handleNextMonth} className="md:hidden w-7 h-7 flex items-center justify-center hover:bg-slate-50 rounded-full transition-all text-slate-400 border border-slate-100">
                    <i className="fa-solid fa-chevron-right text-[8px]"></i>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-7 gap-y-0.5 mb-1">
                {daysOfWeek.map(d => (
                  <div key={d} className="text-center text-[7px] font-black text-slate-300 uppercase mb-1">{d}</div>
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
                        relative h-7 sm:h-9 w-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all
                        ${past ? 'text-slate-100 cursor-not-allowed' : 'text-slate-600'}
                        ${selected ? 'bg-sky-600 !text-white rounded-lg z-10 shadow-sm' : ''}
                        ${range && !selected ? 'bg-sky-50 text-sky-600' : ''}
                        ${!past && !selected && !range ? 'hover:bg-slate-50 rounded-lg' : ''}
                      `}
                    >
                      {day.getDate()}
                      {selected && !endDate && startDate === dStr && (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-0.5 bg-white rounded-full"></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer - Extra Compact */}
      <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between gap-3">
         <div className="flex gap-4 items-center bg-slate-50/80 px-4 py-2 rounded-xl border border-slate-100 flex-grow">
            <div className="text-left shrink-0">
              <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">IN</span>
              <span className="text-xs font-black text-slate-900 font-sans tracking-tight">
                {formatDateLabel(startDate)}
              </span>
            </div>
            <div className="w-3 h-[1px] bg-slate-200 shrink-0"></div>
            <div className="text-left shrink-0">
              <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-0.5">OUT</span>
              <span className="text-xs font-black text-slate-900 font-sans tracking-tight">
                {formatDateLabel(endDate)}
              </span>
            </div>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onClose?.(); }}
           className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg hover:bg-sky-600 transition-all active:scale-95"
         >
           CONFIRM
         </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
