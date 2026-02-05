/**
 * OpenSign Integration Module
 * 
 * Provides e-signature functionality for the CRM using OpenSign API.
 * 
 * Setup:
 * 1. Get your API key from https://app.opensignlabs.com (Settings > API)
 * 2. Add to .env.local:
 *    VITE_OPENSIGN_API_KEY=your_api_key_here
 *    VITE_OPENSIGN_API_URL=https://app.opensignlabs.com/api/v1  (optional, defaults to public cloud)
 * 
 * Usage:
 * ```tsx
 * import { useOpenSign } from '@/lib/opensign';
 * 
 * function MyComponent() {
 *   const { sendForSignature, loading, error } = useOpenSign();
 *   
 *   const handleSend = async () => {
 *     const doc = await sendForSignature({
 *       title: 'Investment Agreement',
 *       file: selectedFile,
 *       signers: [{ name: 'John Doe', email: 'john@example.com' }],
 *     });
 *     if (doc) console.log('Document sent:', doc.objectId);
 *   };
 * }
 * ```
 */

export { useOpenSign } from './useOpenSign';
export type { UseOpenSignReturn } from './useOpenSign';

export {
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
} from './opensign-service';

export type {
  OpenSignSigner,
  OpenSignWidget,
  OpenSignDocument,
  OpenSignResponse,
  CreateDocumentRequest,
  CreateDocumentFromTemplateRequest,
} from './opensign-service';
