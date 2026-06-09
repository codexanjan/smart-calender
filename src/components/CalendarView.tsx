import React, { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import type { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onSelectDates: (dates: { start: string; end: string; allDay: boolean }) => void;
  onSelectEvent: (event: CalendarEvent) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onSelectDates,
  onSelectEvent,
}) => {
  const calendarRef = useRef<FullCalendar>(null);

  // Map application events to FullCalendar event format
  const formattedEvents = events.map((event) => {
    // Prefix title if it's a birthday or anniversary
    let displayTitle = event.title;
    let categoryClass = `cat-${event.category.toLowerCase()}`;

    if (event.isBirthday) {
      displayTitle = `🎂 ${event.title}`;
      categoryClass = 'cat-birthday';
    } else if (event.isAnniversary) {
      displayTitle = `🥂 ${event.title}`;
      categoryClass = 'cat-anniversary';
    }

    return {
      id: event.id,
      title: displayTitle,
      start: event.start,
      end: event.end,
      allDay: event.isAllDay,
      className: categoryClass,
      extendedProps: event,
    };
  });

  // Handle slot/date selection
  const handleSelect = (selectInfo: any) => {
    onSelectDates({
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      allDay: selectInfo.allDay,
    });
    
    // Clear selection highlighting
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  };

  // Handle clicking an event
  const handleEventClick = (clickInfo: any) => {
    const rawEvent = clickInfo.event.extendedProps as CalendarEvent;
    // FullCalendar drops standard properties into clickInfo.event, but we want the full raw model
    onSelectEvent({
      ...rawEvent,
      id: clickInfo.event.id,
      title: rawEvent.title, // Keep original title without prefix
      start: clickInfo.event.startStr,
      end: clickInfo.event.endStr,
      isAllDay: clickInfo.event.allDay,
    });
  };

  return (
    <div className="w-full h-full p-4 rounded-2xl glass-card text-slate-800 dark:text-slate-200">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        buttonText={{
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          listWeek: 'Agenda',
        }}
        events={formattedEvents}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={3}
        weekends={true}
        select={handleSelect}
        eventClick={handleEventClick}
        eventContent={(eventInfo) => {
          const rawEvent = eventInfo.event.extendedProps as CalendarEvent;
          return (
            <div className="fc-event-custom-content">
              {rawEvent.photoUrl && (
                <img 
                  src={rawEvent.photoUrl} 
                  alt="" 
                  className="fc-event-thumbnail"
                />
              )}
              <span className="fc-event-title-text truncate select-none">
                {eventInfo.event.title}
              </span>
            </div>
          );
        }}
        height="auto"
        aspectRatio={1.35}
        nowIndicator={true}
        slotMinTime="06:00:00" // Start schedule grid at 6 AM
        slotMaxTime="23:00:00" // End schedule grid at 11 PM
      />
    </div>
  );
};
