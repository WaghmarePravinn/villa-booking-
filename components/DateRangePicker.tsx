
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

  const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

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

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '--/--';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  return (
    <div 
      className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] border border-slate-100 p-6 sm:p-10 w-full max-w-[340px] sm:max-w-none sm:w-auto animate-scale overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="text-left">
          <p className="text-[10px] font-black text-sky-500 uppercase tracking-widest leading-none mb-2">Stay Schedule</p>
          <h2 className="text-2xl font-bold text-slate-900 font-serif leading-none">Choose Dates</h2>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onChange('', ''); }}
          className="text-[11px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-all pt-2"
        >
          RESET
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-16 relative">
        {months.map((m, mIdx) => (
          <div key={`${m.name}-${m.year}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''} min-w-[280px]`}>
            {/* Month Navigation Row */}
            <div className="flex items-center justify-between mb-6">
              {mIdx === 0 ? (
                <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                  <i className="fa-solid fa-chevron-left text-slate-400 text-xs"></i>
                </button>
              ) : <div className="w-8" />}
              
              <h3 className="font-bold text-slate-800 font-serif text-lg">
                {m.name} {m.year}
              </h3>

              {(mIdx === 1 || (mIdx === 0 && window.innerWidth < 768)) ? (
                <button onClick={handleNextMonth} className="p-2 hover:bg-slate-50 rounded-full transition-all">
                  <i className="fa-solid fa-chevron-right text-slate-400 text-xs"></i>
                </button>
              ) : <div className="w-8" />}
            </div>

            <div className="grid grid-cols-7 gap-y-1 mb-2">
              {daysOfWeek.map(d => (
                <div key={d} className="text-center text-[9px] font-black text-slate-200 uppercase mb-2 tracking-widest">{d}</div>
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
                      relative h-10 sm:h-12 w-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all
                      ${past ? 'text-slate-100 cursor-not-allowed' : 'text-slate-500'}
                      ${selected ? 'bg-[#0088cc] !text-white rounded-xl z-20 shadow-lg' : ''}
                      ${range && !selected ? 'bg-sky-50 text-[#0088cc]' : ''}
                      ${!past && !selected && !range ? 'hover:bg-slate-50 rounded-xl' : ''}
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

      {/* Footer */}
      <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
         <div className="flex gap-8 items-center">
            <div className="text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block leading-none mb-2">Check-In</span>
              <span className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                {formatDateLabel(startDate)}
              </span>
            </div>
            <div className="w-6 h-[2px] bg-slate-100"></div>
            <div className="text-left">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block leading-none mb-2">Check-Out</span>
              <span className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                {formatDateLabel(endDate)}
              </span>
            </div>
         </div>
         <button 
           onClick={(e) => { e.stopPropagation(); onClose?.(); }}
           className="w-full sm:w-auto px-12 py-5 bg-[#0088cc] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-sky-600/20 hover:bg-[#0077bb] transition-all active:scale-95"
         >
           CONFIRM STAY
         </button>
      </div>
    </div>
  );
};

export default DateRangePicker;
