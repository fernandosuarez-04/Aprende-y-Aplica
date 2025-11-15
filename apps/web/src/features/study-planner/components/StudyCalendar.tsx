'use client';

import { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion } from 'framer-motion';
import type { StudySession, DayHeaderContentArg, EventClickArg, DateSelectArg } from '@fullcalendar/core';
import type { StudySession as StudySessionType } from '@repo/shared/types';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';

interface StudyCalendarProps {
  sessions: StudySessionType[];
  onEventClick?: (session: StudySessionType) => void;
  onDateSelect?: (start: Date, end: Date) => void;
  onEventDrop?: (sessionId: string, newStart: Date, newEnd: Date) => void;
  loading?: boolean;
}

export function StudyCalendar({
  sessions,
  onEventClick,
  onDateSelect,
  onEventDrop,
  loading = false,
}: StudyCalendarProps) {
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');
  const calendarRef = useRef<FullCalendar>(null);

  // Convertir sesiones a eventos de FullCalendar
  const events = sessions.map((session) => ({
    id: session.id,
    title: session.title,
    start: session.start_time,
    end: session.end_time,
    backgroundColor: getStatusColor(session.status),
    borderColor: getStatusColor(session.status),
    extendedProps: {
      session,
    },
  }));

  const handleEventClick = (clickInfo: EventClickArg) => {
    const session = clickInfo.event.extendedProps.session as StudySessionType;
    if (onEventClick) {
      onEventClick(session);
    }
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    if (onDateSelect) {
      onDateSelect(selectInfo.start, selectInfo.end);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = (dropInfo: any) => {
    const session = dropInfo.event.extendedProps.session as StudySessionType;
    if (onEventDrop) {
      onEventDrop(session.id, dropInfo.event.start!, dropInfo.event.end || dropInfo.event.start!);
    }
  };

  const handleViewChange = (viewName: string) => {
    if (viewName === 'dayGridMonth' || viewName === 'timeGridWeek' || viewName === 'timeGridDay') {
      setView(viewName);
    }
  };

  function getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#10b981'; // green
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'planned':
        return '#6366f1'; // indigo
      case 'cancelled':
        return '#ef4444'; // red
      case 'skipped':
        return '#6b7280'; // gray
      default:
        return '#6366f1';
    }
  }

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header con controles */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-primary" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Calendario de Estudio
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setView('dayGridMonth');
                calendarRef.current?.getApi().changeView('dayGridMonth');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'dayGridMonth'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => {
                setView('timeGridWeek');
                calendarRef.current?.getApi().changeView('timeGridWeek');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'timeGridWeek'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => {
                setView('timeGridDay');
                calendarRef.current?.getApi().changeView('timeGridDay');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === 'timeGridDay'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Día
            </button>
          </div>
        </div>

        {/* Leyenda de estados */}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Planificado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">En progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">Omitido</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={view}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '',
            }}
            events={events}
            eventClick={handleEventClick}
            selectable={true}
            select={handleDateSelect}
            editable={true}
            eventDrop={handleEventDrop}
            eventResize={handleEventDrop}
            locale="es"
            height="auto"
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            allDaySlot={false}
            dayHeaderFormat={{ weekday: 'short' }}
            dayHeaderContent={(arg: DayHeaderContentArg) => (
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {arg.text}
              </div>
            )}
            eventContent={(eventInfo) => (
              <div className="p-1">
                <div className="text-xs font-medium truncate">{eventInfo.event.title}</div>
                {view !== 'dayGridMonth' && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {eventInfo.timeText}
                  </div>
                )}
              </div>
            )}
            className="fc-custom"
          />
        )}
      </div>

      <style jsx global>{`
        .fc-custom {
          --fc-border-color: rgb(229 231 235);
          --fc-daygrid-event-dot-width: 8px;
          --fc-event-border-radius: 8px;
        }
        .dark .fc-custom {
          --fc-border-color: rgb(55 65 81);
          --fc-page-bg-color: rgb(17 24 39);
          --fc-neutral-bg-color: rgb(31 41 55);
          --fc-neutral-text-color: rgb(209 213 219);
          --fc-button-bg-color: rgb(55 65 81);
          --fc-button-border-color: rgb(75 85 99);
          --fc-button-hover-bg-color: rgb(75 85 99);
          --fc-button-hover-border-color: rgb(107 114 128);
          --fc-button-active-bg-color: rgb(37 99 235);
          --fc-button-active-border-color: rgb(37 99 235);
          --fc-today-bg-color: rgba(37, 99, 235, 0.1);
        }
        .fc-custom .fc-button {
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .fc-custom .fc-button-primary {
          background-color: rgb(37 99 235);
          border-color: rgb(37 99 235);
        }
        .fc-custom .fc-button-primary:hover {
          background-color: rgb(29 78 216);
          border-color: rgb(29 78 216);
        }
        .fc-custom .fc-event {
          cursor: pointer;
          border: none;
          padding: 2px 4px;
        }
        .fc-custom .fc-event:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }
        .fc-custom .fc-daygrid-day-number {
          color: rgb(107 114 128);
        }
        .dark .fc-custom .fc-daygrid-day-number {
          color: rgb(209 213 219);
        }
        .fc-custom .fc-col-header-cell-cushion {
          color: rgb(55 65 81);
          font-weight: 600;
        }
        .dark .fc-custom .fc-col-header-cell-cushion {
          color: rgb(209 213 219);
        }
      `}</style>
    </div>
  );
}

