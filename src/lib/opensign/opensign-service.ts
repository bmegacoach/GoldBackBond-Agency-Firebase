/**
 * OpenSign API Service
 * 
 * Handles all interactions with OpenSign for e-signature functionality.
 * Documentation: https://docs.opensignlabs.com/docs/API-docs/v1.1
 */

// OpenSign API configuration
const OPENSIGN_API_URL = import.meta.env.VITE_OPENSIGN_API_URL || 'https://app.opensignlabs.com/api/v1';
const OPENSIGN_API_KEY = import.meta.env.VITE_OPENSIGN_API_KEY || '';

// Types
export interface OpenSignSigner {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export interface OpenSignWidget {
  type: 'signature' | 'initials' | 'date' | 'textbox' | 'checkbox' | 'email' | 'name' | 'company';
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
  options?: {
    required?: boolean;
    name?: string;
    default?: string;
    readonly?: boolean;
    color?: 'black' | 'blue' | 'red';
    fontsize?: number;
  };
}

export interface CreateDocumentRequest {
  title: string;
  note?: string;
  file: string; // Base64 encoded PDF
  signers: OpenSignSigner[];
  widgets?: OpenSignWidget[];
  send_email?: boolean;
  expiry_date?: string;
  redirect_url?: string;
  fileext?: string;
  notification?: {
    email?: boolean;
  };
}

export interface CreateDocumentFromTemplateRequest {
  templateId: string;
  signers: OpenSignSigner[];
  title?: string;
  note?: string;
  widgets?: { name: string; default?: string; readonly?: boolean }[];
}

export interface OpenSignDocument {
  objectId: string;
  Name: string;
  URL: string;
  SignedUrl?: string;
  Status: 'draft' | 'in-progress' | 'completed' | 'declined' | 'expired';
  Signers: Array<{
    name: string;
    email: string;
    status: 'pending' | 'signed' | 'declined';
    signedAt?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OpenSignResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Check if OpenSign is configured
 */
export function isOpenSignConfigured(): boolean {
  return !!OPENSIGN_API_KEY && OPENSIGN_API_KEY.length > 0;
}

/**
 * Make authenticated request to OpenSign API
 */
async function openSignFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<OpenSignResponse<T>> {
  if (!isOpenSignConfigured()) {
    return {
      success: false,
      error: 'OpenSign API key not configured. Please add VITE_OPENSIGN_API_KEY to your environment.',
    };
  }

  try {
    const response = await fetch(`${OPENSIGN_API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': OPENSIGN_API_KEY,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || `HTTP ${response.status}: Request failed`,
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('OpenSign API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a new document for signing
 */
export async function createDocument(
  request: CreateDocumentRequest
): Promise<OpenSignResponse<OpenSignDocument>> {
  return openSignFetch<OpenSignDocument>('/createdocument', {
    method: 'POST',
    body: JSON.stringify({
      title: request.title,
      note: request.note || `Please sign the ${request.title}`,
      file: request.file,
      fileext: request.fileext || 'pdf',
      signers: request.signers.map((signer, index) => ({
        name: signer.name,
        email: signer.email,
        phone: signer.phone || '',
        role: signer.role || `Signer ${index + 1}`,
      })),
      widgets: request.widgets || [],
      send_email: request.send_email !== false,
      expiry_date: request.expiry_date,
      redirect_url: request.redirect_url,
    }),
  });
}

/**
 * Create document from existing template
 */
export async function createDocumentFromTemplate(
  request: CreateDocumentFromTemplateRequest
): Promise<OpenSignResponse<OpenSignDocument>> {
  return openSignFetch<OpenSignDocument>(`/createdocument/${request.templateId}`, {
    method: 'POST',
    body: JSON.stringify({
      signers: request.signers.map((signer, index) => ({
        name: signer.name,
        email: signer.email,
        phone: signer.phone || '',
        role: signer.role || `Signer ${index + 1}`,
      })),
      title: request.title,
      note: request.note,
      widgets: request.widgets || [],
    }),
  });
}

/**
 * Get document status and details
 */
export async function getDocument(
  documentId: string
): Promise<OpenSignResponse<OpenSignDocument>> {
  return openSignFetch<OpenSignDocument>(`/document/${documentId}`, {
    method: 'GET',
  });
}

/**
 * Get list of documents with optional status filter
 */
export async function getDocumentList(
  status?: 'in-progress' | 'completed' | 'declined' | 'expired'
): Promise<OpenSignResponse<OpenSignDocument[]>> {
  const endpoint = status ? `/documentlist?status=${status}` : '/documentlist';
  return openSignFetch<OpenSignDocument[]>(endpoint, {
    method: 'GET',
  });
}

/**
 * Revoke/Cancel a document that is pending signatures
 */
export async function revokeDocument(
  documentId: string
): Promise<OpenSignResponse<{ message: string }>> {
  return openSignFetch<{ message: string }>(`/revokedocument/${documentId}`, {
    method: 'DELETE',
  });
}

/**
 * Resend signature request email
 */
export async function resendSignatureRequest(
  documentId: string,
  signerEmail?: string
): Promise<OpenSignResponse<{ message: string }>> {
  return openSignFetch<{ message: string }>('/resendrequestmail', {
    method: 'POST',
    body: JSON.stringify({
      document_id: documentId,
      signer_email: signerEmail,
    }),
  });
}

/**
 * Get current user info
 */
export async function getCurrentUser(): Promise<OpenSignResponse<{
  objectId: string;
  email: string;
  name: string;
}>> {
  return openSignFetch('/getuser', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

/**
 * Default widget positions for standard contract
 * These are positioned for a typical letter-size PDF
 */
export const DEFAULT_SIGNATURE_WIDGETS: OpenSignWidget[] = [
  {
    type: 'signature',
    page: 1,
    x: 100,
    y: 650,
    w: 200,
    h: 50,
    options: {
      required: true,
      name: 'customer_signature',
    },
  },
  {
    type: 'date',
    page: 1,
    x: 350,
    y: 665,
    w: 100,
    h: 25,
    options: {
      required: true,
      name: 'signing_date',
    },
  },
  {
    type: 'name',
    page: 1,
    x: 100,
    y: 710,
    w: 200,
    h: 25,
    options: {
      required: true,
      name: 'customer_name',
    },
  },
];

export default {
  isOpenSignConfigured,
  createDocument,
  createDocumentFromTemplate,
  getDocument,
  getDocumentList,
  revokeDocument,
  resendSignatureRequest,
  getCurrentUser,
  fileToBase64,
  DEFAULT_SIGNATURE_WIDGETS,
};
