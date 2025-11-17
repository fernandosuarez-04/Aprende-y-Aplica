'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Colores más brillantes y saturados para mejor visibilidad en modo oscuro
    switch (status) {
      case 'completed':
        return '#22c55e'; // green más brillante
      case 'in_progress':
        return '#3b82f6'; // blue
      case 'planned':
        return '#6366f1'; // indigo
      case 'cancelled':
        return '#f87171'; // red más brillante
      case 'skipped':
        return '#9ca3af'; // gray más claro
      default:
        return '#6366f1';
    }
  }

  // Función para aplicar estilos oscuros directamente al DOM
  const applyDarkModeStyles = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const isDarkMode = document.documentElement.classList.contains('dark');
    if (!isDarkMode) return;

    // Buscar todos los elementos de encabezado de columna
    const headerCells = document.querySelectorAll('.fc-custom .fc-col-header-cell, .fc-custom [class*="fc-col-header-cell"]');
    const headerRows = document.querySelectorAll('.fc-custom .fc-col-header, .fc-custom [class*="fc-col-header"]');
    const scrollGridHeaders = document.querySelectorAll('.fc-custom .fc-scrollgrid-section-header, .fc-custom [class*="fc-scrollgrid-section-header"]');
    const theadElements = document.querySelectorAll('.fc-custom .fc-scrollgrid thead, .fc-custom .fc-scrollgrid > thead');

    const darkBackground = 'rgb(31, 41, 55)';
    const darkBorder = 'rgb(55, 65, 81)';
    const darkText = 'rgb(243, 244, 246)';

    // Aplicar estilos a celdas de encabezado
    headerCells.forEach((cell) => {
      const element = cell as HTMLElement;
      element.style.backgroundColor = darkBackground;
      element.style.background = darkBackground;
      element.style.borderColor = darkBorder;
      // Aplicar también a hijos
      const children = element.querySelectorAll('*');
      children.forEach((child) => {
        const childElement = child as HTMLElement;
        if (childElement.tagName === 'A' || childElement.classList.contains('fc-col-header-cell-cushion')) {
          childElement.style.color = darkText;
        }
      });
    });

    // Aplicar estilos a filas de encabezado
    headerRows.forEach((row) => {
      const element = row as HTMLElement;
      element.style.backgroundColor = darkBackground;
      element.style.background = darkBackground;
      // Aplicar a td y th dentro
      const cells = element.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.backgroundColor = darkBackground;
        cellElement.style.background = darkBackground;
        cellElement.style.borderColor = darkBorder;
      });
    });

    // Aplicar estilos a scrollgrid headers
    scrollGridHeaders.forEach((header) => {
      const element = header as HTMLElement;
      element.style.backgroundColor = darkBackground;
      element.style.background = darkBackground;
      const cells = element.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.backgroundColor = darkBackground;
        cellElement.style.background = darkBackground;
        cellElement.style.borderColor = darkBorder;
      });
    });

    // Aplicar estilos a thead
    theadElements.forEach((thead) => {
      const element = thead as HTMLElement;
      element.style.backgroundColor = darkBackground;
      element.style.background = darkBackground;
      const cells = element.querySelectorAll('td, th');
      cells.forEach((cell) => {
        const cellElement = cell as HTMLElement;
        cellElement.style.backgroundColor = darkBackground;
        cellElement.style.background = darkBackground;
      });
    });
  }, []);

  // useEffect para aplicar estilos después del montaje y cuando cambia la vista
  useEffect(() => {
    // Aplicar estilos inmediatamente
    const timeout = setTimeout(() => {
      applyDarkModeStyles();
    }, 100);

    // MutationObserver para detectar cambios dinámicos en el DOM
    const observer = new MutationObserver((mutations) => {
      let shouldApply = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          const target = mutation.target as HTMLElement;
          if (target.classList?.contains('fc-col-header') || 
              target.classList?.contains('fc-col-header-cell') ||
              target.closest('.fc-col-header')) {
            shouldApply = true;
          }
        }
      });
      if (shouldApply) {
        setTimeout(() => applyDarkModeStyles(), 50);
      }
    });

    // Observar cambios en el contenedor del calendario
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style'],
      });
    }

    // También observar cambios cuando cambia la vista
    const handleViewChange = () => {
      setTimeout(() => applyDarkModeStyles(), 150);
    };

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.on('datesSet', handleViewChange);
      calendarApi.on('viewSkeletonRender', handleViewChange);
    }

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.off('datesSet', handleViewChange);
        calendarApi.off('viewSkeletonRender', handleViewChange);
      }
    };
  }, [view, applyDarkModeStyles]);

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
            <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-sm"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Planificado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">En progreso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Cancelado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-500 shadow-sm"></div>
            <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">Omitido</span>
          </div>
        </div>
      </div>

      {/* Calendario */}
      <div className="p-4" ref={containerRef}>
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
                <div className="text-xs font-medium truncate text-white">{eventInfo.event.title}</div>
                {view !== 'dayGridMonth' && (
                  <div className="text-xs text-white/80 flex items-center gap-1">
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
        /* ===== VARIABLES GLOBALES ===== */
        .fc-custom {
          --fc-border-color: rgb(229 231 235);
          --fc-daygrid-event-dot-width: 8px;
          --fc-event-border-radius: 8px;
          --fc-event-text-color: #ffffff;
        }
        .dark .fc-custom {
          --fc-border-color: rgb(55 65 81);
          --fc-page-bg-color: rgb(17 24 39);
          --fc-neutral-bg-color: rgb(31 41 55);
          --fc-neutral-text-color: rgb(243 244 246);
          --fc-button-bg-color: rgb(55 65 81);
          --fc-button-border-color: rgb(75 85 99);
          --fc-button-hover-bg-color: rgb(75 85 99);
          --fc-button-hover-border-color: rgb(107 114 128);
          --fc-button-active-bg-color: rgb(37 99 235);
          --fc-button-active-border-color: rgb(37 99 235);
          --fc-today-bg-color: rgba(37, 99, 235, 0.15);
          --fc-daygrid-day-bg-color: rgb(17 24 39);
          --fc-daygrid-day-frame-bg-color: rgb(17 24 39);
          --fc-event-text-color: #ffffff;
        }

        /* ===== HEADER TOTAL - MÁXIMA PRIORIDAD ===== */
        .dark .fc-custom thead,
        .dark .fc-custom thead *,
        .dark .fc-custom .fc-col-header,
        .dark .fc-custom .fc-col-header *,
        .dark .fc-custom .fc-scrollgrid-section-header,
        .dark .fc-custom .fc-scrollgrid-section-header * {
          background: rgb(31 41 55) !important;
          background-color: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
        }

        /* ===== TEXTO DEL HEADER ===== */
        .dark .fc-custom .fc-col-header-cell-cushion,
        .dark .fc-custom thead a {
          color: rgb(243 244 246) !important;
          font-weight: 600 !important;
        }
        /* ===== BOTONES ===== */
        .fc-custom .fc-button {
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          font-weight: 500;
          transition: all 0.2s;
        }
        .dark .fc-custom .fc-button-primary,
        .dark .fc-custom .fc-today-button {
          background-color: rgb(31 41 55) !important;
          border-color: rgb(55 65 81) !important;
          color: rgb(243 244 246) !important;
        }
        .dark .fc-custom .fc-button-primary:hover,
        .dark .fc-custom .fc-today-button:hover {
          background-color: rgb(55 65 81) !important;
          border-color: rgb(75 85 99) !important;
        }
        .dark .fc-custom .fc-toolbar-title {
          color: rgb(255 255 255) !important;
          font-weight: 600;
          font-size: 1.5rem;
        }
        /* ===== EVENTOS ===== */
        .fc-custom .fc-event {
          cursor: pointer;
          border: none;
          padding: 4px 6px;
          font-weight: 500;
          color: #ffffff !important;
        }
        .fc-custom .fc-event:hover {
          opacity: 0.9;
          transform: scale(1.02);
        }

        /* ===== NÚMEROS DE DÍA ===== */
        .dark .fc-custom .fc-daygrid-day-number {
          color: rgb(255 255 255) !important;
          font-weight: 500;
          padding: 0.5rem;
        }
        .dark .fc-custom .fc-day-other .fc-daygrid-day-number {
          color: rgb(156 163 175) !important;
          opacity: 0.7;
        }

        /* ===== CELDAS DEL CALENDARIO ===== */
        .dark .fc-custom .fc-daygrid-day {
          background-color: rgb(17 24 39) !important;
          border-color: rgb(55 65 81) !important;
          min-height: 100px;
        }
        .dark .fc-custom .fc-daygrid-day-frame {
          background-color: rgb(17 24 39) !important;
          min-height: 100px;
        }
        .dark .fc-custom .fc-day-other {
          background-color: rgb(31 41 55) !important;
        }

        /* ===== DÍA ACTUAL ===== */
        .dark .fc-custom .fc-day-today {
          background-color: rgba(37, 99, 235, 0.2) !important;
        }
        .dark .fc-custom .fc-day-today .fc-daygrid-day-number {
          color: rgb(96 165 250) !important;
          font-weight: 700;
        }

        /* ===== GENERAL ===== */
        .dark .fc-custom .fc-scrollgrid {
          border-color: rgb(55 65 81) !important;
          background-color: rgb(17 24 39) !important;
        }
        .dark .fc-custom table {
          background-color: rgb(17 24 39) !important;
        }
      `}</style>
    </div>
  );
}

