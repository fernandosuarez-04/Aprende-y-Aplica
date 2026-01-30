import { Plus, Layout, Settings, ChevronRight, ChevronDown, UserPlus } from 'lucide-react';

import React, { useEffect, useState } from 'react';
import { DynamicHierarchyService } from '../../services/dynamicHierarchy.service';
import { OrganizationNode, OrganizationStructure } from '../../types/dynamicHierarchy.types';
import { NodeItem } from './NodeItem';
import { StructureForm } from './StructureForm';
import { NodeForm } from './NodeForm';
import { MemberAssignmentModal } from './MemberAssignmentModal';

interface HierarchyTreeProps {
  initialStructureId?: string;
}

// Helper to reconstruct tree from flat list
const buildTreeFromFlat = (nodes: OrganizationNode[]): OrganizationNode[] => {
  const map = new Map<string, OrganizationNode>();
  const roots: OrganizationNode[] = [];

  // First pass: create copies to avoid mutation issues and map them
  nodes.forEach(node => {
    map.set(node.id, { ...node, children: [] });
  });

  // Second pass: link children
  nodes.forEach(node => {
    const nodeWithChildren = map.get(node.id)!;
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children!.push(nodeWithChildren);
    } else {
      roots.push(nodeWithChildren);
    }
  });

  return roots;
};

export const HierarchyTree: React.FC<HierarchyTreeProps> = ({ initialStructureId }) => {
  const [structures, setStructures] = useState<OrganizationStructure[]>([]);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(initialStructureId || null);
  const [nodes, setNodes] = useState<OrganizationNode[]>([]); // Flat nodes
  const [treeRoots, setTreeRoots] = useState<OrganizationNode[]>([]); // Tree structure
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStructureModal, setShowStructureModal] = useState(false);

  // Member Assignment Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberModalNodeId, setMemberModalNodeId] = useState<string | null>(null);
  const [memberModalNodeName, setMemberModalNodeName] = useState<string>('');

  // Node Modal State
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodeModalMode, setNodeModalMode] = useState<'create' | 'edit'>('create');
  const [targetNode, setTargetNode] = useState<OrganizationNode | undefined>(undefined); // Parent for create, Target for edit

  // Initial Load: Fetch Structures
  useEffect(() => {
    loadStructures();
  }, []);

  // On Structure Change: Fetch Nodes
  useEffect(() => {
    if (selectedStructureId) {
      loadNodes(selectedStructureId);
    }
  }, [selectedStructureId]);

  const loadStructures = async () => {
    try {
      const data = await DynamicHierarchyService.getStructures();
      setStructures(data);
      if (data.length > 0 && !selectedStructureId) {
        // Select default or first
        const def = data.find(s => s.is_default) || data[0];
        setSelectedStructureId(def.id);
      }
    } catch (err) {
      setError('Error cargando estructuras');
      console.error(err);
    }
  };

  const loadNodes = async (structureId: string) => {
    setIsLoading(true);
    try {
      const data = await DynamicHierarchyService.getTree(structureId);
      setNodes(data);
      const builtTree = buildTreeFromFlat(data);
      setTreeRoots(builtTree);
    } catch (err) {
      setError('Error cargando jerarquía');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Actions
  const handleAddChild = (parentNode: OrganizationNode) => {
    setTargetNode(parentNode);
    setNodeModalMode('create');
    setShowNodeModal(true);
  };

  const handleEdit = (node: OrganizationNode) => {
    setTargetNode(node);
    setNodeModalMode('edit');
    setShowNodeModal(true);
  };

  const handleNodeSave = async (name: string, type: string, properties?: Record<string, any>, managerId?: string) => {
    if (!selectedStructureId) return;

    try {
      if (nodeModalMode === 'create' && targetNode) {
        // Create
        await DynamicHierarchyService.createNode({
          structure_id: selectedStructureId,
          parent_id: targetNode.id,
          name,
          type,
          properties,
          manager_id: managerId
        });
      } else if (nodeModalMode === 'edit' && targetNode) {
        // Edit
        await DynamicHierarchyService.updateNode(targetNode.id, {
          name,
          type,
          properties,
          manager_id: managerId
        });
      } else if (nodeModalMode === 'create' && !targetNode) {
        // Create root
        await DynamicHierarchyService.createNode({
          structure_id: selectedStructureId,
          parent_id: null,
          name,
          type,
          properties,
          manager_id: managerId
        });
      }

      await loadNodes(selectedStructureId); // Reload tree
      setShowNodeModal(false);
    } catch (err) {
      console.error(err);
      alert('Error guardando nodo');
    }
  };

  const handleDelete = (node: OrganizationNode) => {
    if (confirm(`¿Seguro eliminar ${node.name} y todos sus descendientes?`)) {
      DynamicHierarchyService.deleteNode(node.id)
        .then(res => {
          if (res.success) loadNodes(selectedStructureId!);
        });
    }
  };

  // Helper to handle new structure creation
  const handleNewStructure = () => {
    setShowStructureModal(true);
  };

  const handleSaveStructure = async (name: string) => {
    try {
      const res = await DynamicHierarchyService.createStructure(name);
      if (res.success) {
        loadStructures();
      } else {
        alert('Error: ' + res.error);
      }
    } catch (err) {
      alert('Error creating structure');
      console.error(err);
    }
  };

  return (
    <div
      className="rounded-lg shadow-sm border overflow-hidden"
      style={{
        backgroundColor: 'var(--org-card-background, #1E2329)',
        borderColor: 'var(--org-border-color, rgba(255,255,255,0.1))'
      }}
    >
      {/* Header / Structure Selector */}
      <div
        className="p-4 border-b flex justify-between items-center"
        style={{
          borderColor: 'var(--org-border-color, rgba(255,255,255,0.1))',
          backgroundColor: 'rgba(var(--org-card-background-rgb, 30, 35, 41), 0.5)'
        }}
      >
        <div className="flex items-center gap-3">
          <h2 className="font-semibold" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>Jerarquía Organizacional</h2>
          <select
            className="text-sm rounded-md px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            style={{
              backgroundColor: 'rgba(var(--org-card-background-rgb), 0.8)',
              borderColor: 'var(--org-border-color, #6C757D)',
              color: 'var(--org-text-color, #FFFFFF)'
            }}
            value={selectedStructureId || ''}
            onChange={(e) => setSelectedStructureId(e.target.value)}
            disabled={isLoading}
          >
            {structures.map(s => (
              <option key={s.id} value={s.id}>{s.name} {s.is_default ? '(Default)' : ''}</option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={handleNewStructure}
            className="text-sm px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
            style={{
              backgroundColor: 'var(--org-primary-button-color, #6366F1)',
              color: '#FFFFFF'
            }}
          >
            + Nueva Estructura
          </button>
          {/* Structure Members Management using Root Node */}
          <button
            onClick={async () => {
              if (!selectedStructureId) return;
              // Use local nodes state if available, or fetch
              let rootNode = nodes.find(n => !n.parent_id);

              if (!rootNode && selectedStructureId) {
                try {
                  const fetchedNodes = await DynamicHierarchyService.getTree(selectedStructureId);
                  rootNode = fetchedNodes.find(n => !n.parent_id);
                } catch (e) {
                  console.error("Error finding root node", e);
                }
              }

              if (rootNode) {
                setMemberModalNodeId(rootNode.id);
                setMemberModalNodeName(rootNode.name);
                setIsMemberModalOpen(true);
              } else {
                alert("No se encontró un nodo raíz para gestionar miembros. Cree un nodo 'General' primero.");
              }
            }}
            className="ml-2 text-sm px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium flex items-center gap-2"
            style={{
              backgroundColor: 'var(--org-secondary-button-color, #4F46E5)',
              color: '#FFFFFF'
            }}
          >
            <UserPlus className="w-4 h-4" />
            Miembros
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div
        className="min-h-[400px] rounded-b-lg"
        style={{
          backgroundColor: 'var(--org-card-background, #1E2329)'
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400">
            Cargando...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40 text-red-500">
            {error}
          </div>
        ) : treeRoots.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-sm">
            <p>No hay nodos en esta estructura.</p>
            <button
              onClick={() => {
                // Add Root Logic
                if (!selectedStructureId) return;
                DynamicHierarchyService.createNode({
                  structure_id: selectedStructureId,
                  name: 'General',
                  type: 'root',
                  parent_id: null
                }).then(() => loadNodes(selectedStructureId));
              }}
              className="mt-2 text-blue-600 hover:underline dark:text-blue-400"
            >
              Inicializar 'General'
            </button>
          </div>
        ) : (
          <div>
            {treeRoots.map(root => (
              <NodeItem
                key={root.id}
                node={root}
                level={0}
                onAddChild={handleAddChild}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <StructureForm
        isOpen={showStructureModal}
        onClose={() => setShowStructureModal(false)}
        onSave={handleSaveStructure}
      />

      <NodeForm
        isOpen={showNodeModal}
        onClose={() => setShowNodeModal(false)}
        onSave={handleNodeSave}
        mode={nodeModalMode}
        parentNode={nodeModalMode === 'create' ? targetNode : undefined}
        nodeToEdit={nodeModalMode === 'edit' ? targetNode : undefined}
      />

      {isMemberModalOpen && memberModalNodeId && (
        <MemberAssignmentModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          nodeId={memberModalNodeId}
          nodeName={memberModalNodeName}
          onSuccess={() => {
            // Refresh if needed
          }}
        />
      )}
    </div>
  );
};
