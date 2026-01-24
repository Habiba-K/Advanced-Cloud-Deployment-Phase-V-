import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { Card } from '@/components/ui/Card'

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="text-sm text-gray-600 hover:text-gray-900 mb-6 inline-flex items-center transition-colors"
        >
          ← Back to Home
        </Link>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>
          <p className="text-base text-gray-600">
            Sign up to start managing your tasks
          </p>
        </div>

        <Card>
          <SignupForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
