import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { X, Plus, FileText, Send, CheckCircle, Clock, AlertCircle, Download, Eye } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';

interface Contract {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  title: string;
  status: 'draft' | 'sent' | 'signed' | 'executed';
  investmentAmount: number;
  terms: {
    leverage: number;
    apr: number;
    lockupPeriod: number;
    minInvestment: number;
  };
  createdAt: any;
  signingDeadline?: any;
  signedDate?: any;
  docusignEnvelopeId?: string;
  signature?: {
    signedBy: string;
    signedAt: any;
    ipAddress: string;
  };
}

const CONTRACT_TEMPLATES = [
  {
    id: 'investment_agreement',
    name: 'Investment Agreement',
    description: 'Standard 3:1 leverage investment contract',
  },
  {
    id: 'staking_terms',
    name: 'Staking Terms & Conditions',
    description: '9% APR staking rewards agreement',
  },
  {
    id: 'collateral_pledge',
    name: 'Collateral Pledge Agreement',
    description: 'Collateral management terms',
  },
];

export function ContractManagementPanel() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    title: '',
    investmentAmount: 0,
    leverage: 2,
    apr: 9,
    lockupPeriod: 12,
    minInvestment: 20000,
    signingDeadline: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const contractsRef = collection(db, 'contracts');
      const snapshot = await getDocs(contractsRef);
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
      setContracts(contractsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedTemplate) {
      setError('Please select a contract template');
      return;
    }

    try {
      const contractId = `contract_${Date.now()}`;
      const contractDoc = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        title: formData.title || `${CONTRACT_TEMPLATES.find(t => t.id === selectedTemplate)?.name} - ${formData.customerName}`,
        status: 'draft' as const,
        investmentAmount: formData.investmentAmount,
        terms: {
          leverage: formData.leverage,
          apr: formData.apr,
          lockupPeriod: formData.lockupPeriod,
          minInvestment: formData.minInvestment,
        },
        createdAt: new Date(),
        createdBy: user?.uid,
        signingDeadline: formData.signingDeadline ? new Date(formData.signingDeadline) : null,
      };

      await setDoc(doc(db, 'contracts', contractId), contractDoc);

      setSuccess(`Contract generated successfully! Contract ID: ${contractId}`);
      setFormData({
        customerId: '',
        customerName: '',
        customerEmail: '',
        title: '',
        investmentAmount: 0,
        leverage: 2,
        apr: 9,
        lockupPeriod: 12,
        minInvestment: 20000,
        signingDeadline: '',
      });
      setSelectedTemplate('');
      setIsCreating(false);
      loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate contract');
    }
  };

  const handleSendForSignature = async (contractId: string) => {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'sent',
        sentAt: new Date(),
      });
      setSuccess('Contract sent for signature!');
      loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contract');
    }
  };

  const handleMarkSigned = async (contractId: string, contract: Contract) => {
    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'signed',
        signedDate: new Date(),
        signature: {
          signedBy: contract.customerEmail,
          signedAt: new Date(),
          ipAddress: 'webhook_signature',
        },
      });
      setSuccess('Contract marked as signed!');
      loadContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading contracts...</div>
        </CardContent>
      </Card>
    );
  }

  const draftContracts = contracts.filter(c => c.status === 'draft').length;
  const sentContracts = contracts.filter(c => c.status === 'sent').length;
  const signedContracts = contracts.filter(c => c.status === 'signed' || c.status === 'executed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">Contract Management</h2>
          <p className="text-primary-600 text-sm mt-1">Generate, track, and manage investment contracts</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Contract
        </Button>
      </div>

      {/* Create Contract Form */}
      {isCreating && (
        <Card className="border-2 border-accent-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Generate New Contract</span>
              <button onClick={() => setIsCreating(false)}>
                <X className="w-5 h-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerateContract} className="space-y-4">
              {/* Template Selection */}
              <div>
                <label className="text-sm font-semibold text-primary-700 block mb-2">
                  Contract Template *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {CONTRACT_TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? 'border-accent-500 bg-accent-50'
                          : 'border-primary-200 hover:border-accent-300'
                      }`}
                    >
                      <div className="font-semibold text-primary-900 text-sm">{template.name}</div>
                      <p className="text-primary-600 text-xs mt-1">{template.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Customer Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="John Doe"
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
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>

              {/* Investment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Investment Amount ($) *
                  </label>
                  <Input
                    type="number"
                    value={formData.investmentAmount}
                    onChange={(e) => setFormData({ ...formData, investmentAmount: Number(e.target.value) })}
                    placeholder="50000"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Leverage Ratio (1-3)
                  </label>
                  <select
                    value={formData.leverage}
                    onChange={(e) => setFormData({ ...formData, leverage: Number(e.target.value) })}
                    className="w-full p-2.5 border border-primary-200 rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
                  >
                    <option value={1}>1:1 (No Leverage)</option>
                    <option value={2}>2:1 (2x Leverage)</option>
                    <option value={3}>3:1 (3x Leverage)</option>
                  </select>
                </div>
              </div>

              {/* Terms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    APR (%)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.apr}
                    onChange={(e) => setFormData({ ...formData, apr: Number(e.target.value) })}
                    placeholder="9.0"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Lockup Period (months)
                  </label>
                  <Input
                    type="number"
                    value={formData.lockupPeriod}
                    onChange={(e) => setFormData({ ...formData, lockupPeriod: Number(e.target.value) })}
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Min Investment ($)
                  </label>
                  <Input
                    type="number"
                    value={formData.minInvestment}
                    onChange={(e) => setFormData({ ...formData, minInvestment: Number(e.target.value) })}
                    placeholder="20000"
                  />
                </div>
              </div>

              {/* Signing Deadline */}
              <div>
                <label className="text-sm font-semibold text-primary-700 block mb-2">
                  Signing Deadline
                </label>
                <Input
                  type="date"
                  value={formData.signingDeadline}
                  onChange={(e) => setFormData({ ...formData, signingDeadline: e.target.value })}
                />
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
                  Generate Contract
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
              <FileText className="w-4 h-4" />
              Total Contracts
            </p>
            <p className="text-4xl font-bold text-primary-900 mt-2">{contracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Drafts
            </p>
            <p className="text-4xl font-bold text-secondary-600 mt-2">{draftContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Send className="w-4 h-4" />
              Pending Signature
            </p>
            <p className="text-4xl font-bold text-info-600 mt-2">{sentContracts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Signed
            </p>
            <p className="text-4xl font-bold text-success-600 mt-2">{signedContracts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Contract Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Leverage</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Created</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(contract => (
                    <tr key={contract.id} className="border-b border-primary-100 hover:bg-primary-50">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary-900">{contract.customerName}</div>
                        <div className="text-primary-600 text-xs">{contract.customerEmail}</div>
                      </td>
                      <td className="py-4 px-4 text-primary-700">{contract.title}</td>
                      <td className="py-4 px-4 text-accent-600 font-semibold">
                        ${(contract.investmentAmount / 1000).toFixed(0)}K
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="info">{contract.terms.leverage}:1</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={
                          contract.status === 'draft' ? 'default' :
                          contract.status === 'sent' ? 'info' :
                          contract.status === 'signed' ? 'success' :
                          'success'
                        }>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-primary-600 text-xs">
                        {new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button className="p-1 hover:bg-info-100 rounded text-info-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {contract.status === 'draft' && (
                            <button
                              onClick={() => handleSendForSignature(contract.id)}
                              className="p-1 hover:bg-accent-100 rounded text-accent-600 transition-colors"
                              title="Send for signature"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {contract.status === 'sent' && (
                            <button
                              onClick={() => handleMarkSigned(contract.id, contract)}
                              className="p-1 hover:bg-success-100 rounded text-success-600 transition-colors"
                              title="Mark as signed"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button className="p-1 hover:bg-primary-100 rounded text-primary-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
            {contracts.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                <p className="text-primary-600 font-medium">No contracts yet</p>
                <p className="text-primary-400 text-sm">Create your first contract using the button above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="bg-info-50 border-2 border-info-200">
        <CardHeader>
          <CardTitle className="text-info-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            E-Signature Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-info-800 text-sm mb-3">
            This system is ready for DocuSign or HelloSign integration. Contracts are tracked in Firestore with:
          </p>
          <ul className="text-info-700 text-sm space-y-1 ml-4 list-disc">
            <li>Draft generation with dynamic field population</li>
            <li>Status tracking (draft → sent → signed → executed)</li>
            <li>Signing deadline management</li>
            <li>Signature capture and audit trail</li>
            <li>Webhook support for signature callbacks</li>
          </ul>
          <p className="text-info-700 text-xs mt-3">
            <strong>Next Step:</strong> Connect DocuSign API to enable automated e-signature requests and callback handling.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
