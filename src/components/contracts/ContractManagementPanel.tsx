import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { X, Plus, FileText, Send, CheckCircle, Clock, AlertCircle, Download, Eye, Upload, RefreshCw, ExternalLink, Ban } from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, query, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';
import { useOpenSign, isOpenSignConfigured } from '@/lib/opensign';

// Default columns for the contracts table
const ALL_COLUMNS = [
  { key: 'customer', label: 'Customer' },
  { key: 'title', label: 'Contract Type' },
  { key: 'amount', label: 'Amount' },
  { key: 'leverage', label: 'Leverage' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: 'Actions' },
];

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
  openSignDocumentId?: string;
  openSignUrl?: string;
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
  {
    id: 'trainee_agreement',
    name: 'Sales Agent Agreement',
    description: 'New trainee onboarding contract',
  },
];

export function ContractManagementPanel() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.map(col => col.key));
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // OpenSign integration
  const { 
    isConfigured: openSignConfigured, 
    loading: openSignLoading, 
    error: openSignError,
    sendForSignature,
    checkDocumentStatus,
    resendRequest,
    cancelDocument,
    clearError: clearOpenSignError,
  } = useOpenSign();

  const toggleColumn = (key: string) => {
    setVisibleColumns((cols: string[]) =>
      cols.includes(key) ? cols.filter((c: string) => c !== key) : [...cols, key]
    );
  };

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
      loadContracts(true);
    }
  }, [user, statusFilter]);

  const loadContracts = async (reset = false) => {
    try {
      setLoading(true);
      let q = query(
        collection(db, 'contracts'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );
      if (statusFilter) {
        q = query(
          collection(db, 'contracts'),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
          limit(PAGE_SIZE)
        );
      }
      if (!reset && lastDoc) {
        q = query(q, startAfter(lastDoc));
      }
      const snapshot = await getDocs(q);
      const contractsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contract[];
      if (reset) {
        setContracts(contractsData);
      } else {
        setContracts(prev => [...prev, ...contractsData]);
      }
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error('Failed to load contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadContracts();
    }
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setLastDoc(null);
    setHasMore(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
    } else {
      setError('Please upload a PDF file');
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
        templateType: selectedTemplate,
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
      setUploadedFile(null);
      setIsCreating(false);
      loadContracts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate contract');
    }
  };

  const handleSendForSignature = async (contractId: string, contract: Contract) => {
    setError(null);
    setSuccess(null);

    if (!openSignConfigured) {
      // Fallback to simple status update if OpenSign not configured
      try {
        await updateDoc(doc(db, 'contracts', contractId), {
          status: 'sent',
          sentAt: new Date(),
        });
        setSuccess('Contract marked as sent. Configure OpenSign for automated e-signatures.');
        loadContracts(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send contract');
      }
      return;
    }

    // Use OpenSign for real e-signature
    try {
      if (!uploadedFile) {
        setError('Please upload a PDF contract document first');
        return;
      }

      const openSignDoc = await sendForSignature({
        title: contract.title,
        file: uploadedFile,
        signers: [{
          name: contract.customerName,
          email: contract.customerEmail,
          role: 'Customer',
        }],
        note: `Please sign your ${contract.title}. Investment amount: $${contract.investmentAmount.toLocaleString()}`,
        expiryDays: 14,
      });

      if (openSignDoc) {
        await updateDoc(doc(db, 'contracts', contractId), {
          status: 'sent',
          sentAt: new Date(),
          openSignDocumentId: openSignDoc.objectId,
          openSignUrl: openSignDoc.URL,
        });
        setSuccess(`Contract sent to ${contract.customerEmail} via OpenSign!`);
        setUploadedFile(null);
        loadContracts(true);
      } else {
        setError(openSignError || 'Failed to send contract via OpenSign');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send contract');
    }
  };

  const handleCheckStatus = async (contractId: string, openSignDocumentId: string) => {
    setError(null);
    
    try {
      const openSignDoc = await checkDocumentStatus(openSignDocumentId);
      
      if (openSignDoc) {
        let newStatus: Contract['status'] = 'sent';
        
        if (openSignDoc.Status === 'completed') {
          newStatus = 'signed';
        } else if (openSignDoc.Status === 'declined' || openSignDoc.Status === 'expired') {
          newStatus = 'draft'; // Reset to draft if declined/expired
        }

        await updateDoc(doc(db, 'contracts', contractId), {
          status: newStatus,
          ...(newStatus === 'signed' ? {
            signedDate: new Date(),
            signature: {
              signedBy: openSignDoc.Signers?.[0]?.email || 'customer',
              signedAt: new Date(),
              ipAddress: 'opensign_signature',
            },
          } : {}),
        });

        if (newStatus === 'signed') {
          setSuccess('Contract has been signed!');
        } else {
          setSuccess(`Contract status: ${openSignDoc.Status}`);
        }
        loadContracts(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status');
    }
  };

  const handleResendRequest = async (contractId: string, contract: Contract) => {
    setError(null);
    
    if (!contract.openSignDocumentId) {
      setError('No OpenSign document ID found');
      return;
    }

    const success = await resendRequest(contract.openSignDocumentId, contract.customerEmail);
    if (success) {
      setSuccess(`Signature request resent to ${contract.customerEmail}`);
    } else {
      setError(openSignError || 'Failed to resend request');
    }
  };

  const handleCancelContract = async (contractId: string, contract: Contract) => {
    setError(null);

    if (contract.openSignDocumentId) {
      await cancelDocument(contract.openSignDocumentId);
    }

    try {
      await updateDoc(doc(db, 'contracts', contractId), {
        status: 'draft',
        openSignDocumentId: null,
        openSignUrl: null,
      });
      setSuccess('Contract cancelled and reset to draft');
      loadContracts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel contract');
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
          ipAddress: 'manual_confirmation',
        },
      });
      setSuccess('Contract marked as signed!');
      loadContracts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  if (loading && contracts.length === 0) {
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
          <p className="text-primary-600 text-sm mt-1">Generate, track, and manage investment contracts with e-signatures</p>
        </div>
        <div className="flex gap-4 items-center">
          <select
            className="border border-primary-200 rounded px-2 py-1 text-sm"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="signed">Signed</option>
            <option value="executed">Executed</option>
          </select>
          <Button
            variant="primary"
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* OpenSign Status Banner */}
      {!openSignConfigured && (
        <Card className="bg-warning-50 border-2 border-warning-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-warning-600" />
            <div className="flex-1">
              <p className="text-warning-800 font-medium">OpenSign Not Configured</p>
              <p className="text-warning-700 text-sm">
                Add VITE_OPENSIGN_API_KEY to your .env.local file to enable automated e-signatures.
              </p>
            </div>
            <a
              href="https://app.opensignlabs.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-warning-700 hover:text-warning-900 flex items-center gap-1 text-sm"
            >
              Get API Key <ExternalLink className="w-3 h-3" />
            </a>
          </CardContent>
        </Card>
      )}

      {openSignConfigured && (
        <Card className="bg-success-50 border-2 border-success-200">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success-600" />
            <div className="flex-1">
              <p className="text-success-800 font-medium">OpenSign Connected</p>
              <p className="text-success-700 text-sm">
                E-signature integration is active. Contracts will be sent via OpenSign.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => { setError(null); clearOpenSignError(); }} className="text-danger-500 hover:text-danger-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess(null)} className="text-success-500 hover:text-success-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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

              {/* PDF Upload */}
              <div>
                <label className="text-sm font-semibold text-primary-700 block mb-2">
                  Contract PDF Document
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadedFile ? 'Change File' : 'Upload PDF'}
                  </Button>
                  {uploadedFile && (
                    <span className="text-sm text-success-600 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      {uploadedFile.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-primary-500 mt-1">
                  Upload the PDF contract document for e-signature
                </p>
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
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <CardTitle>All Contracts</CardTitle>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-primary-500 mr-2">Columns:</span>
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={() => toggleColumn(col.key)}
                  className="accent-primary-600"
                />
                {col.label}
              </label>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-200">
                  {ALL_COLUMNS.map(col => visibleColumns.includes(col.key) && (
                    <th key={col.key} className="text-left py-3 px-4 font-semibold text-primary-700">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contracts.map(contract => (
                  <tr key={contract.id} className="border-b border-primary-100 hover:bg-primary-50">
                    {visibleColumns.includes('customer') && (
                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary-900">{contract.customerName}</div>
                        <div className="text-primary-600 text-xs">{contract.customerEmail}</div>
                      </td>
                    )}
                    {visibleColumns.includes('title') && (
                      <td className="py-4 px-4 text-primary-700">{contract.title}</td>
                    )}
                    {visibleColumns.includes('amount') && (
                      <td className="py-4 px-4 text-accent-600 font-semibold">
                        ${(contract.investmentAmount / 1000).toFixed(0)}K
                      </td>
                    )}
                    {visibleColumns.includes('leverage') && (
                      <td className="py-4 px-4">
                        <Badge variant="info">{contract.terms.leverage}:1</Badge>
                      </td>
                    )}
                    {visibleColumns.includes('status') && (
                      <td className="py-4 px-4">
                        <Badge variant={
                          contract.status === 'draft' ? 'default' :
                          contract.status === 'sent' ? 'info' :
                          contract.status === 'signed' ? 'success' :
                          'success'
                        }>
                          {contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                        </Badge>
                        {contract.openSignDocumentId && (
                          <span className="ml-1 text-xs text-accent-600">(OpenSign)</span>
                        )}
                      </td>
                    )}
                    {visibleColumns.includes('created') && (
                      <td className="py-4 px-4 text-primary-600 text-xs">
                        {contract.createdAt?.toDate ? 
                          contract.createdAt.toDate().toLocaleDateString() : 
                          new Date(contract.createdAt).toLocaleDateString()}
                      </td>
                    )}
                    {visibleColumns.includes('actions') && (
                      <td className="py-4 px-4">
                        <div className="flex gap-1">
                          {/* View */}
                          {contract.openSignUrl && (
                            <a
                              href={contract.openSignUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 hover:bg-info-100 rounded text-info-600 transition-colors"
                              title="View in OpenSign"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button 
                            className="p-1 hover:bg-info-100 rounded text-info-600 transition-colors"
                            title="View contract"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Draft: Send for signature */}
                          {contract.status === 'draft' && (
                            <button
                              onClick={() => handleSendForSignature(contract.id, contract)}
                              className="p-1 hover:bg-accent-100 rounded text-accent-600 transition-colors"
                              title="Send for signature"
                              disabled={openSignLoading}
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}

                          {/* Sent: Check status, Resend, Cancel */}
                          {contract.status === 'sent' && (
                            <>
                              {contract.openSignDocumentId && (
                                <button
                                  onClick={() => handleCheckStatus(contract.id, contract.openSignDocumentId!)}
                                  className="p-1 hover:bg-info-100 rounded text-info-600 transition-colors"
                                  title="Check signature status"
                                  disabled={openSignLoading}
                                >
                                  <RefreshCw className={`w-4 h-4 ${openSignLoading ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                              <button
                                onClick={() => handleResendRequest(contract.id, contract)}
                                className="p-1 hover:bg-accent-100 rounded text-accent-600 transition-colors"
                                title="Resend signature request"
                                disabled={openSignLoading}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleMarkSigned(contract.id, contract)}
                                className="p-1 hover:bg-success-100 rounded text-success-600 transition-colors"
                                title="Mark as signed (manual)"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleCancelContract(contract.id, contract)}
                                className="p-1 hover:bg-danger-100 rounded text-danger-600 transition-colors"
                                title="Cancel contract"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Signed: Download */}
                          {(contract.status === 'signed' || contract.status === 'executed') && (
                            <button className="p-1 hover:bg-primary-100 rounded text-primary-600 transition-colors" title="Download signed contract">
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {contracts.length === 0 && !loading && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-primary-200 mx-auto mb-4" />
                <p className="text-primary-600 font-medium">No contracts yet</p>
                <p className="text-primary-400 text-sm">Create your first contract using the button above</p>
              </div>
            )}
            {hasMore && contracts.length > 0 && (
              <div className="flex justify-center py-4">
                <Button onClick={handleLoadMore} disabled={loading} variant="secondary">
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Integration Info */}
      <Card className="bg-gradient-to-r from-accent-50 to-info-50 border-2 border-accent-200">
        <CardHeader>
          <CardTitle className="text-accent-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5" />
            E-Signature Integration (OpenSign)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-accent-800 text-sm mb-3">
            This system is integrated with OpenSign for automated e-signatures. Features include:
          </p>
          <ul className="text-accent-700 text-sm space-y-1 ml-4 list-disc">
            <li>Send contracts for e-signature via email</li>
            <li>Real-time signature status tracking</li>
            <li>Automatic status updates when signed</li>
            <li>Resend signature requests</li>
            <li>Cancel pending signature requests</li>
            <li>Audit trail and signature capture</li>
          </ul>
          {!openSignConfigured && (
            <div className="mt-4 p-3 bg-warning-100 rounded-lg">
              <p className="text-warning-800 text-sm font-medium">
                To enable OpenSign integration:
              </p>
              <ol className="text-warning-700 text-xs mt-2 ml-4 list-decimal">
                <li>Create an account at <a href="https://app.opensignlabs.com" target="_blank" rel="noopener noreferrer" className="underline">app.opensignlabs.com</a></li>
                <li>Go to Settings → API to get your API key</li>
                <li>Add <code className="bg-warning-200 px-1 rounded">VITE_OPENSIGN_API_KEY=your_key</code> to .env.local</li>
                <li>Restart the development server</li>
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Import FileSignature icon for the integration info card
import { FileSignature } from 'lucide-react';
