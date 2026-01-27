import * as functions from 'firebase-functions';
// import * as admin from 'firebase-admin'; // Use when ready to write back to DB

// Trigger runs when an onboarding workflow document is updated
export const onOnboardingStepChange = functions.firestore
    .document('onboardingWorkflows/{workflowId}')
    .onUpdate(async (change, context) => {
        const newData = change.after.data();
        const previousData = change.before.data();

        // Check if the step has advanced
        if (newData.currentStep !== previousData.currentStep) {
            const stepName = newData.steps[newData.currentStep - 1]?.name || 'Unknown Step';
            const customerEmail = newData.customerEmail;

            console.log(`📧 [MOCK EMAIL] To: ${customerEmail}`);
            console.log(`   Subject: Action Required: ${stepName}`);
            console.log(`   Body: Hello! You have moved to the next step of onboarding: ${stepName}. Please log in to complete this step.`);
            console.log(`   Workflow ID: ${context.params.workflowId}`);

            // In a real implementation, you would call SendGrid/Resend API here
            // await sendEmail({ to: customerEmail, subject: ..., body: ... });
        }

        // Check for failure
        if (newData.status === 'failed' && previousData.status !== 'failed') {
            console.log(`🚨 [ALERT] Workflow ${context.params.workflowId} FAILED.`);
            console.log(`   Reason: ${newData.failureReason}`);
            console.log(`   Admin notification sent.`);
        }

        return null;
    });
