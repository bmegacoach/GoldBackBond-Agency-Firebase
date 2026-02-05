/**
 * React hook for OpenSign integration
 */

import { useState, useCallback } from 'react';
import {
  isOpenSignConfigured,
  createDocument,
  createDocumentFromTemplate,
  getDocument,
  getDocumentList,
  revokeDocument,
  resendSignatureRequest,
  fileToBase64,
  DEFAULT_SIGNATURE_WIDGETS,
  type OpenSignSigner,
  type OpenSignWidget,
  type OpenSignDocument,
  type CreateDocumentRequest,
} from './opensign-service';

export interface UseOpenSignReturn {
  isConfigured: boolean;
  loading: boolean;
  error: string | null;
  sendForSignature: (params: {
    title: string;
    file: File | string; // File object or base64 string
    signers: OpenSignSigner[];
    widgets?: OpenSignWidget[];
    note?: string;
    expiryDays?: number;
  }) => Promise<OpenSignDocument | null>;
  sendFromTemplate: (params: {
    templateId: string;
    signers: OpenSignSigner[];
    title?: string;
    note?: string;
    prefillData?: Record<string, string>;
  }) => Promise<OpenSignDocument | null>;
  checkDocumentStatus: (documentId: string) => Promise<OpenSignDocument | null>;
  fetchDocuments: (status?: 'in-progress' | 'completed' | 'declined') => Promise<OpenSignDocument[]>;
  cancelDocument: (documentId: string) => Promise<boolean>;
  resendRequest: (documentId: string, signerEmail?: string) => Promise<boolean>;
  clearError: () => void;
}

export function useOpenSign(): UseOpenSignReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isOpenSignConfigured();

  const clearError = useCallback(() => setError(null), []);

  const sendForSignature = useCallback(async (params: {
    title: string;
    file: File | string;
    signers: OpenSignSigner[];
    widgets?: OpenSignWidget[];
    note?: string;
    expiryDays?: number;
  }): Promise<OpenSignDocument | null> => {
    setLoading(true);
    setError(null);

    try {
      // Convert file to base64 if it's a File object
      let base64File: string;
      if (typeof params.file === 'string') {
        base64File = params.file;
      } else {
        base64File = await fileToBase64(params.file);
      }

      // Calculate expiry date if specified
      let expiryDate: string | undefined;
      if (params.expiryDays) {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + params.expiryDays);
        expiryDate = expiry.toISOString().split('T')[0];
      }

      const result = await createDocument({
        title: params.title,
        file: base64File,
        signers: params.signers,
        widgets: params.widgets || DEFAULT_SIGNATURE_WIDGETS,
        note: params.note,
        expiry_date: expiryDate,
        send_email: true,
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create document');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendFromTemplate = useCallback(async (params: {
    templateId: string;
    signers: OpenSignSigner[];
    title?: string;
    note?: string;
    prefillData?: Record<string, string>;
  }): Promise<OpenSignDocument | null> => {
    setLoading(true);
    setError(null);

    try {
      // Convert prefillData to widget format
      const widgets = params.prefillData
        ? Object.entries(params.prefillData).map(([name, value]) => ({
            name,
            default: value,
            readonly: false,
          }))
        : undefined;

      const result = await createDocumentFromTemplate({
        templateId: params.templateId,
        signers: params.signers,
        title: params.title,
        note: params.note,
        widgets,
      });

      if (!result.success || !result.data) {
        setError(result.error || 'Failed to create document from template');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkDocumentStatus = useCallback(async (
    documentId: string
  ): Promise<OpenSignDocument | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDocument(documentId);
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to get document');
        return null;
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocuments = useCallback(async (
    status?: 'in-progress' | 'completed' | 'declined'
  ): Promise<OpenSignDocument[]> => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDocumentList(status);
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to fetch documents');
        return [];
      }

      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelDocument = useCallback(async (documentId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await revokeDocument(documentId);
      
      if (!result.success) {
        setError(result.error || 'Failed to cancel document');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendRequest = useCallback(async (
    documentId: string,
    signerEmail?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await resendSignatureRequest(documentId, signerEmail);
      
      if (!result.success) {
        setError(result.error || 'Failed to resend signature request');
        return false;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isConfigured,
    loading,
    error,
    sendForSignature,
    sendFromTemplate,
    checkDocumentStatus,
    fetchDocuments,
    cancelDocument,
    resendRequest,
    clearError,
  };
}

export type { OpenSignSigner, OpenSignWidget, OpenSignDocument };
