
import React, { useState, useEffect } from 'react';
import { generateDateIdeas, analyzeCalendarImage, scoutTrainTickets } from '../services/gemini';
import { CalendarEvent, KanbanColumn, KanbanItem, AppSettings } from '../types';
import { Heart, Calendar as CalendarIcon, Plus, Trash2, Wand2, Link, LayoutGrid, Upload, Loader2, TrainFront, Mail, X, Users, UserX, User, ArrowRight, ChevronLeft, ChevronRight, UploadCloud, Camera, CalendarCheck, Trello, Repeat } from 'lucide-react';

const RelationshipPlanner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'calendar' | 'travel' | 'trello'>('calendar');
  const [nextVisit, setNextVisit] = useState<string>('');
  const [embedUrl, setEmbedUrl] = useState('');
  
  // Pre-filled Trello Example
  const [trelloUrl, setTrelloUrl] = useState('https://trello.com/b/95950596/scrum-board-template'); 
  
  const [daysUntil, setDaysUntil] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [scouting, setScouting] = useState(false);
  const [scoutResult, setScoutResult] = useState('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [gcalConnected, setGcalConnected] = useState(false);
  
  // Calendar View State
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  
  // Travel Scout Persistent State
  const [travelOrigin, setTravelOrigin] = useState('');
  const [travelDest, setTravelDest] = useState('');
  const [travelCard, setTravelCard] = useState('');

  // Modal State for Event Creation with Defaults
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('Date Night: Italienisch essen 🍝');
  const [newEventOwner, setNewEventOwner] = useState<'chris' | 'jette' | 'both'>('both');
  const [newEventType, setNewEventType] = useState<'visit' | 'date' | 'call' | 'other'>('date');
  const [newEventRecurrence, setNewEventRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'>('none');
  
  // DnD State
  const [draggedItem, setDraggedItem] = useState<{ colId: string, itemId: string } | null>(null);
  
  // Board State
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'ideas', title: 'Ideen', items: [] },
    { id: 'todo', title: 'Zu Buchen', items: [] },
    { id: 'done', title: 'Geplant', items: [] }
  ]);
  const [newIdea, setNewIdea] = useState('Picknick im Park 🌳');
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  // Calendar State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date()); // Used for Month/Week/Day focus

  useEffect(() => {
    const savedColumns = localStorage.getItem('plannerColumns');
    if (savedColumns) setColumns(JSON.parse(savedColumns));
    
    const savedVisit = localStorage.getItem('nextVisitDate');
    if (savedVisit) setNextVisit(savedVisit);
    
    const savedUrl = localStorage.getItem('embedUrl');
    if (savedUrl) setEmbedUrl(savedUrl);
    
    const savedTrello = localStorage.getItem('trelloUrl');
    if (savedTrello) setTrelloUrl(savedTrello);

    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) setEvents(JSON.parse(savedEvents));

    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        // Fallback to settings if local Travel state not set
        if (!localStorage.getItem('travelOrigin')) setTravelOrigin(parsedSettings.trainConfig.origin);
        if (!localStorage.getItem('travelDest')) setTravelDest(parsedSettings.trainConfig.destination);
        if (!localStorage.getItem('travelCard')) setTravelCard(parsedSettings.trainConfig.card);
    }

    // Load persisted travel settings
    const lsOrigin = localStorage.getItem('travelOrigin');
    const lsDest = localStorage.getItem('travelDest');
    const lsCard = localStorage.getItem('travelCard');
    if (lsOrigin) setTravelOrigin(lsOrigin);
    if (lsDest) setTravelDest(lsDest);
    if (lsCard) setTravelCard(lsCard);

  }, []);

  // Persist travel settings on change
  useEffect(() => {
      if (travelOrigin) localStorage.setItem('travelOrigin', travelOrigin);
      if (travelDest) localStorage.setItem('travelDest', travelDest);
      if (travelCard) localStorage.setItem('travelCard', travelCard);
  }, [travelOrigin, travelDest, travelCard]);

  useEffect(() => {
    if (nextVisit) {
      const diff = new Date(nextVisit).getTime() - new Date().getTime();
      setDaysUntil(Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
  }, [nextVisit]);

  const saveColumns = (newCols: KanbanColumn[]) => {
    setColumns(newCols);
    localStorage.setItem('plannerColumns', JSON.stringify(newCols));
  };

  const saveTrelloUrl = (url: string) => {
    setTrelloUrl(url);
    localStorage.setItem('trelloUrl', url);
  }

  const addCard = (colId: string, text: string) => {
    if (!text.trim()) return;
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return {
          ...col,
          items: [...col.items, { id: Date.now().toString(), content: text, tags: [] }]
        };
      }
      return col;
    });
    saveColumns(newCols);
    // Reset to another example instead of empty
    setNewIdea('Museumsbesuch 🏛️');
  };

  const deleteCard = (colId: string, itemId: string) => {
    const newCols = columns.map(col => {
      if (col.id === colId) {
        return { ...col, items: col.items.filter(i => i.id !== itemId) };
      }
      return col;
    });
    saveColumns(newCols);
  };

  const handleDragStart = (colId: string, itemId: string) => {
    setDraggedItem({ colId, itemId });
  };

  const handleDrop = (targetColId: string) => {
    if (!draggedItem) return;
    const sourceColIndex = columns.findIndex(c => c.id === draggedItem.colId);
    const targetColIndex = columns.findIndex(c => c.id === targetColId);
    if (sourceColIndex === -1 || targetColIndex === -1) return;
    const sourceCol = columns[sourceColIndex];
    const item = sourceCol.items.find(i => i.id === draggedItem.itemId);
    if (!item) return;
    const newSourceItems = sourceCol.items.filter(i => i.id !== draggedItem.itemId);
    const newTargetItems = [...columns[targetColIndex].items, item];
    const newColumns = [...columns];
    newColumns[sourceColIndex] = { ...sourceCol, items: newSourceItems };
    newColumns[targetColIndex] = { ...columns[targetColIndex], items: newTargetItems };
    saveColumns(newColumns);
    setDraggedItem(null);
  };

  const openAddEvent = (dateStr: string, existingEvent?: CalendarEvent) => {
    if (existingEvent) {
      setSelectedEventId(existingEvent.id);
      setNewEventTitle(existingEvent.title);
      setNewEventDate(existingEvent.date);
      setNewEventEndDate(existingEvent.endDate || '');
      setNewEventOwner(existingEvent.owner);
      setNewEventType(existingEvent.type);
      setNewEventRecurrence(existingEvent.recurrence || 'none');
    } else {
      setSelectedEventId(null);
      setNewEventDate(dateStr);
      setNewEventEndDate('');
      // Default Values
      setNewEventTitle('Date Night: Italienisch essen 🍝');
      setNewEventType('date');
      setNewEventOwner('both');
      setNewEventRecurrence('none');
    }
    setShowEventModal(true);
  };

  const deleteEvent = () => {
    if (!selectedEventId) return;
    if (!window.confirm("Dieses Event wirklich löschen?")) return;
    const newEvents = events.filter(e => e.id !== selectedEventId);
    setEvents(newEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
    setShowEventModal(false);
  };

  const saveNewEvent = () => {
    if (!newEventTitle.trim()) return;
    
    const newEv: CalendarEvent = { 
      id: selectedEventId || Date.now().toString(), 
      title: newEventTitle, 
      date: newEventDate, 
      endDate: newEventEndDate || undefined,
      type: newEventType,
      owner: newEventOwner,
      recurrence: newEventRecurrence
    };
    
    let newEvents = [...events];
    if (selectedEventId) {
      newEvents = newEvents.map(e => e.id === selectedEventId ? newEv : e);
    } else {
      newEvents.push(newEv);
    }
    
    setEvents(newEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
    setShowEventModal(false);
  };

  const quickBlock = (type: 'visit' | 'jette_busy' | 'chris_busy') => {
    let title = '';
    let owner: 'both' | 'jette' | 'chris' = 'both';
    let evType: 'visit' | 'other' = 'other';

    if (type === 'visit') {
      title = 'Besuch ❤️';
      owner = 'both';
      evType = 'visit';
    } else if (type === 'jette_busy') {
      title = 'Jette Blockiert 🚫';
      owner = 'jette';
    } else {
      title = 'Chris Blockiert 🚫';
      owner = 'chris';
    }

    const newEv: CalendarEvent = {
      id: Date.now().toString(),
      title,
      date: newEventDate,
      endDate: newEventEndDate,
      type: evType,
      owner,
      recurrence: 'none'
    };
    const newEvents = [...events, newEv];
    setEvents(newEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
    setShowEventModal(false);
  };

  const processFile = (file: File) => {
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const newEventsData = await analyzeCalendarImage(base64);
        const newEvents: CalendarEvent[] = newEventsData.map((ev: any, i: number) => ({
          id: `imp-${Date.now()}-${i}`,
          title: ev.title,
          date: ev.date,
          owner: ev.owner || 'both',
          type: ev.type || 'other',
          recurrence: 'none'
        }));
        
        const mergedEvents = [...events, ...newEvents];
        setEvents(mergedEvents);
        localStorage.setItem('calendarEvents', JSON.stringify(mergedEvents));
        alert(`Found ${newEvents.length} events!`);
      } catch (err) {
        console.error(err);
        alert('Could not analyze the image. Please try a clearer photo.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleZoneDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleZoneDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const ideas = await generateDateIdeas("Romantik, Abenteuer, Essen");
      const ideasCol = columns.find(c => c.id === 'ideas');
      if (ideasCol && ideas.length > 0) {
        const newItems: KanbanItem[] = ideas.map((idea: string, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          content: idea,
          tags: ['AI']
        }));
        
        const newCols = columns.map(c => 
          c.id === 'ideas' ? { ...c, items: [...c.items, ...newItems] } : c
        );
        saveColumns(newCols);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const handleTrainScout = async () => {
    setScouting(true);
    const today = new Date().toISOString().split('T')[0];
    const upcomingVisits = events
        .filter(e => e.type === 'visit' && e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date));
    
    let searchDate = "";
    if (upcomingVisits.length > 0) {
        searchDate = upcomingVisits[0].date;
    } else {
        let d = new Date();
        d.setDate(d.getDate() + (5 - d.getDay() + 7) % 7);
        searchDate = d.toISOString().split('T')[0];
    }
    
    try {
      // Use local state if set, else defaults from settings handled in service but we pass arguments now
      const result = await scoutTrainTickets(searchDate, travelOrigin, travelDest, travelCard);
      setScoutResult(result || 'Keine Tickets gefunden.');
    } catch (e) {
      console.error(e);
      setScoutResult('Fehler bei der Suche.');
    } finally {
      setScouting(false);
    }
  };

  const toggleGcal = () => {
    if (!gcalConnected) {
      // Mock connecting
      setGcalConnected(true);
      // Add sample events
      const mockEvents: CalendarEvent[] = [
         { id: 'gcal-1', title: 'Work Meeting (GCal)', date: new Date().toISOString().split('T')[0], type: 'other', owner: 'jette', recurrence: 'none' },
         { id: 'gcal-2', title: 'Gym (GCal)', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], type: 'other', owner: 'chris', recurrence: 'none' }
      ];
      // Filter out existing mocks to avoid dupes
      const filtered = events.filter(e => !e.id.startsWith('gcal-'));
      const newEvents = [...filtered, ...mockEvents];
      setEvents(newEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
      alert('Google Calendar connected! Sample events synced.');
    } else {
      setGcalConnected(false);
      // Remove mocks
      const newEvents = events.filter(e => !e.id.startsWith('gcal-'));
      setEvents(newEvents);
      localStorage.setItem('calendarEvents', JSON.stringify(newEvents));
    }
  };

  const shiftDate = (direction: 'next' | 'prev') => {
    const newDate = new Date(currentDate);
    if (calendarView === 'month') {
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  // Recurrence Logic Helper
  const checkRecurrence = (dateStr: string, event: CalendarEvent): boolean => {
      const target = new Date(dateStr);
      const start = new Date(event.date);
      
      // Basic check: Event hasn't started yet
      if (target < start) return false;

      // Regular check for non-recurring or range events
      if (!event.recurrence || event.recurrence === 'none') {
          if (!event.endDate) return event.date === dateStr;
          return dateStr >= event.date && dateStr <= event.endDate;
      }

      // Check recurrence type
      if (event.recurrence === 'daily') return true;
      if (event.recurrence === 'weekly') {
          return target.getDay() === start.getDay();
      }
      if (event.recurrence === 'monthly') {
          return target.getDate() === start.getDate();
      }
      if (event.recurrence === 'yearly') {
          return target.getDate() === start.getDate() && target.getMonth() === start.getMonth();
      }
      return false;
  };

  const getEventsForDate = (dateStr: string) => {
      return events.filter(e => checkRecurrence(dateStr, e));
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    let startDay = firstDayOfMonth.getDay(); 
    if (startDay === 0) startDay = 7; 
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i < startDay; i++) days.push(<div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/30 border-r border-b border-slate-100"></div>);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvents = getEventsForDate(dateStr);
      const dayOfWeek = new Date(dateStr).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; 
      
      days.push(
        <div 
          key={d} 
          className={`
            min-h-[120px] border-r border-b border-slate-100 p-1 relative transition-colors group cursor-pointer
            ${isWeekend ? 'bg-amber-50/40' : 'bg-white hover:bg-slate-50'}
          `}
          onClick={() => openAddEvent(dateStr)}
        >
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold ml-1 ${isWeekend ? 'text-amber-600' : 'text-slate-400'}`}>{d}</span>
            {isWeekend && <span className="text-[9px] font-bold text-amber-500 mr-1 uppercase bg-amber-100 px-1 rounded">WE</span>}
          </div>
          
          <div className="flex flex-col gap-1 mt-1">
            {dayEvents.map(ev => {
              const colorClass = 
                ev.owner === 'chris' ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' :
                ev.owner === 'jette' ? 'bg-rose-100 text-rose-700 border-rose-200 shadow-sm' :
                'bg-purple-100 text-purple-700 border-purple-200 shadow-sm'; // Both
              
              let timeText = "";
              if (ev.endDate && ev.recurrence === 'none') {
                 if (ev.date === dateStr) timeText = "Start";
                 else if (ev.endDate === dateStr) timeText = "Ende";
                 else timeText = "↔";
              }
              if (ev.recurrence && ev.recurrence !== 'none') timeText = "↺";

              return (
                <div 
                  key={ev.id} 
                  onClick={(e) => { e.stopPropagation(); openAddEvent(dateStr, ev); }}
                  className={`text-[10px] px-1.5 py-1 rounded border font-medium truncate cursor-pointer hover:opacity-80 flex justify-between ${colorClass}`}
                >
                  <span className="truncate">{ev.title}</span>
                  {timeText && <span className="opacity-50 text-[9px]">{timeText}</span>}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  const renderWeekView = () => {
      // Calculate Monday of current week
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(currentDate);
      monday.setDate(diff);

      const days = [];
      for (let i = 0; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const dateStr = d.toISOString().split('T')[0];
          const dayEvents = getEventsForDate(dateStr);
          const isToday = new Date().toISOString().split('T')[0] === dateStr;

          days.push(
              <div key={i} className="flex-1 min-w-[140px] border-r border-slate-100 bg-white flex flex-col">
                  <div className={`p-2 text-center border-b border-slate-100 ${isToday ? 'bg-rose-50' : ''}`}>
                      <div className="text-xs text-slate-500 uppercase font-bold">{d.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                      <div className={`text-lg font-bold ${isToday ? 'text-rose-600' : 'text-slate-700'}`}>{d.getDate()}</div>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto" onClick={() => openAddEvent(dateStr)}>
                      {dayEvents.map(ev => (
                          <div 
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); openAddEvent(dateStr, ev); }}
                            className={`p-2 rounded-xl text-xs font-medium border shadow-sm cursor-pointer ${
                                ev.owner === 'chris' ? 'bg-blue-100 border-blue-200 text-blue-800' :
                                ev.owner === 'jette' ? 'bg-rose-100 border-rose-200 text-rose-800' :
                                'bg-purple-100 border-purple-200 text-purple-800'
                            }`}
                          >
                              {ev.title}
                              {ev.recurrence !== 'none' && <span className="block text-[9px] opacity-60 mt-1">Recurring</span>}
                          </div>
                      ))}
                  </div>
              </div>
          )
      }
      return <div className="flex h-[500px] overflow-x-auto border border-slate-100 rounded-b-3xl">{days}</div>;
  };

  const renderDayView = () => {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayEvents = getEventsForDate(dateStr);
      
      return (
          <div className="bg-white min-h-[400px] p-6 rounded-b-3xl border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                  <h5 className="text-xl font-bold text-slate-800">{currentDate.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</h5>
                  <button onClick={() => openAddEvent(dateStr)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><Plus size={16}/> Add Event</button>
              </div>
              
              {dayEvents.length === 0 ? (
                  <div className="text-center py-20 text-slate-300">
                      <CalendarIcon size={48} className="mx-auto mb-2"/>
                      <p>No events planned for today.</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                      {dayEvents.map(ev => (
                          <div 
                            key={ev.id}
                            onClick={() => openAddEvent(dateStr, ev)}
                            className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer hover:opacity-90 ${
                                ev.owner === 'chris' ? 'bg-blue-50 border-blue-200' :
                                ev.owner === 'jette' ? 'bg-rose-50 border-rose-200' :
                                'bg-purple-50 border-purple-200'
                            }`}
                          >
                              <div>
                                  <h6 className="font-bold text-slate-700">{ev.title}</h6>
                                  <div className="flex gap-2 text-xs text-slate-500 mt-1">
                                      <span className="uppercase">{ev.owner}</span>
                                      <span>•</span>
                                      <span className="uppercase">{ev.type}</span>
                                      {ev.recurrence !== 'none' && (
                                          <>
                                            <span>•</span>
                                            <span className="flex items-center gap-1"><Repeat size={10}/> {ev.recurrence}</span>
                                          </>
                                      )}
                                  </div>
                              </div>
                              <ArrowRight size={18} className="text-slate-300"/>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  };

  const getTitle = () => {
      if (calendarView === 'month') return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      if (calendarView === 'day') return currentDate.toLocaleDateString('de-DE');
      return "Weekly View";
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Heart className="text-rose-500" fill="currentColor" />
            Relationship Planner
          </h3>
          <p className="text-slate-500 text-sm mt-1">Shared calendar, date ideas, and travel planning for Jette & Chris.</p>
        </div>
        
        {daysUntil !== null && (
          <div className="flex flex-col items-center bg-rose-50 px-6 py-2 rounded-2xl border border-rose-100">
             <span className="text-3xl font-bold text-rose-600">{daysUntil}</span>
             <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Days until Visit</span>
          </div>
        )}
      </div>

      {/* Nav Tabs */}
      <div className="flex gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-slate-100 overflow-x-auto">
        <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'calendar' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}><CalendarIcon size={16} /> Calendar</button>
        <button onClick={() => setActiveTab('board')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'board' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}><LayoutGrid size={16} /> Ideas Board</button>
        <button onClick={() => setActiveTab('travel')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'travel' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}><TrainFront size={16} /> Scout Travel</button>
        <button onClick={() => setActiveTab('trello')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'trello' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}><Trello size={16} /> Trello</button>
      </div>

      {/* --- CALENDAR TAB --- */}
      {activeTab === 'calendar' && (
        <>
          <div className="flex justify-between items-center mb-2">
             <div className="flex bg-white rounded-xl border border-slate-200 p-1">
                 <button onClick={() => setCalendarView('month')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'month' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Month</button>
                 <button onClick={() => setCalendarView('week')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'week' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Week</button>
                 <button onClick={() => setCalendarView('day')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${calendarView === 'day' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Day</button>
             </div>
             
             <button 
              onClick={toggleGcal} 
              className={`text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 border transition-all ${gcalConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
            >
              <CalendarCheck size={14} />
              {gcalConnected ? 'GCal Synced' : 'Sync GCal'}
            </button>
          </div>

          {/* Handwritten Upload Zone (Only show on Month view to save space) */}
          {calendarView === 'month' && (
            <div 
                className={`flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-dashed transition-all mb-6 ${isDragOver ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-200' : 'border-slate-300'}`}
                onDragOver={handleZoneDragOver}
                onDragLeave={handleZoneDragLeave}
                onDrop={handleZoneDrop}
            >
                <div className="flex items-center gap-4">
                <div className={`p-4 rounded-full ${isDragOver ? 'bg-rose-100 text-rose-600 animate-bounce' : 'bg-slate-50 border border-slate-200 text-slate-500'}`}>
                    {isDragOver ? <UploadCloud size={24} /> : <Camera size={24} />}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800">Digitize Handwritten Calendar</p>
                    <p className="text-xs text-slate-500">Upload a photo of your weekly overview. AI detects weekend visits.</p>
                </div>
                </div>
                <label className="cursor-pointer bg-slate-800 text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-slate-900 transition-all flex items-center gap-2">
                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
                    {uploading ? 'Analyzing...' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
              <h4 className="font-bold text-lg text-slate-700">{getTitle()}</h4>
              <div className="flex gap-2">
                <button onClick={() => shiftDate('prev')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronLeft size={20} /></button>
                <button onClick={() => shiftDate('next')} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><ChevronRight size={20} /></button>
              </div>
            </div>
            
            {calendarView === 'month' && (
                <>
                    <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50">
                    {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
                        <div key={d} className="py-2 text-xs font-bold text-slate-400 uppercase">{d}</div>
                    ))}
                    </div>
                    <div className="grid grid-cols-7">
                    {renderMonthView()}
                    </div>
                </>
            )}

            {calendarView === 'week' && renderWeekView()}
            {calendarView === 'day' && renderDayView()}
            
            {/* Legend */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-4 justify-center text-[10px] font-bold uppercase text-slate-500 rounded-b-3xl">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div> Chris</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-100 border border-rose-200 rounded"></div> Jette</div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> Both</div>
            </div>
          </div>
        </>
      )}

      {/* --- BOARD TAB --- */}
      {activeTab === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
          {columns.map(col => (
            <div 
              key={col.id} 
              className="flex flex-col bg-slate-100/50 rounded-2xl border border-slate-100 h-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(col.id)}
            >
              <div className="p-4 border-b border-slate-100/50 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                <h4 className="font-bold text-slate-700">{col.title}</h4>
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{col.items.length}</span>
              </div>
              <div className="p-3 flex-1 overflow-y-auto space-y-3">
                {col.id === 'ideas' && (
                  <button 
                    onClick={handleGenerateIdeas}
                    disabled={loadingIdeas}
                    className="w-full py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm mb-2 hover:shadow-md transition-all"
                  >
                    {loadingIdeas ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                    {loadingIdeas ? 'Brainstorming...' : 'AI Idea Generator'}
                  </button>
                )}
                {col.items.map(item => (
                   <div 
                     key={item.id}
                     draggable
                     onDragStart={() => handleDragStart(col.id, item.id)}
                     className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-rose-300 transition-colors group"
                   >
                     <div className="flex justify-between items-start">
                       <p className="text-sm text-slate-700 font-medium leading-tight">{item.content}</p>
                       <button onClick={() => deleteCard(col.id, item.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                     </div>
                     {item.tags.length > 0 && (
                       <div className="flex gap-1 mt-2">
                         {item.tags.map(t => (
                           <span key={t} className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-bold">{t}</span>
                         ))}
                       </div>
                     )}
                   </div>
                ))}
              </div>
              <div className="p-3 bg-slate-50/50 rounded-b-2xl">
                <div className="flex gap-2">
                  <input 
                    value={newIdea}
                    onChange={(e) => setNewIdea(e.target.value)}
                    placeholder="Add item..." 
                    className="flex-1 bg-white border-none rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-rose-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addCard(col.id, newIdea);
                      }
                    }}
                  />
                  <button onClick={() => addCard(col.id, newIdea)} className="bg-white p-2 rounded-lg text-slate-400 hover:text-rose-600"><Plus size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- TRAVEL SCOUT TAB --- */}
      {activeTab === 'travel' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
           <h4 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
             <TrainFront className="text-rose-500" />
             Travel Scout
           </h4>
           <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
              <p className="text-sm text-slate-600 mb-4">
                Nutze AI, um die besten Bahnverbindungen basierend auf deinem Kalender und deinen Einstellungen zu finden.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start</label>
                      <input value={travelOrigin} onChange={(e) => setTravelOrigin(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="Göttingen" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Ziel</label>
                      <input value={travelDest} onChange={(e) => setTravelDest(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="Berlin" />
                  </div>
                  <div>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">BahnCard</label>
                      <input value={travelCard} onChange={(e) => setTravelCard(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm" placeholder="BahnCard 25 (2. Kl)" />
                  </div>
              </div>

              <button 
                onClick={handleTrainScout}
                disabled={scouting}
                className="w-full bg-rose-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {scouting ? <Loader2 className="animate-spin" /> : <TrainFront size={18} />}
                Scout Tickets für nächsten Besuch
              </button>
           </div>
           
           {scoutResult && (
             <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
               <h5 className="font-bold text-slate-800 mb-3">Scout Report</h5>
               <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap">
                 {scoutResult}
               </div>
             </div>
           )}
        </div>
      )}

      {/* --- TRELLO TAB --- */}
      {activeTab === 'trello' && (
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-[600px] flex flex-col">
            <h4 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
              <Trello className="text-blue-600" />
              Trello Board Embed
            </h4>
            
            <div className="flex gap-2 mb-4">
               <input 
                 value={trelloUrl}
                 onChange={(e) => saveTrelloUrl(e.target.value)}
                 placeholder="Paste Trello Board URL (e.g. https://trello.com/b/xyz...)"
                 className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
               />
               {trelloUrl && <button onClick={() => saveTrelloUrl('')} className="bg-slate-100 hover:bg-slate-200 p-2 rounded-xl text-slate-500"><X size={18}/></button>}
            </div>

            <div className="flex-1 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
               {trelloUrl ? (
                 <iframe 
                   src={trelloUrl.replace('/b/', '/b/').endsWith('.html') ? trelloUrl : trelloUrl + '.html'} 
                   className="w-full h-full border-0"
                   title="Trello Board"
                 />
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                    <Trello size={48} />
                    <p className="font-medium">No Board Loaded</p>
                    <p className="text-xs">Paste your board URL above to view it here.</p>
                 </div>
               )}
            </div>
         </div>
      )}

      {/* Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h4 className="text-xl font-bold text-slate-800">{selectedEventId ? 'Edit Event' : 'New Event'}</h4>
                <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20}/></button>
             </div>

             <div className="space-y-4">
                <input 
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="Event Title (e.g. Visit Chris)" 
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-lg focus:ring-2 focus:ring-rose-500"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Start Date</label>
                    <input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">End Date (Opt)</label>
                    <input type="date" value={newEventEndDate} onChange={e => setNewEventEndDate(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl px-4 py-2" />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Who?</label>
                   <div className="flex gap-2">
                      <button onClick={() => setNewEventOwner('jette')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newEventOwner === 'jette' ? 'bg-rose-100 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}>Jette</button>
                      <button onClick={() => setNewEventOwner('chris')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newEventOwner === 'chris' ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>Chris</button>
                      <button onClick={() => setNewEventOwner('both')} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newEventOwner === 'both' ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-500'}`}>Both</button>
                   </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Recurrence</label>
                    <select 
                        value={newEventRecurrence} 
                        onChange={(e) => setNewEventRecurrence(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
                    >
                        <option value="none">None</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                    </select>
                </div>

                {!selectedEventId && (
                  <div className="flex flex-col gap-2 mt-2">
                    <p className="text-xs font-bold text-slate-400 uppercase">Quick Actions</p>
                    <div className="flex gap-2">
                       <button onClick={() => quickBlock('visit')} className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1"><Heart size={12}/> Visit</button>
                       <button onClick={() => quickBlock('jette_busy')} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-xl">Jette Busy</button>
                       <button onClick={() => quickBlock('chris_busy')} className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold py-2 rounded-xl">Chris Busy</button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  {selectedEventId && (
                    <button onClick={deleteEvent} className="px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={18} /></button>
                  )}
                  <button onClick={saveNewEvent} className="flex-1 bg-rose-600 text-white font-bold py-3 rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-100">Save Event</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipPlanner;
