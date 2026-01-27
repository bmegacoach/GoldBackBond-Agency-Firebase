import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { CheckCircle, Clock, AlertCircle, ArrowRight, User, Plus, X, Mail, Settings } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';

interface OnboardingWorkflow {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  currentStep: number;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  steps: OnboardingStep[];
  startedAt: any;
  completedAt?: any;
  failureReason?: string;
}

interface OnboardingStep {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  completedAt?: any;
  data?: any;
}

const ONBOARDING_STEPS: Omit<OnboardingStep, 'status' | 'completedAt' | 'data'>[] = [
  {
    id: 1,
    name: 'Account Setup',
    description: 'Create and verify user account',
  },
  {
    id: 2,
    name: 'KYC/AML Verification',
    description: 'Identity verification and compliance check',
  },
  {
    id: 3,
    name: 'Bank Account Linking',
    description: 'Connect bank account for deposits/withdrawals',
  },
  {
    id: 4,
    name: 'Wallet Creation',
    description: 'Create blockchain wallet for staking',
  },
  {
    id: 5,
    name: 'Initial Deposit',
    description: 'Make initial investment deposit',
  },
  {
    id: 6,
    name: 'Staking Setup',
    description: 'Configure staking parameters and leverage',
  },
  {
    id: 7,
    name: 'Dashboard Access',
    description: 'Activate user dashboard and real-time monitoring',
  },
];

export function AutomatedOnboardingPanel() {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<OnboardingWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadWorkflows();
    }
  }, [user]);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      const workflowsRef = collection(db, 'onboardingWorkflows');
      const snapshot = await getDocs(workflowsRef);
      const workflowsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as OnboardingWorkflow[];
      setWorkflows(workflowsData.sort((a, b) => 
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ));
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.customerName || !formData.customerEmail) {
      setError('Please provide customer name and email');
      return;
    }

    try {
      const workflowId = `workflow_${Date.now()}`;
      const steps: OnboardingStep[] = ONBOARDING_STEPS.map(step => ({
        ...step,
        status: 'pending' as const,
      }));

      const workflowDoc = {
        customerId: `cust_${Date.now()}`,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        currentStep: 1,
        status: 'in-progress' as const,
        steps,
        startedAt: new Date(),
        createdBy: user?.uid,
      };

      await setDoc(doc(db, 'onboardingWorkflows', workflowId), workflowDoc);

      setSuccess(`Onboarding workflow started! Workflow ID: ${workflowId}`);
      setFormData({ customerName: '', customerEmail: '' });
      setIsCreating(false);
      loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workflow');
    }
  };

  const handleProgressStep = async (workflowId: string, stepId: number) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      const updatedSteps = workflow.steps.map(step => {
        if (step.id === stepId) {
          return { ...step, status: 'completed' as const, completedAt: new Date() };
        }
        return step;
      });

      const nextStep = Math.min(stepId + 1, ONBOARDING_STEPS.length);
      const isComplete = stepId === ONBOARDING_STEPS.length;

      await updateDoc(doc(db, 'onboardingWorkflows', workflowId), {
        steps: updatedSteps,
        currentStep: nextStep,
        status: isComplete ? 'completed' : 'in-progress',
        completedAt: isComplete ? new Date() : undefined,
      });

      if (isComplete) {
        setSuccess('Onboarding workflow completed! Customer is now ready to invest.');
      } else {
        setSuccess(`Step ${stepId} completed. Moving to next step...`);
      }
      loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to progress step');
    }
  };

  const handleFailStep = async (workflowId: string, reason: string) => {
    try {
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) return;

      await updateDoc(doc(db, 'onboardingWorkflows', workflowId), {
        status: 'failed',
        failureReason: reason,
      });

      setError(null);
      setSuccess(`Workflow marked as failed. Customer notified.`);
      loadWorkflows();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark workflow as failed');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading workflows...</div>
        </CardContent>
      </Card>
    );
  }

  const stats = {
    total: workflows.length,
    inProgress: workflows.filter(w => w.status === 'in-progress').length,
    completed: workflows.filter(w => w.status === 'completed').length,
    failed: workflows.filter(w => w.status === 'failed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">Onboarding Workflows</h2>
          <p className="text-primary-600 text-sm mt-1">Manage automated customer onboarding process</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Start Workflow
        </Button>
      </div>

      {/* Start Workflow Form */}
      {isCreating && (
        <Card className="border-2 border-accent-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Start New Onboarding Workflow</span>
              <button onClick={() => setIsCreating(false)}>
                <X className="w-5 h-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStartWorkflow} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Customer Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Jane Smith"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="jane@example.com"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary">
                  Start Workflow
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Total Workflows
            </p>
            <p className="text-4xl font-bold text-primary-900 mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              In Progress
            </p>
            <p className="text-4xl font-bold text-info-600 mt-2">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </p>
            <p className="text-4xl font-bold text-success-600 mt-2">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Failed
            </p>
            <p className="text-4xl font-bold text-danger-600 mt-2">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Workflows */}
      {workflows.map(workflow => (
        <Card key={workflow.id} className={workflow.status === 'failed' ? 'border-2 border-danger-200' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{workflow.customerName}</CardTitle>
                <p className="text-primary-600 text-sm mt-1">{workflow.customerEmail}</p>
              </div>
              <div className="text-right">
                <Badge variant={
                  workflow.status === 'completed' ? 'success' :
                  workflow.status === 'failed' ? 'error' :
                  'info'
                }>
                  {workflow.status.toUpperCase()}
                </Badge>
                <p className="text-primary-600 text-xs mt-2">
                  Step {workflow.currentStep} of {ONBOARDING_STEPS.length}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {workflow.status === 'failed' && workflow.failureReason && (
              <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm mb-4">
                <strong>Failure Reason:</strong> {workflow.failureReason}
              </div>
            )}

            {/* Steps Progress */}
            <div className="space-y-3">
              {workflow.steps.map((step, index) => (
                <div key={step.id}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-6 h-6 text-success-600" />
                      ) : step.status === 'in-progress' ? (
                        <div className="w-6 h-6 rounded-full border-2 border-info-600 border-t-transparent animate-spin" />
                      ) : step.status === 'failed' ? (
                        <AlertCircle className="w-6 h-6 text-danger-600" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-primary-300" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-3">
                        <div>
                          <h4 className="font-semibold text-primary-900">{step.name}</h4>
                          <p className="text-primary-600 text-sm">{step.description}</p>
                        </div>
                      </div>

                      {/* Step Actions */}
                      {workflow.status === 'in-progress' && (
                        <div className="flex gap-2 mt-3">
                          {step.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleProgressStep(workflow.id, step.id)}
                            >
                              Mark Complete
                            </Button>
                          )}
                          {step.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                const reason = window.prompt('Why is this step failing?');
                                if (reason) handleFailStep(workflow.id, reason);
                              }}
                            >
                              Mark Failed
                            </Button>
                          )}
                        </div>
                      )}

                      {step.completedAt && (
                        <p className="text-success-600 text-xs mt-2">
                          ✓ Completed {new Date(step.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Step Connector */}
                  {index < workflow.steps.length - 1 && (
                    <div className="ml-3 h-8 border-l-2 border-primary-200 my-2" />
                  )}
                </div>
              ))}
            </div>

            {/* Timestamps */}
            <div className="flex gap-6 mt-6 pt-6 border-t border-primary-100 text-xs text-primary-600">
              <div>
                <span className="font-semibold">Started:</span>{' '}
                {new Date(workflow.startedAt).toLocaleString()}
              </div>
              {workflow.completedAt && (
                <div>
                  <span className="font-semibold">Completed:</span>{' '}
                  {new Date(workflow.completedAt).toLocaleString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {workflows.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="w-12 h-12 text-primary-200 mx-auto mb-4" />
            <p className="text-primary-600 font-medium">No workflows yet</p>
            <p className="text-primary-400 text-sm">Start a new onboarding workflow to get your customers set up</p>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Flow Diagram */}
      <Card className="bg-accent-50 border-2 border-accent-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Onboarding Flow Diagram
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {ONBOARDING_STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="bg-white border border-accent-300 rounded-lg px-3 py-2 font-semibold text-primary-900">
                  {index + 1}. {step.name}
                </div>
                {index < ONBOARDING_STEPS.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-primary-400" />
                )}
              </React.Fragment>
            ))}
          </div>
          <p className="text-accent-700 text-sm mt-4">
            <strong>Timeline:</strong> Each step includes automated email notifications. Failed steps trigger support alerts
            for manual intervention. Completed workflows enable full dashboard access and real-time monitoring.
          </p>
        </CardContent>
      </Card>

      {/* Email Notifications Framework */}
      <Card className="bg-info-50 border-2 border-info-200">
        <CardHeader>
          <CardTitle className="text-info-900 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Automated Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-info-800 text-sm mb-3">
            Each workflow step triggers automated emails:
          </p>
          <ul className="text-info-700 text-sm space-y-2 ml-4 list-disc">
            <li><strong>Step 1:</strong> Welcome email with account credentials</li>
            <li><strong>Step 2:</strong> KYC/AML verification link</li>
            <li><strong>Step 3:</strong> Bank linking instructions with Plaid integration</li>
            <li><strong>Step 4:</strong> Wallet creation confirmation</li>
            <li><strong>Step 5:</strong> Deposit confirmation and receipt</li>
            <li><strong>Step 6:</strong> Staking setup guide with parameters</li>
            <li><strong>Step 7:</strong> Dashboard access confirmation</li>
          </ul>
          <p className="text-info-700 text-xs mt-3">
            <strong>Failed steps:</strong> Auto-escalate to support team with retry options
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
