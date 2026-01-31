import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ArrowRight, BarChart3, Plus } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';
import { StageCard } from './StageCard';
import { SalesProgressModal } from './SalesProgressModal';
import { LeadFormModal } from '../forms/LeadFormModal';
import { useDataStore } from '@/hooks/useDataStore';
import { useSchema } from '@/hooks/useSchema';

// 9-Step Rocket Selling System Pipeline
const PIPELINE_STAGES = [
  { id: 1, name: 'Prospect Identification', description: 'Identify target accounts', color: 'primary' },
  { id: 2, name: 'Initial Contact', description: 'First outreach via email/call', color: 'blue' },
  { id: 3, name: 'Needs Analysis', description: 'Understand client requirements', color: 'info' },
  { id: 4, name: 'Solution Presentation', description: 'Present 3:1 leverage opportunity', color: 'accent' },
  { id: 5, name: 'Objection Handling', description: 'Address concerns & build trust', color: 'warning' },
  { id: 6, name: 'Proposal/Negotiation', description: 'Define terms & pricing', color: 'secondary' },
  { id: 7, name: 'Commitment', description: 'Secure client commitment', color: 'success' },
  { id: 8, name: 'Signature & Payment', description: 'Contract signature & funding', color: 'info' },
  { id: 9, name: 'Onboarding & Activation', description: 'Wallet setup & staking', color: 'success' },
];

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  status: string;
  stage: number;
  estimatedValue?: number;
  closeDate?: string;
  createdAt?: any;
}

interface StageData {
  stageName: string;
  leadCount: number;
  totalValue: number;
  leads: Lead[];
}

export function PipelineView() {
  const { user } = useAuth();
  const [stages, setStages] = useState<StageData[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'kanban' | 'list' | 'analytics'>('kanban');
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const dataStore = useDataStore<Lead>({ collectionName: 'leads' });
  const schema = useSchema({ collectionName: 'leads' });

  useEffect(() => {
    if (user) {
      loadPipelineData();
    }
  }, [user]);

  const loadPipelineData = async () => {
    try {
      setLoading(true);
      const leadsRef = collection(db, 'leads');
      const snapshot = await getDocs(leadsRef);

      const leadsByStage: Record<number, Lead[]> = {};
      PIPELINE_STAGES.forEach(stage => {
        leadsByStage[stage.id] = [];
      });

      snapshot.docs.forEach(doc => {
        const lead = { id: doc.id, ...doc.data() } as Lead;
        const stageNum = lead.stage || 1;
        if (leadsByStage[stageNum]) {
          leadsByStage[stageNum].push(lead);
        }
      });

      const stageData = PIPELINE_STAGES.map(stage => ({
        stageName: stage.name,
        leadCount: leadsByStage[stage.id].length,
        totalValue: leadsByStage[stage.id].reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0),
        leads: leadsByStage[stage.id],
      }));

      setStages(stageData);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalDeals = stages.reduce((sum, stage) => sum + stage.leadCount, 0);
  const totalValue = stages.reduce((sum, stage) => sum + stage.totalValue, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading pipeline...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">Sales Pipeline</h2>
          <p className="text-primary-600 text-sm mt-1">9-Step Rocket Selling System</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setIsLeadFormOpen(true)}
            className="mr-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
          <Button
            variant={viewType === 'kanban' ? 'primary' : 'outline'}
            onClick={() => setViewType('kanban')}
            className="px-4"
          >
            Kanban
          </Button>
          <Button
            variant={viewType === 'list' ? 'primary' : 'outline'}
            onClick={() => setViewType('list')}
            className="px-4"
          >
            List
          </Button>
          <Button
            variant={viewType === 'analytics' ? 'primary' : 'outline'}
            onClick={() => setViewType('analytics')}
            className="px-4"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold">Total Deals</div>
            <div className="text-4xl font-bold text-primary-900 mt-2">{totalDeals}</div>
            <div className="text-success-600 text-sm mt-2">Across all stages</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold">Total Pipeline Value</div>
            <div className="text-4xl font-bold text-primary-900 mt-2">
              ${(totalValue / 1000).toFixed(0)}K
            </div>
            <div className="text-success-600 text-sm mt-2">AUM potential</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-primary-600 text-sm font-semibold">Conversion Rate</div>
            <div className="text-4xl font-bold text-accent-600 mt-2">
              {stages[8]?.leadCount > 0 ? ((stages[8].leadCount / totalDeals) * 100).toFixed(0) : 0}%
            </div>
            <div className="text-success-600 text-sm mt-2">To Stage 9 (Active)</div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban View */}
      {viewType === 'kanban' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-x-auto">
          {PIPELINE_STAGES.map((stage, idx) => (
            <div key={stage.id} className="flex flex-col gap-2">
              {/* Stage Header */}
              <div className="flex items-center justify-between bg-primary-50 p-4 rounded-lg border border-primary-100">
                <div>
                  <h3 className="font-semibold text-primary-900 text-sm">{stage.name}</h3>
                  <p className="text-primary-600 text-xs">{stages[idx]?.leadCount || 0} deals</p>
                </div>
                <Badge variant="info">${((stages[idx]?.totalValue || 0) / 1000).toFixed(0)}K</Badge>
              </div>

              {/* Stage Cards */}
              <div className="space-y-2 min-h-[400px] bg-primary-50 rounded-lg p-2">
                {stages[idx]?.leads.map(lead => (
                  <StageCard
                    key={lead.id}
                    lead={lead}
                    onSelect={() => {
                      setSelectedLead(lead);
                      setIsModalOpen(true);
                    }}
                  />
                ))}
                {(stages[idx]?.leads.length || 0) === 0 && (
                  <div className="h-full flex items-center justify-center text-primary-400 text-sm">
                    No deals in this stage
                  </div>
                )}
              </div>

              {/* Stage Actions */}
              {idx < PIPELINE_STAGES.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowRight className="w-4 h-4 text-primary-300 rotate-90" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Analytics View */}
      {viewType === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stage Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Distribution by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, idx) => (
                  <div key={stage.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-primary-700">{stage.name}</span>
                      <span className="text-sm font-bold text-primary-900">{stages[idx]?.leadCount}</span>
                    </div>
                    <div className="w-full bg-primary-100 rounded-full h-2">
                      <div
                        className="bg-accent-500 h-2 rounded-full transition-all"
                        style={{ width: `${totalDeals > 0 ? (stages[idx]?.leadCount / totalDeals) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Value by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Pipeline Value by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage, idx) => (
                  <div key={stage.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-primary-700">{stage.name}</span>
                      <span className="text-sm font-bold text-accent-600">
                        ${((stages[idx]?.totalValue || 0) / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="w-full bg-primary-100 rounded-full h-2">
                      <div
                        className="bg-accent-500 h-2 rounded-full transition-all"
                        style={{ width: `${totalValue > 0 ? (stages[idx]?.totalValue / totalValue) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stage Progression Modal */}
      <SalesProgressModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        currentStage={selectedLead?.stage || 1}
        stages={PIPELINE_STAGES}
        onStageUpdate={() => {
          loadPipelineData();
        }}
      />

      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        onSubmit={async (data) => {
          await dataStore.create(data);
          loadPipelineData();
          setIsLeadFormOpen(false);
        }}
        loading={dataStore.loading}
        dynamicColumns={schema.columns}
      />
    </div>
  );
}
