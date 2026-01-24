import Link from 'next/link'
import { SigninForm } from '@/components/auth/SigninForm'
import { Card } from '@/components/ui/Card'

export default function SigninPage() {
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
            Welcome Back
          </h1>
          <p className="text-base text-gray-600">
            Sign in to access your tasks
          </p>
        </div>

        <Card>
          <SigninForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
