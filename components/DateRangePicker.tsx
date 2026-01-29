
import React, { useState, useMemo } from 'react';

// DateRangePicker component to handle selection of stay dates and number of guests.
interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  guests?: number;
  onChange: (start: string, end: string, guests?: number) => void;
  onClose?: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ startDate, endDate, guests = 2, onChange, onClose }) => {
  const [viewDate, setViewDate] = useState(() => {
    if (startDate && startDate.includes('-')) {
      const parts = startDate.split('-').map(Number);
      if (parts.length === 3 && !parts.some(isNaN)) {
        return new Date(parts[0], parts[1] - 1, 1);
      }
    }
    return new Date();
  });

  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [localGuests, setLocalGuests] = useState(guests);
  const daysOfWeek = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Helper to convert Date object to YYYY-MM-DD string
  const toLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Generates array of days for a given month, including empty slots for alignment
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
      onChange(dateStr, '', localGuests);
    } else {
      if (dateStr < startDate) {
        onChange(dateStr, '', localGuests);
      } else if (dateStr === startDate) {
        onChange('', '', localGuests);
      } else {
        onChange(startDate, dateStr, localGuests);
      }
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isInRange = (date: Date | null) => {
    if (!date || !startDate) return false;
    const dStr = toLocalDateString(date);
    if (endDate) return dStr >= startDate && dStr <= endDate;
    if (hoverDate && dStr >= startDate && dStr <= hoverDate) return true;
    return false;
  };

  const isPast = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return 'Select';
    const parts = dateStr.split('-');
    return `${parts[2]} ${new Date(dateStr).toLocaleString('default', { month: 'short' })}`;
  };

  const handleGuestChange = (delta: number) => {
    const newVal = Math.max(1, Math.min(20, localGuests + delta));
    setLocalGuests(newVal);
    onChange(startDate, endDate, newVal);
  };

  return (
    <div 
      className="bg-white rounded-[3rem] sm:rounded-[4rem] shadow-[0_60px_120px_rgba(0,0,0,0.2)] border border-slate-100 p-8 sm:p-14 w-full max-w-[95vw] md:max-w-5xl animate-scale overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 overflow-hidden">
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-10 px-4">
            <div className="text-left">
              <p className="text-[10px] font-black text-sky-600 uppercase tracking-[0.4em] mb-2">Curate your window</p>
              <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 font-serif">Journey Calendar</h2>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={(e) => { e.stopPropagation(); onChange('', '', localGuests); }}
                className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] hover:text-red-500 transition-all"
              >
                Reset Dates
              </button>
            </div>
          </div>

          <div className="overflow-y-auto no-scrollbar pb-6 px-4">
            <div className="flex flex-col md:flex-row gap-12 lg:gap-16">
              {months.map((m, mIdx) => (
                <div key={`${m.name}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''}`}>
                  <div className="flex items-center justify-between mb-8">
                    {mIdx === 0 ? (
                      <button onClick={handlePrevMonth} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100 shadow-sm active:scale-90">
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                      </button>
                    ) : <div className="w-12" />}
                    
                    <h3 className="font-bold text-slate-900 font-serif text-xl">
                      {m.name} {m.year}
                    </h3>

                    {mIdx === 1 ? (
                      <button onClick={handleNextMonth} className="w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100 shadow-sm active:scale-90">
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    ) : (
                      <button onClick={handleNextMonth} className="md:hidden w-12 h-12 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100 shadow-sm active:scale-90">
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-y-2 mb-3">
                    {daysOfWeek.map(d => (
                      <div key={d} className="text-center text-[10px] font-black text-slate-300 uppercase mb-4 tracking-widest">{d}</div>
                    ))}
                    {m.days.map((day, dIdx) => {
                      if (!day) return <div key={`empty-${mIdx}-${dIdx}`} />;
                      const dStr = toLocalDateString(day);
                      const isStart = dStr === startDate;
                      const isEnd = dStr === endDate;
                      const selected = isStart || isEnd;
                      const range = isInRange(day);
                      const past = isPast(day);
                      const today = isToday(day);
                      
                      const rangeClass = (range && !selected) 
                        ? (endDate ? 'bg-sky-100 text-sky-900' : 'bg-sky-50 text-sky-700') 
                        : '';
                      
                      return (
                        <button
                          key={dIdx}
                          disabled={past}
                          onMouseEnter={() => !endDate && setHoverDate(dStr)}
                          onMouseLeave={() => setHoverDate(null)}
                          onClick={(e) => handleDateClick(e, day)}
                          className={`
                            relative h-12 sm:h-14 w-full flex flex-col items-center justify-center text-xs sm:text-sm font-bold transition-all
                            ${past ? 'text-slate-200 cursor-not-allowed opacity-30' : 'text-slate-700'}
                            ${selected ? 'bg-slate-900 !text-white rounded-2xl z-10 shadow-2xl scale-110' : ''}
                            ${rangeClass}
                            ${!past && !selected && !range ? 'hover:bg-slate-100 rounded-2xl' : ''}
                            ${range && isStart && endDate ? 'rounded-l-2xl' : ''}
                            ${range && isEnd ? 'rounded-r-2xl' : ''}
                          `}
                        >
                          {day.getDate()}
                          {today && !selected && (
                            <span className="absolute bottom-1.5 w-1 h-1 bg-sky-500 rounded-full"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-80 flex flex-col justify-start pt-4 px-4">
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 mb-10 shadow-inner">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Party Size</p>
              <div className="flex items-center justify-between">
                 <button 
                   onClick={() => handleGuestChange(-1)}
                   className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-90 shadow-sm"
                 >
                    <i className="fa-solid fa-minus"></i>
                 </button>
                 <div className="text-center">
                    <p className="text-3xl font-black text-slate-900 leading-none">{localGuests}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Guests</p>
                 </div>
                 <button 
                   onClick={() => handleGuestChange(1)}
                   className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-90 shadow-sm"
                 >
                    <i className="fa-solid fa-plus"></i>
                 </button>
              </div>
           </div>

           <div className="space-y-5">
              <div className="p-6 bg-white border border-slate-50 rounded-[2rem] shadow-sm">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2.5">Arrive</p>
                 <p className="text-base font-black text-slate-900">{startDate ? formatDateLabel(startDate) : 'Choose Date'}</p>
              </div>
              <div className="p-6 bg-white border border-slate-50 rounded-[2rem] shadow-sm">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2.5">Depart</p>
                 <p className="text-base font-black text-slate-900">{endDate ? formatDateLabel(endDate) : 'Choose Date'}</p>
              </div>
           </div>

           <button 
             onClick={onClose}
             className="mt-14 w-full py-7 bg-slate-900 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-sky-600 transition-all active:scale-95"
           >
              Confirm Selection
           </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
