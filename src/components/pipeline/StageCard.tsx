import { Badge } from '../ui/Badge';
import { ChevronRight, DollarSign, Calendar } from 'lucide-react';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  estimatedValue?: number;
  closeDate?: string;
}

interface Stage {
  id: number;
  name: string;
  color: string;
}

interface StageCardProps {
  lead: Lead;
  stage: Stage;
  onSelect: () => void;
}

export function StageCard({ lead, onSelect }: Omit<StageCardProps, 'stage'>) {
  return (
    <div
      onClick={onSelect}
      className="bg-white rounded-lg p-3 border-2 border-primary-200 hover:border-accent-500 cursor-pointer transition-all shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-primary-900 text-sm">
            {lead.firstName} {lead.lastName}
          </h4>
          <p className="text-primary-600 text-xs">{lead.company || 'No company'}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-primary-400" />
      </div>

      <div className="space-y-2">
        {lead.estimatedValue && (
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="w-3 h-3 text-accent-600" />
            <span className="text-accent-600 font-semibold">${(lead.estimatedValue / 1000).toFixed(0)}K</span>
          </div>
        )}
        {lead.closeDate && (
          <div className="flex items-center gap-2 text-xs text-primary-600">
            <Calendar className="w-3 h-3" />
            <span>{new Date(lead.closeDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      <Badge variant="info" className="mt-2 text-xs">{lead.email}</Badge>
    </div>
  );
}
