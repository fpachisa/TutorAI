import React from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import SignInForm from '@/components/SignInForm';
import EnvironmentBadge from '@/components/EnvironmentBadge';

// Force dynamic rendering to avoid build-time Firebase initialization
export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Brain className="h-8 w-8 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">TutorAI</h1>
        </div>
        <div className="flex justify-center">
          <EnvironmentBadge />
        </div>
      </div>

      {/* Sign In Form */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <SignInForm />
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <Link 
          href="/" 
          className="text-primary-600 hover:text-primary-500 text-sm font-medium"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}