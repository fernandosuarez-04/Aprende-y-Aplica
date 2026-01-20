'use client';

import { useParams } from 'next/navigation';
import { NodeDashboard } from '@/features/business-panel/components/hierarchy';

export default function NodeDetailsPage() {
    const params = useParams();
    const nodeId = params.nodeId as string;

    return (
        <div className="w-full">
            <NodeDashboard nodeId={nodeId} />
        </div>
    );
}
