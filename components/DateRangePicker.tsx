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

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    const dStr = toLocalDateString(date);
    return dStr === startDate || dStr === endDate;
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
      className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.15)] border border-slate-100 p-6 sm:p-10 w-full max-w-[95vw] md:max-w-4xl animate-scale overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[85vh]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col lg:flex-row gap-10 overflow-hidden">
        <div className="flex-grow">
          <div className="flex justify-between items-center mb-8 px-2">
            <div className="text-left">
              <p className="text-[9px] font-black text-sky-600 uppercase tracking-[0.3em] mb-1">Stay Window</p>
              <h2 className="text-xl sm:text-3xl font-bold text-slate-900 font-serif">Select Dates</h2>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => { e.stopPropagation(); onChange('', '', localGuests); }}
                className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-red-500 transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-y-auto no-scrollbar pb-4 px-2">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
              {months.map((m, mIdx) => (
                <div key={`${m.name}-${mIdx}`} className={`flex-1 ${mIdx === 1 ? 'hidden md:block' : ''}`}>
                  <div className="flex items-center justify-between mb-6">
                    {mIdx === 0 ? (
                      <button onClick={handlePrevMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100">
                        <i className="fa-solid fa-chevron-left text-xs"></i>
                      </button>
                    ) : <div className="w-10" />}
                    
                    <h3 className="font-bold text-slate-900 font-serif text-lg">
                      {m.name} {m.year}
                    </h3>

                    {mIdx === 1 ? (
                      <button onClick={handleNextMonth} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100">
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    ) : (
                      <button onClick={handleNextMonth} className="md:hidden w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400 border border-slate-100">
                        <i className="fa-solid fa-chevron-right text-xs"></i>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-7 gap-y-1 mb-2">
                    {daysOfWeek.map(d => (
                      <div key={d} className="text-center text-[9px] font-black text-slate-300 uppercase mb-2 tracking-widest">{d}</div>
                    ))}
                    {m.days.map((day, dIdx) => {
                      if (!day) return <div key={`empty-${mIdx}-${dIdx}`} />;
                      const dStr = toLocalDateString(day);
                      const selected = isSelected(day);
                      const range = isInRange(day);
                      const past = isPast(day);
                      const isStart = dStr === startDate;
                      const isEnd = dStr === endDate;
                      
                      return (
                        <button
                          key={dIdx}
                          disabled={past}
                          onMouseEnter={() => !endDate && setHoverDate(dStr)}
                          onMouseLeave={() => setHoverDate(null)}
                          onClick={(e) => handleDateClick(e, day)}
                          className={`
                            relative h-10 sm:h-12 w-full flex items-center justify-center text-[11px] sm:text-sm font-bold transition-all
                            ${past ? 'text-slate-200 cursor-not-allowed' : 'text-slate-600'}
                            ${selected ? 'bg-slate-900 !text-white rounded-xl z-10 shadow-lg scale-110' : ''}
                            ${range && !selected ? 'bg-sky-50 text-sky-600' : ''}
                            ${!past && !selected && !range ? 'hover:bg-slate-50 rounded-xl' : ''}
                            ${range && isStart ? 'rounded-l-xl' : ''}
                            ${range && isEnd ? 'rounded-r-xl' : ''}
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
          </div>
        </div>

        <div className="lg:w-64 flex flex-col justify-start pt-2 px-2">
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Travelers</p>
              <div className="flex items-center justify-between">
                 <button 
                   onClick={() => handleGuestChange(-1)}
                   className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-90 shadow-sm"
                 >
                    <i className="fa-solid fa-minus"></i>
                 </button>
                 <div className="text-center">
                    <p className="text-xl font-black text-slate-900 leading-none">{localGuests}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Guests</p>
                 </div>
                 <button 
                   onClick={() => handleGuestChange(1)}
                   className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-600 transition-all active:scale-90 shadow-sm"
                 >
                    <i className="fa-solid fa-plus"></i>
                 </button>
              </div>
           </div>

           <div className="space-y-4">
              <div className="p-5 bg-white border border-slate-100 rounded-3xl">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Check-in</p>
                 <p className="text-sm font-bold text-slate-900">{formatDateLabel(startDate)}</p>
              </div>
              <div className="p-5 bg-white border border-slate-100 rounded-3xl">
                 <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-2">Check-out</p>
                 <p className="text-sm font-bold text-slate-900">{formatDateLabel(endDate)}</p>
              </div>
           </div>

           <button 
             onClick={onClose}
             className="mt-12 w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-sky-600 transition-all active:scale-95"
           >
              Apply Dates
           </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;