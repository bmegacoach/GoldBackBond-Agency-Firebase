import { useState } from 'react';
import { Button } from '../ui/Button';
import { X, ChevronRight, CheckCircle, AlertTriangle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  stage: number;
  estimatedValue?: number;
}

interface Stage {
  id: number;
  name: string;
  description: string;
}

interface SalesProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  currentStage: number;
  stages: Stage[];
  onStageUpdate: () => void;
}

// Required actions before progressing to each stage
const STAGE_REQUIREMENTS = {
  1: ['Identify prospect'],
  2: ['Initial email/call completed', 'Contact information verified'],
  3: ['Needs analysis documented', 'Pain points identified'],
  4: ['Solution presentation scheduled', 'Product benefits highlighted'],
  5: ['Objection raised', 'Response prepared'],
  6: ['Proposal created', 'Pricing finalized'],
  7: ['Client commitment confirmed', 'Contract ready'],
  8: ['Contract signed', 'Payment received'],
  9: ['Wallet setup complete', 'Staking activated'],
};

export function SalesProgressModal({
  isOpen,
  onClose,
  lead,
  currentStage,
  stages,
  onStageUpdate,
}: SalesProgressModalProps) {
  const [notes, setNotes] = useState('');
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const requirementsForNextStage = STAGE_REQUIREMENTS[currentStage + 1 as keyof typeof STAGE_REQUIREMENTS] || [];
  const canProgress = requirementsForNextStage.length === 0 || requirementsForNextStage.every(req => checklist[req]);

  const handleProgressStage = async () => {
    try {
      setLoading(true);
      setError(null);

      const leadRef = doc(db, 'leads', lead.id);
      await updateDoc(leadRef, {
        stage: currentStage + 1,
        status: getStatusFromStage(currentStage + 1),
        updatedAt: new Date(),
        notes: (lead as any).notes ? `${(lead as any).notes}\n\n[Stage ${currentStage} → ${currentStage + 1}] ${notes}` : `[Stage ${currentStage} → ${currentStage + 1}] ${notes}`,
      });

      onStageUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
    } finally {
      setLoading(false);
    }
  };

  const getStatusFromStage = (stage: number): string => {
    if (stage <= 3) return 'new';
    if (stage <= 5) return 'contacted';
    if (stage <= 7) return 'qualified';
    if (stage <= 8) return 'proposal';
    return 'converted';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-primary-100">
          <div>
            <h2 className="text-2xl font-bold text-primary-900">Progress Deal</h2>
            <p className="text-primary-600 text-sm mt-1">
              {lead.firstName} {lead.lastName} · {lead.company || 'Unknown'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-primary-50 flex items-center justify-center"
          >
            <X className="w-5 h-5 text-primary-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-6">
          {/* Current Stage */}
          <div>
            <h3 className="text-sm font-semibold text-primary-700 mb-2">Current Stage</h3>
            <div className="flex items-center gap-2 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <CheckCircle className="w-5 h-5 text-success-600" />
              <span className="text-primary-900 font-semibold">{currentStage}. {stages[currentStage - 1]?.name}</span>
            </div>
          </div>

          {/* Next Stage */}
          {currentStage < 9 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-2">Moving To</h3>
              <div className="flex items-center gap-2 p-3 bg-accent-50 rounded-lg border border-accent-200">
                <ChevronRight className="w-5 h-5 text-accent-600" />
                <span className="text-accent-900 font-semibold">
                  {currentStage + 1}. {stages[currentStage]?.name}
                </span>
              </div>
            </div>
          )}

          {/* Requirements Checklist */}
          {requirementsForNextStage.length > 0 && currentStage < 9 && (
            <div>
              <h3 className="text-sm font-semibold text-primary-700 mb-3">Required Actions</h3>
              <div className="space-y-2">
                {requirementsForNextStage.map((requirement) => (
                  <label key={requirement} className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border border-primary-200 cursor-pointer hover:bg-primary-100">
                    <input
                      type="checkbox"
                      checked={checklist[requirement] || false}
                      onChange={(e) => setChecklist({ ...checklist, [requirement]: e.target.checked })}
                      className="w-4 h-4 rounded text-accent-600 border-primary-300"
                    />
                    <span className="text-primary-700 text-sm">{requirement}</span>
                  </label>
                ))}
              </div>
              {!canProgress && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                  <span className="text-warning-700 text-sm">Complete all required actions to progress</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-sm font-semibold text-primary-700 block mb-2">
              Notes for This Stage
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document any important information about this stage..."
              className="w-full p-3 border border-primary-200 rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-100 text-sm"
              rows={4}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-danger-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-primary-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {currentStage < 9 && (
            <Button
              type="button"
              variant="primary"
              onClick={handleProgressStage}
              disabled={loading || !canProgress}
              className="px-6"
            >
              {loading ? 'Updating...' : `Move to Stage ${currentStage + 1}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
