import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Button } from './ui/Button';
import { Check, AlertCircle } from 'lucide-react';

export function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const success = searchParams.get('success') === 'true';
  const [loading, setLoading] = useState(true);
  const [accountCreated, setAccountCreated] = useState(false);

  useEffect(() => {
    const createAccountIfNeeded = async () => {
      if (success) {
        // Check if there's pending user data from sign-up
        const pendingUserData = localStorage.getItem('pendingUser');

        if (pendingUserData) {
          try {
            const { email, password } = JSON.parse(pendingUserData);

            // Create the Firebase account
            await createUserWithEmailAndPassword(auth, email, password);

            // Clear the pending data
            localStorage.removeItem('pendingUser');
            setAccountCreated(true);

            // Auto-redirect to dashboard after account creation
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);

          } catch (error) {
            console.error('Error creating account:', error);
            // Continue with success flow even if account creation fails
            // (user can still sign in manually)
          }
        }
      }

      // Simulate checking payment status
      const timer = setTimeout(() => setLoading(false), 2000);
      return () => clearTimeout(timer);
    };

    createAccountIfNeeded();
  }, [success, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-300">Processing your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
        {success ? (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for choosing GoldBackBond. Your account has been created and you now have access to all premium features.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-700">
                <strong>Account Created:</strong> {accountCreated ? '✓ Your account has been successfully created.' : 'Account creation in progress...'}
                <br />
                <strong>What's next?</strong> You can now access all advanced features including unlimited leads, workflows, content management, and more.
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="w-full"
              disabled={!accountCreated}
            >
              {accountCreated ? 'Go to Dashboard' : 'Setting up your account...'}
            </Button>
            {accountCreated && (
              <p className="text-center text-sm text-gray-500 mt-2">
                You will be automatically redirected in a few seconds...
              </p>
            )}
          </>
        ) : (
          <>
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
            <p className="text-gray-600 mb-6">
              Your payment was not completed. No charges have been made to your account.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => (window.location.href = '/')}
                className="flex-1"
              >
                Back Home
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={() => (window.location.href = '/?view=pricing')}
                className="flex-1"
              >
                Try Again
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
