import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { FeatureCard } from '@/components/homepage/FeatureCard'

export default async function HomePage() {
  // Auth check - redirect authenticated users to dashboard
  const session = await getSession()

  if (session?.session?.token) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Section spacing="lg" background="white">
        <Container>
          <div className="text-center flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-3xl mx-auto">
              Organize Your Life, One Task at a Time
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mt-4 max-w-2xl">
              The simple, powerful todo app that helps you stay focused and get things done.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link
                href="/signup"
                className="px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/signin"
                className="px-8 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section spacing="lg" background="gray">
        <Container>
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Everything you need to stay organized
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="✓"
              title="Simple Task Management"
              description="Add, complete, and organize your todos with ease. No complicated setup required."
            />
            <FeatureCard
              icon="📱"
              title="Access Anywhere"
              description="Your tasks sync across all devices. Start on your phone, continue on desktop."
            />
            <FeatureCard
              icon="🔒"
              title="Secure & Private"
              description="Your data is encrypted and private. Only you can see your tasks."
            />
          </div>
        </Container>
      </Section>

      {/* Bottom CTA Section */}
      <Section spacing="lg" background="white">
        <Container>
          <div className="text-center flex flex-col items-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Ready to get organized?
            </h2>
            <p className="text-lg text-gray-600 mt-2">
              Join thousands of users who stay productive every day.
            </p>
            <Link
              href="/signup"
              className="mt-6 px-8 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </Container>
      </Section>
    </div>
  )
}

