'use client';

import { useState, useEffect } from 'react';
import { useHierarchy } from '../../hooks/useHierarchy';
import type { Region, Zone, Team, HierarchyTree as HierarchyTreeType } from '../../types/hierarchy.types';

interface HierarchyTreeProps {
  onSelectRegion?: (region: Region) => void;
  onSelectZone?: (zone: Zone) => void;
  onSelectTeam?: (team: Team) => void;
  onEditRegion?: (region: Region) => void;
  onEditZone?: (zone: Zone) => void;
  onEditTeam?: (team: Team) => void;
  onDeleteRegion?: (region: Region) => void;
  onDeleteZone?: (zone: Zone) => void;
  onDeleteTeam?: (team: Team) => void;
  canEdit?: boolean;
  /** Optional: Pass hierarchyTree from parent to share state */
  hierarchyTree?: HierarchyTreeType | null;
  /** Optional: Loading state from parent */
  isLoading?: boolean;
}

/**
 * Componente de árbol de jerarquía
 * Muestra la estructura Región > Zona > Equipo
 */
export function HierarchyTree({
  onSelectRegion,
  onSelectZone,
  onSelectTeam,
  onEditRegion,
  onEditZone,
  onEditTeam,
  onDeleteRegion,
  onDeleteZone,
  onDeleteTeam,
  canEdit = false,
  hierarchyTree: externalHierarchyTree,
  isLoading: externalIsLoading
}: HierarchyTreeProps) {
  // Use internal hook only if no external data is provided
  const internalHook = useHierarchy();
  const hierarchyTree = externalHierarchyTree !== undefined ? externalHierarchyTree : internalHook.hierarchyTree;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalHook.isLoading;
  
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [expandedZones, setExpandedZones] = useState<Set<string>>(new Set());

  // Only load if using internal hook
  useEffect(() => {
    if (externalHierarchyTree === undefined) {
      internalHook.loadFullHierarchy();
    }
  }, [externalHierarchyTree]);

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(regionId)) {
        next.delete(regionId);
      } else {
        next.add(regionId);
      }
      return next;
    });
  };

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => {
      const next = new Set(prev);
      if (next.has(zoneId)) {
        next.delete(zoneId);
      } else {
        next.add(zoneId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        ))}
      </div>
    );
  }

  if (!hierarchyTree || hierarchyTree.regions.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <p>No hay estructura jerárquica</p>
        <p className="text-sm mt-1">Crea regiones, zonas y equipos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hierarchyTree.regions.map(region => (
        <div key={region.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
          {/* Región */}
          <div
            className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
            onClick={() => onSelectRegion?.(region)}
          >
            <div className="flex items-center gap-3">
              <button 
                className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
                onClick={(e) => { e.stopPropagation(); toggleRegion(region.id); }}
                title="Expandir/Colapsar"
              >
                <ChevronIcon expanded={expandedRegions.has(region.id)} />
              </button>
              <div className="flex items-center gap-2">
                <RegionIcon />
                <span className="font-medium text-neutral-900 dark:text-white">
                  {region.name}
                </span>
                {region.code && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    ({region.code})
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span>{region.zones_count || 0} zonas</span>
                <span>•</span>
                <span>{region.users_count || 0} usuarios</span>
              </div>
              {canEdit && (
                <div className="flex gap-1">
                  <ActionButton
                    icon="edit"
                    onClick={(e) => { e.stopPropagation(); onEditRegion?.(region); }}
                  />
                  <ActionButton
                    icon="delete"
                    onClick={(e) => { e.stopPropagation(); onDeleteRegion?.(region); }}
                    variant="danger"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Zonas de la región */}
          {expandedRegions.has(region.id) && (
            <div className="border-t border-neutral-200 dark:border-neutral-700">
              {(region as any).zones?.length > 0 ? (
                (region as any).zones.map((zone: any) => (
                  <div key={zone.id}>
                    {/* Zona */}
                    <div
                      className="flex items-center justify-between p-3 pl-10 bg-white dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-700/50 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                      onClick={() => onSelectZone?.(zone)}
                    >
                      <div className="flex items-center gap-3">
                        <button 
                          className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded"
                          onClick={(e) => { e.stopPropagation(); toggleZone(zone.id); }}
                          title="Expandir/Colapsar"
                        >
                          <ChevronIcon expanded={expandedZones.has(zone.id)} />
                        </button>
                        <div className="flex items-center gap-2">
                          <ZoneIcon />
                          <span className="font-medium text-neutral-800 dark:text-neutral-200">
                            {zone.name}
                          </span>
                          {zone.code && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              ({zone.code})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{zone.teams_count || 0} equipos</span>
                          <span>•</span>
                          <span>{zone.users_count || 0} usuarios</span>
                        </div>
                        {canEdit && (
                          <div className="flex gap-1">
                            <ActionButton
                              icon="edit"
                              onClick={(e) => { e.stopPropagation(); onEditZone?.(zone); }}
                            />
                            <ActionButton
                              icon="delete"
                              onClick={(e) => { e.stopPropagation(); onDeleteZone?.(zone); }}
                              variant="danger"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Equipos de la zona */}
                    {expandedZones.has(zone.id) && zone.teams?.length > 0 && (
                      <div className="bg-neutral-50/50 dark:bg-neutral-900/30">
                        {zone.teams.map((team: any) => (
                          <div
                            key={team.id}
                            className="flex items-center justify-between p-3 pl-20 hover:bg-neutral-100 dark:hover:bg-neutral-700/30 cursor-pointer border-b border-neutral-100 dark:border-neutral-700/30 last:border-0"
                            onClick={() => onSelectTeam?.(team)}
                          >
                            <div className="flex items-center gap-2">
                              <TeamIcon />
                              <span className="text-neutral-700 dark:text-neutral-300">
                                {team.name}
                              </span>
                              {team.code && (
                                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                  ({team.code})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {team.members_count || 0} miembros
                              </span>
                              {canEdit && (
                                <div className="flex gap-1">
                                  <ActionButton
                                    icon="edit"
                                    onClick={(e) => { e.stopPropagation(); onEditTeam?.(team); }}
                                  />
                                  <ActionButton
                                    icon="delete"
                                    onClick={(e) => { e.stopPropagation(); onDeleteTeam?.(team); }}
                                    variant="danger"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 pl-10 text-sm text-neutral-500 dark:text-neutral-400">
                  No hay zonas en esta región
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Iconos
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-neutral-500 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function RegionIcon() {
  return (
    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ZoneIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function TeamIcon() {
  return (
    <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function ActionButton({
  icon,
  onClick,
  variant = 'default'
}: {
  icon: 'edit' | 'delete';
  onClick: (e: React.MouseEvent) => void;
  variant?: 'default' | 'danger';
}) {
  const baseClasses = "p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors";
  const variantClasses = variant === 'danger'
    ? 'text-red-500 hover:text-red-600'
    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200';

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>
      {icon === 'edit' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}

export default HierarchyTree;
