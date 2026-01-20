'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Users,
    UserPlus,
    BookOpen,
    TrendingUp,
    Map as MapIcon,
    List,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Edit2,
    Trash2,
    MapPin,
    Plus,
    Building2,
    Layers,
    MoreVertical
} from 'lucide-react';

import { HierarchyService } from '../../services/hierarchy.service';
import { useHierarchyAnalytics } from '../../hooks/useHierarchyAnalytics';
import type { NodeDetails } from '../../types/dynamicHierarchy.types';
import { HierarchyMapWrapper } from './HierarchyMapWrapper';
import { NodeForm } from './NodeForm';
import { HierarchyChat } from './HierarchyChat'
import { DynamicHierarchyService } from '../../services/dynamicHierarchy.service';
import { CourseAssignmentForm } from './CourseAssignmentForm';
import { HierarchyEntityType } from '../../types/hierarchy-assignments.types';
import { MemberAssignmentModal } from './MemberAssignmentModal';
import type { NodeMember } from '../../types/hierarchy.types';

interface NodeDashboardProps {
    nodeId: string;
}

export function NodeDashboard({ nodeId }: NodeDashboardProps) {
    const params = useParams();
    const orgSlug = params.orgSlug as string;

    const [data, setData] = useState<NodeDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'structure' | 'learning' | 'chat' | 'members'>('overview');
    const [members, setMembers] = useState<NodeMember[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAssignmentModal, setShowAssignmentModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);

    const { analytics } = useHierarchyAnalytics(
        (data?.node.type as any) || 'team',
        nodeId,
        { disabled: !data }
    );

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await HierarchyService.getNodeDetails(nodeId);
            if (result) {
                setData(result);
            } else {
                setError('No se pudo cargar la información del nodo');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (activeTab === 'members') {
            fetchMembers();
        }
    }, [nodeId, activeTab]);

    const fetchMembers = async () => {
        setLoadingMembers(true);
        try {
            const result = await HierarchyService.getNodeMembers(nodeId);
            setMembers(result);
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('¿Estás seguro de que deseas remover este miembro?')) return;

        try {
            await HierarchyService.removeUserFromNode(nodeId, userId);
            fetchMembers(); // Reload list
            fetchData(); // Reload counts
        } catch (error) {
            console.error('Error removing member:', error);
            alert('Error al remover miembro');
        }
    };

    const handleEditSave = async (name: string, type: string, properties?: Record<string, any>, managerId?: string) => {
        try {
            await DynamicHierarchyService.updateNode(nodeId, { name, type, properties, manager_id: managerId });
            fetchData();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                <h3 className="text-lg font-semibold">Error</h3>
                <p>{error || 'Nodo no encontrado'}</p>
                <Link href={`/${orgSlug}/business-panel/hierarchy`} className="mt-4 inline-block px-4 py-2 bg-white border border-gray-300 rounded shadow-sm text-sm font-medium hover:bg-gray-50">
                    Volver al árbol
                </Link>
            </div>
        );
    }

    const { node, children, courses } = data;

    // --- Legacy-style Components ---

    const LegacyHeader = () => (
        <div className="bg-[#1E2329] rounded-2xl p-6 md:p-8 relative overflow-hidden border border-white/5 shadow-xl">
            {/* Background pattern equivalent could go here */}

            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                {/* Icon Box */}
                <div className="w-24 h-24 rounded-2xl bg-[#2A3038] border border-white/10 flex items-center justify-center shrink-0">
                    <MapIcon className="w-10 h-10 text-white/40" />
                </div>

                {/* Info Text */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                        <Link href={`/${orgSlug}/business-panel/hierarchy`} className="text-white/40 hover:text-white transition-colors text-sm flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Volver
                        </Link>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                        {node.name}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 mb-2">
                        {node.code && (
                            <span className="px-2 py-0.5 rounded bg-[#2A3038] border border-white/10 text-white/60 text-xs font-mono">
                                {node.code}
                            </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium uppercase tracking-wider">
                            Activa
                        </span>
                        {(node.properties?.address || (node.properties?.latitude && node.properties?.longitude)) && (
                            <div className="flex items-center gap-1.5 text-white/60 text-sm">
                                <MapPin className="w-3.5 h-3.5" />
                                <span>{node.properties?.address || `${node.properties?.latitude}, ${node.properties?.longitude}`}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="p-2 rounded-lg bg-[#2A3038] hover:bg-[#323842] border border-white/10 text-white/60 hover:text-white transition-colors"
                        title="Editar"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    {/* Delete button (mock functionality for now) */}
                    <button className="p-2 rounded-lg bg-[#2A3038] hover:bg-red-900/30 border border-white/10 text-white/60 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Pills Row */}
            <div className="flex flex-wrap gap-4 mt-8">
                {/* Dynamically count sub-types if possible, otherwise generic generic counts */}
                <div className="bg-[#2A3038] border border-white/5 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[140px]">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">{children.filter(c => c.type === 'zone').length}</div>
                        <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Zonas</div>
                    </div>
                </div>
                <div className="bg-[#2A3038] border border-white/5 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[140px]">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">{children.filter(c => c.type === 'team').length}</div>
                        <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Equipos</div>
                    </div>
                </div>
                <div className="bg-[#2A3038] border border-white/5 rounded-xl px-5 py-3 flex items-center gap-3 min-w-[140px]">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-white">{node.members_count || analytics?.users_count || 0}</div>
                        <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Usuarios</div>
                    </div>
                </div>
            </div>
        </div>
    );

    const ManagerCard = () => (
        <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center h-full">
            <div className="w-full flex items-center gap-2 mb-6 text-white/60 text-sm font-medium uppercase tracking-wider">
                <User className="w-4 h-4" />
                Gerente Regional
            </div>

            <div className="relative mb-4">
                {node.manager?.profile_picture_url ? (
                    <img
                        src={node.manager.profile_picture_url}
                        className="w-24 h-24 rounded-full object-cover border-4 border-[#2A3038]"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-[#2A3038] border-4 border-[#2A3038] flex items-center justify-center text-white/20 text-3xl font-bold">
                        {node.manager?.first_name ? node.manager.first_name[0] : '?'}
                    </div>
                )}
            </div>

            <h3 className="text-xl font-bold text-white mb-1">
                {node.manager ? `${node.manager.first_name} ${node.manager.last_name}` : 'Sin Asignar'}
            </h3>
            <p className="text-white/40 text-sm mb-8">
                {node.manager?.email || 'No disponible'}
            </p>

            <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                <div className="bg-[#2A3038] rounded-xl p-3 text-left">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Teléfono</div>
                    <div className="text-white text-sm truncate">{node.properties?.phone || 'No registrado'}</div>
                </div>
                <div className="bg-[#2A3038] rounded-xl p-3 text-left">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Email Contacto</div>
                    <div className="text-white text-sm truncate">{node.properties?.email || 'No registrado'}</div>
                </div>
            </div>
        </div>
    );

    const PerformanceCard = () => (
        <div className="space-y-6 h-full">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* General Performance */}
                <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider mb-6">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        Rendimiento
                    </div>
                    <div className="space-y-4">
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">Tasa de Finalización</div>
                                <div className="text-2xl font-bold text-white">{analytics?.avg_completion || 0}%</div>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">Horas Totales</div>
                                <div className="text-2xl font-bold text-white">{analytics?.total_hours || 0}h</div>
                            </div>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                        </div>
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5 flex justify-between items-center">
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold">Promedio por Miembro</div>
                                <div className="text-xl font-bold text-white">{analytics?.avg_hours_per_member || 0}h</div>
                            </div>
                            <Users className="w-4 h-4 text-white/20" />
                        </div>
                    </div>
                </div>

                {/* Engagement & Streaks */}
                <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider mb-6">
                        <Clock className="w-4 h-4 text-orange-400" />
                        Engagement
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Días Activos (Prom)</div>
                            <div className="text-xl font-bold text-white">{analytics?.avg_active_days || 0} <span className="text-xs text-white/40 font-normal">/ 30 días</span></div>
                        </div>
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Racha Promedio</div>
                            <div className="text-xl font-bold text-white">{analytics?.avg_streak || 0} <span className="text-xs text-white/40 font-normal">días</span></div>
                        </div>
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Participación</div>
                            <div className="text-xl font-bold text-white">{analytics?.participation_rate || 0}%</div>
                        </div>
                        <div className="bg-[#2A3038] rounded-xl p-3 border border-white/5">
                            <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Racha Más Larga</div>
                            <div className="text-xl font-bold text-white text-orange-400">{analytics?.longest_streak || 0} <span className="text-xs text-white/40 font-normal text-white">días</span></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Rankings */}
            <div className="bg-[#1E2329] border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white text-sm font-bold uppercase tracking-wider">
                        <List className="w-4 h-4 text-purple-400" />
                        Ranking de {children.length > 0 && children[0].type === 'zone' ? 'Zonas' : (children.length > 0 ? 'Equipos' : 'Miembros')}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 text-xs text-white/40 uppercase tracking-wider">
                                <th className="py-3 px-2 font-medium">Nombre</th>
                                <th className="py-3 px-2 font-medium text-right">Horas</th>
                                <th className="py-3 px-2 font-medium text-right">Completado</th>
                                <th className="py-3 px-2 font-medium text-center">Rank</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {(analytics?.zone_ranking || analytics?.team_ranking || []).length > 0 ? (
                                (analytics?.zone_ranking || analytics?.team_ranking || []).slice(0, 5).map((item, index) => (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="py-3 px-2 text-white font-medium">{item.name}</td>
                                        <td className="py-3 px-2 text-right text-white/60">{item.hours}h</td>
                                        <td className="py-3 px-2 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.completion_rate >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
                                                {item.completion_rate}%
                                            </span>
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-white/20 italic">
                                        No hay datos de ranking disponibles
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const StructureTab = () => {
        // Include parent in map points if it has coordinates
        const parentPoint = (node.properties?.latitude && node.properties?.longitude) ? [{
            id: node.id,
            name: node.name,
            lat: parseFloat(node.properties.latitude),
            lng: parseFloat(node.properties.longitude),
            type: node.type as any,
            manager: node.manager ? `${node.manager.first_name} ${node.manager.last_name}` : undefined,
            isParent: true // Flag to distinguish or style differently if needed
        }] : [];

        const childPoints = children
            .map(c => ({
                id: c.id,
                name: c.name,
                lat: c.properties?.latitude,
                lng: c.properties?.longitude,
                type: c.type as any,
                manager: c.manager ? `${c.manager.first_name} ${c.manager.last_name}` : undefined
            }))
            .filter(c => c.lat && c.lng);

        const mapPoints = [...parentPoint, ...childPoints];
        const hasMap = mapPoints.length > 0;

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-white/40" />
                        Mapa de Zonas y Cobertura
                    </h3>
                    <button
                        onClick={() => setShowEditModal(true)}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                    >
                        <MapPin className="w-4 h-4" />
                        Agregar dirección
                    </button>
                </div>

                {hasMap && (
                    <div className="rounded-2xl overflow-hidden border border-white/10 shadow-lg h-[400px]">
                        <HierarchyMapWrapper points={mapPoints} />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map(child => (
                        <Link
                            key={child.id}
                            href={`/${orgSlug}/business-panel/hierarchy/node/${child.id}`}
                            className="block group"
                        >
                            <div className="bg-[#1E2329] hover:bg-[#252b33] p-5 rounded-2xl border border-white/5 transition-all group-hover:border-blue-500/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#2A3038] flex items-center justify-center text-white/40 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <div className="px-2 py-1 rounded bg-[#2A3038] text-[10px] font-bold text-white/40 uppercase tracking-wider">
                                        {child.type}
                                    </div>
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                    {child.name}
                                </h4>
                                <div className="flex items-center gap-4 text-sm text-white/40">
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5" />
                                        <span>{child.members_count || 0} miembros</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {children.length === 0 && (
                        <div className="col-span-full py-12 text-center text-white/20 border border-dashed border-white/10 rounded-2xl flex flex-col items-center gap-2">
                            <Layers className="w-12 h-12 text-white/10" />
                            <p>No hay sub-niveles en esta estructura.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const LearningTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Plan de Aprendizaje Regional</h3>
                    <p className="text-white/40 text-sm">Gestiona los cursos asignados a todos los miembros de esta región.</p>
                </div>
                <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Asignar Cursos
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full py-20 bg-[#1E2329] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                        <BookOpen className="w-16 h-16 text-white/10 mb-4" />
                        <p className="text-white/40 font-medium">No hay cursos con actividad en esta región.</p>
                    </div>
                ) : (
                    courses.map(course => (
                        <div key={course.assignment_id} className="bg-[#1E2329] rounded-2xl border border-white/5 overflow-hidden group hover:border-white/10 transition-colors">
                            <div className="h-40 bg-[#2A3038] relative">
                                {course.thumbnail_url && (
                                    <img src={course.thumbnail_url} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                                )}
                                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded">
                                    {course.category}
                                </div>
                            </div>
                            <div className="p-5">
                                <h4 className="font-bold text-white mb-2 line-clamp-2">{course.title}</h4>
                                <div className="flex items-center justify-between mt-4">
                                    <span className={`px-2 py-0.5 rounded textxs font-medium ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/10 text-white/40'
                                        }`}>
                                        {course.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* "New Course" Placeholder Card */}
                <button
                    onClick={() => setShowAssignmentModal(true)}
                    className="border border-dashed border-white/10 rounded-2xl hover:bg-white/5 transition-colors flex flex-col items-center justify-center min-h-[300px] gap-4 group"
                >
                    <div className="w-12 h-12 rounded-full bg-[#2A3038] flex items-center justify-center text-white/40 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-white/40 font-medium group-hover:text-white transition-colors">Asignar Nuevo Curso</span>
                </button>
            </div>
        </div>
    );

    const MembersTab = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Miembros del Nodo</h3>
                    <p className="text-white/40 text-sm">Gestiona los usuarios asignados directamente a este nivel.</p>
                </div>
                <button
                    onClick={() => setShowMemberModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Asignar Miembro
                </button>
            </div>

            {loadingMembers ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : members.length === 0 ? (
                <div className="py-20 bg-[#1E2329] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                    <Users className="w-16 h-16 text-white/10 mb-4" />
                    <p className="text-white/40 font-medium">No hay miembros asignados directamente a este nodo.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map(member => (
                        <div key={member.id} className="bg-[#1E2329] p-4 rounded-xl border border-white/5 flex items-center gap-4 group hover:border-white/10 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-[#2A3038] flex-shrink-0 overflow-hidden">
                                {member.users.profile_picture_url ? (
                                    <img src={member.users.profile_picture_url} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/20 font-bold">
                                        {(member.users.first_name?.[0] || member.users.username?.[0] || '?').toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white truncate">
                                    {member.users.first_name} {member.users.last_name}
                                </h4>
                                <p className="text-white/40 text-xs truncate">{member.users.email}</p>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${member.role === 'leader' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                                        }`}>
                                        {member.role === 'leader' ? 'Líder' : 'Miembro'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRemoveMember(member.user_id)}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remover miembro"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            <LegacyHeader />

            {/* Navigation Tabs */}
            <div className="border-b border-white/10">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Visión General
                    </button>
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'members'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Miembros
                    </button>
                    <button
                        onClick={() => setActiveTab('structure')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'structure'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Estructura y Mapa
                    </button>
                    <button
                        onClick={() => setActiveTab('learning')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'learning'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Cursos y Aprendizaje
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'chat'
                            ? 'border-blue-500 text-blue-400'
                            : 'border-transparent text-white/40 hover:text-white hover:border-white/20'
                            }`}
                    >
                        Comunicación
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
            >
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 min-h-[500px]">
                            <ManagerCard />
                        </div>
                        <div className="lg:col-span-2 min-h-[500px]">
                            <PerformanceCard />
                        </div>
                    </div>
                )}
                {activeTab === 'members' && <MembersTab />}
                {activeTab === 'structure' && <StructureTab />}
                {activeTab === 'learning' && <LearningTab />}
                {activeTab === 'chat' && (
                    <div className="max-w-4xl mx-auto">
                        <HierarchyChat
                            entityType="node"
                            entityId={nodeId}
                            chatType="vertical"
                            title={`Chat de ${data?.node.name || 'Equipo'}`}
                            className="bg-[#1E2329] border border-white/5"
                        />
                    </div>
                )}
            </motion.div>

            <NodeForm
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleEditSave}
                mode="edit"
                nodeToEdit={node}
            />

            {data && (
                <CourseAssignmentForm
                    isOpen={showAssignmentModal}
                    onClose={() => setShowAssignmentModal(false)}
                    entityType={node.type as HierarchyEntityType}
                    entityId={node.id}
                    entityName={node.name}
                    onSuccess={() => {
                        setShowAssignmentModal(false);
                        fetchData(); // Refresh data to show new assignments
                    }}
                />
            )}

            <MemberAssignmentModal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                nodeId={nodeId}
                nodeName={data?.node.name || ''}
                onSuccess={() => {
                    fetchMembers();
                    fetchData();
                }}
            />

        </div>
    );
}
