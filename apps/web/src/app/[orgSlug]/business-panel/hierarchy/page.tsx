'use client';

import { motion } from 'framer-motion';
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  HierarchySettings,
  HierarchyTree,
  RegionForm,
  ZoneForm,
  TeamForm,
  DeleteConfirmModal
} from '@/features/business-panel/components/hierarchy';
import { useHierarchy } from '@/features/business-panel/hooks/useHierarchy';
import { BusinessUsersService, BusinessUser } from '@/features/business-panel/services/businessUsers.service';
import type { Region, Zone, Team, ManagerInfo } from '@/features/business-panel/types/hierarchy.types';

type EntityType = 'region' | 'zone' | 'team';

export default function BusinessPanelHierarchyPage() {
  const router = useRouter();
  const params = useParams();
  const orgSlug = params?.orgSlug as string;
  
  const [activeTab, setActiveTab] = useState<'settings' | 'tree'>('settings');

  // Estados para modales de edición
  const [regionFormOpen, setRegionFormOpen] = useState(false);
  const [zoneFormOpen, setZoneFormOpen] = useState(false);
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedRegionId, setSelectedRegionId] = useState<string | undefined>();
  const [selectedZoneId, setSelectedZoneId] = useState<string | undefined>();

  // Estados para modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<EntityType>('region');
  const [deleteItem, setDeleteItem] = useState<Region | Zone | Team | null>(null);

  // Hook de jerarquía
  const {
    regions,
    zones,
    hierarchyTree,
    isLoading,
    createRegion,
    updateRegion,
    deleteRegion,
    createZone,
    updateZone,
    deleteZone,
    createTeam,
    updateTeam,
    deleteTeam,
    loadFullHierarchy,
    loadAll
  } = useHierarchy();

  // Cargar datos al montar el componente
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Estado para usuarios disponibles como gerentes
  const [orgUsers, setOrgUsers] = useState<BusinessUser[]>([]);

  // Cargar usuarios de la organización
  useEffect(() => {
    const loadUsers = async () => {
      const users = await BusinessUsersService.getOrganizationUsers();
      setOrgUsers(users);
    };
    loadUsers();
  }, []);

  // Convertir usuarios a formato ManagerInfo para los formularios
  const availableManagers: ManagerInfo[] = useMemo(() => {
    return orgUsers
      .filter(u => u.org_status === 'active') // Solo usuarios activos
      .map(u => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
        first_name: u.first_name || undefined,
        last_name: u.last_name || undefined,
        profile_picture_url: u.profile_picture_url || undefined
      }));
  }, [orgUsers]);

  // ==========================================
  // HANDLERS DE REGIÓN
  // ==========================================

  const handleNewRegion = () => {
    setEditingRegion(null);
    setRegionFormOpen(true);
  };

  const handleEditRegion = useCallback((region: Region) => {
    setEditingRegion(region);
    setRegionFormOpen(true);
  }, []);

  const handleSaveRegion = async (data: Partial<Region>) => {
    if (editingRegion) {
      const result = await updateRegion(editingRegion.id, data);
      if (!result.success) throw new Error(result.error);
    } else {
      const result = await createRegion(data as any);
      if (!result.success) throw new Error(result.error);
    }
    loadFullHierarchy();
  };

  const handleDeleteRegion = useCallback((region: Region) => {
    setDeleteType('region');
    setDeleteItem(region);
    setDeleteModalOpen(true);
  }, []);

  const handleSelectRegion = useCallback((region: Region) => {
    router.push(`/${orgSlug}/business-panel/hierarchy/region/${region.id}`);
  }, [router, orgSlug]);

  // ==========================================
  // HANDLERS DE ZONA
  // ==========================================

  const handleNewZone = (regionId?: string) => {
    setEditingZone(null);
    setSelectedRegionId(regionId);
    setZoneFormOpen(true);
  };

  const handleEditZone = useCallback((zone: Zone) => {
    setEditingZone(zone);
    setZoneFormOpen(true);
  }, []);

  const handleSaveZone = async (data: Partial<Zone> & { region_id: string }) => {
    if (editingZone) {
      // Remove region_id from update data (can't change parent)
      const { region_id, ...updateData } = data;
      const result = await updateZone(editingZone.id, updateData);
      if (!result.success) throw new Error(result.error);
    } else {
      const result = await createZone(data as any);
      if (!result.success) throw new Error(result.error);
    }
    loadFullHierarchy();
  };

  const handleDeleteZone = useCallback((zone: Zone) => {
    setDeleteType('zone');
    setDeleteItem(zone);
    setDeleteModalOpen(true);
  }, []);

  const handleSelectZone = useCallback((zone: Zone) => {
    router.push(`/${orgSlug}/business-panel/hierarchy/zone/${zone.id}`);
  }, [router, orgSlug]);

  // ==========================================
  // HANDLERS DE EQUIPO
  // ==========================================

  const handleNewTeam = (zoneId?: string) => {
    setEditingTeam(null);
    setSelectedZoneId(zoneId);
    setTeamFormOpen(true);
  };

  const handleEditTeam = useCallback((team: Team) => {
    setEditingTeam(team);
    setTeamFormOpen(true);
  }, []);

  const handleSaveTeam = async (data: Partial<Team> & { zone_id: string }) => {
    if (editingTeam) {
      // Remove zone_id from update data (can't change parent)
      const { zone_id, ...updateData } = data;
      const result = await updateTeam(editingTeam.id, updateData);
      if (!result.success) throw new Error(result.error);
    } else {
      const result = await createTeam(data as any);
      if (!result.success) throw new Error(result.error);
    }
    loadFullHierarchy();
  };

  const handleDeleteTeam = useCallback((team: Team) => {
    setDeleteType('team');
    setDeleteItem(team);
    setDeleteModalOpen(true);
  }, []);

  const handleSelectTeam = useCallback((team: Team) => {
    router.push(`/${orgSlug}/business-panel/hierarchy/team/${team.id}`);
  }, [router, orgSlug]);

  // ==========================================
  // HANDLER DE ELIMINACIÓN
  // ==========================================

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    let result;
    switch (deleteType) {
      case 'region':
        result = await deleteRegion(deleteItem.id);
        break;
      case 'zone':
        result = await deleteZone(deleteItem.id);
        break;
      case 'team':
        result = await deleteTeam(deleteItem.id);
        break;
    }

    if (!result?.success) {
      throw new Error(result?.error || 'Error al eliminar');
    }

    loadFullHierarchy();
  };

  const deleteLabels: Record<EntityType, { title: string; message: string }> = {
    region: {
      title: 'Eliminar Región',
      message: 'Al eliminar esta región, también se eliminarán todas sus zonas y equipos asociados.'
    },
    zone: {
      title: 'Eliminar Zona',
      message: 'Al eliminar esta zona, también se eliminarán todos sus equipos asociados.'
    },
    team: {
      title: 'Eliminar Equipo',
      message: 'Al eliminar este equipo, los usuarios asignados quedarán sin equipo.'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      {/* Tabs de navegación */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tree'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Vista de Árbol
          </button>
        </div>

        {/* Botones de acción rápida */}
        {activeTab === 'tree' && (
          <div className="flex gap-2 pb-2">
            <button
              onClick={handleNewRegion}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Región
            </button>
            <button
              onClick={() => handleNewZone()}
              disabled={regions.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Zona
            </button>
            <button
              onClick={() => handleNewTeam()}
              disabled={zones.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Equipo
            </button>
          </div>
        )}
      </div>

      {/* Contenido según tab activo */}
      {activeTab === 'settings' ? (
        <HierarchySettings />
      ) : (
        <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                Estructura Organizacional
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                Haz clic en una región, zona o equipo para ver su página de detalle.
              </p>
            </div>
          </div>

          <HierarchyTree
            canEdit={true}
            hierarchyTree={hierarchyTree}
            isLoading={isLoading}
            onSelectRegion={handleSelectRegion}
            onSelectZone={handleSelectZone}
            onSelectTeam={handleSelectTeam}
            onEditRegion={handleEditRegion}
            onEditZone={handleEditZone}
            onEditTeam={handleEditTeam}
            onDeleteRegion={handleDeleteRegion}
            onDeleteZone={handleDeleteZone}
            onDeleteTeam={handleDeleteTeam}
          />
        </div>
      )}

      {/* Modales de formularios */}
      <RegionForm
        region={editingRegion}
        isOpen={regionFormOpen}
        onClose={() => { setRegionFormOpen(false); setEditingRegion(null); }}
        onSave={handleSaveRegion}
        isLoading={isLoading}
        availableManagers={availableManagers}
      />

      <ZoneForm
        zone={editingZone}
        regions={regions}
        selectedRegionId={selectedRegionId}
        isOpen={zoneFormOpen}
        onClose={() => { setZoneFormOpen(false); setEditingZone(null); setSelectedRegionId(undefined); }}
        onSave={handleSaveZone}
        isLoading={isLoading}
        availableManagers={availableManagers}
      />

      <TeamForm
        team={editingTeam}
        zones={zones}
        selectedZoneId={selectedZoneId}
        isOpen={teamFormOpen}
        onClose={() => { setTeamFormOpen(false); setEditingTeam(null); setSelectedZoneId(undefined); }}
        onSave={handleSaveTeam}
        isLoading={isLoading}
        availableLeaders={availableManagers}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteItem(null); }}
        onConfirm={handleConfirmDelete}
        title={deleteLabels[deleteType].title}
        message={deleteLabels[deleteType].message}
        itemName={deleteItem?.name || ''}
        isLoading={isLoading}
      />

    </motion.div>
  );
}
