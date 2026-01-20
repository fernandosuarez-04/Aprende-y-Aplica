import React, { useState } from 'react';
import { OrganizationNode } from '../../types/dynamicHierarchy.types';
import {
    ChevronRightIcon,
    ChevronDownIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    MapPinIcon,
    UserGroupIcon,
    BuildingOfficeIcon,
    FolderIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface NodeItemProps {
    node: OrganizationNode;
    level: number;
    onExpand?: (node: OrganizationNode) => void;
    onCollapse?: (node: OrganizationNode) => void;
    onEdit?: (node: OrganizationNode) => void;
    onDelete?: (node: OrganizationNode) => void;
    onAddChild?: (parentNode: OrganizationNode) => void;
}

export const NodeItem: React.FC<NodeItemProps> = ({
    node,
    level,
    onExpand,
    onCollapse,
    onAddChild,
    onEdit,
    onDelete
}) => {
    const params = useParams();
    const [isExpanded, setIsExpanded] = useState(false);

    const handleToggle = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        if (newState && onExpand) onExpand(node);
        if (!newState && onCollapse) onCollapse(node);
    };

    // Indentation based on level
    const paddingLeft = `${level * 24 + 12}px`; // Increased base indentation

    // Icon selection based on type
    const getIcon = () => {
        // We use brightness/saturate filters in dark mode to ensure visibility even if the theme color is dark
        const iconClass = "w-5 h-5 dark:brightness-150 dark:saturate-150 transition-all";

        switch (node.type) {
            case 'root': return <BuildingOfficeIcon className={iconClass} style={{ color: 'var(--org-primary-button-color, #6366F1)' }} />;
            case 'region': return <MapPinIcon className={iconClass} style={{ color: 'var(--org-secondary-button-color, #3B82F6)' }} />;
            case 'zone': return <MapPinIcon className={iconClass} style={{ color: 'var(--org-accent-color, #00D4B3)' }} />;
            case 'team': return <UserGroupIcon className={iconClass} style={{ color: '#F59E0B' }} />;
            default: return <FolderIcon className={iconClass} style={{ color: 'var(--org-text-color, #9CA3AF)', opacity: 0.7 }} />;
        }
    };

    return (
        <div className="flex flex-col select-none">
            <div
                className={`flex items-center p-3 border-b transition-all duration-200 group`}
                style={{
                    paddingLeft: level > 0 ? paddingLeft : '0.75rem',
                    borderColor: 'var(--org-border-color, rgba(255,255,255,0.1))',
                    backgroundColor: node.type === 'root' ? 'rgba(var(--org-primary-button-rgb, 99, 102, 241), 0.1)' : 'transparent',
                    color: 'var(--org-text-color, #FFFFFF)'
                }}
            >
                {/* Expand/Collapse Toggle */}
                <button
                    onClick={handleToggle}
                    className="mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDownIcon className="w-4 h-4" />
                    ) : (
                        <ChevronRightIcon className="w-4 h-4" />
                    )}
                </button>

                {/* Node Icon */}
                <span className="mr-3 opacity-90">
                    {getIcon()}
                </span>

                {/* Node Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/${params?.orgSlug}/business-panel/hierarchy/node/${node.id}`}
                            className="hover:underline decoration-blue-500 underline-offset-2"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                            <span className="text-sm truncate font-medium">
                                {node.name}
                            </span>
                        </Link>
                        {node.code && (
                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 dark:bg-neutral-800 dark:text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 dark:border-neutral-700">
                                {node.code}
                            </span>
                        )}
                    </div>
                    {/* Metadata / Manager */}
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-3">
                        <span className="opacity-80 font-medium tracking-wide uppercase">{node.type}</span>
                        {node.manager && (
                            <span className="flex items-center gap-1 opacity-80">
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                Líder: {node.manager.first_name}
                            </span>
                        )}
                        <span className="flex items-center gap-1 opacity-80">
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            {node.members_count || 0} miembros
                        </span>
                    </div>
                </div>

                {/* Actions (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={() => onAddChild && onAddChild(node)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-md transition-colors"
                        title="Agregar sub-nivel"
                    >
                        <PlusIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onEdit && onEdit(node)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400 rounded-md transition-colors"
                        title="Editar"
                    >
                        <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onDelete && onDelete(node)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md transition-colors"
                        title="Eliminar"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Children Rendering */}
            {isExpanded && node.children && node.children.length > 0 && (
                <div className="flex flex-col relative">
                    {/* Vertical Guide Line */}
                    <div
                        className="absolute w-px bg-gray-100 dark:bg-neutral-800 top-0 bottom-0"
                        style={{ left: `${(level * 24) + 12 + 11}px` }} // Approx align with chevron center
                    />
                    {node.children.map(child => (
                        <NodeItem
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onExpand={onExpand}
                            onCollapse={onCollapse}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}

            {/* Empty State when expanded */}
            {isExpanded && (!node.children || node.children.length === 0) && (
                <div className="py-3 text-xs text-gray-400 italic flex items-center gap-2" style={{ paddingLeft: `${(level + 1) * 24 + 12}px` }}>
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700"></div>
                    No hay elementos
                </div>
            )}
        </div>
    );
};
