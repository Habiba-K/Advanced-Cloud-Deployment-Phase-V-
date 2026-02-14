import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Container } from '@/components/ui/Container'
import { Section } from '@/components/ui/Section'
import { FeatureCard } from '@/components/homepage/FeatureCard'
import { HeroSection } from '@/components/homepage/HeroSection'
import { CTASection } from '@/components/homepage/CTASection'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import AnimatedSection from '@/components/ui/AnimatedSection'
import { LiveCounter } from '@/components/ui/LiveCounter'
import { ScreenshotGallery } from '@/components/homepage/ScreenshotGallery'

export default async function HomePage() {
  // Auth check - redirect authenticated users to dashboard
  const session = await getSession()

  if (session?.session?.token) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
      <Navbar />

      <main className="grow">
        {/* Hero Section with Gradient Mesh - T069: Add entrance animation */}
        <AnimatedSection>
          <HeroSection
            title="The Smart Todo App with AI, Tags, Priorities & More"
            subtitle="Advanced task management with priorities, smart tags, recurring tasks, AI assistance, and real-time sync. Everything you need to stay organized and productive."
            primaryCTA={{ text: "Get Started Free", href: "/signup" }}
            secondaryCTA={{ text: "Sign In", href: "/signin" }}
          />
        </AnimatedSection>

        {/* Stats Section */}
        <Section spacing="md" background="white">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <AnimatedSection delay={100}>
                <div className="text-center">
                  <LiveCounter
                    initialValue={10000}
                    minIncrement={1}
                    maxIncrement={5}
                    updateInterval={3500}
                    suffix="+"
                    className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  />
                  <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
                    Active Users
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={150}>
                <div className="text-center">
                  <LiveCounter
                    initialValue={500000}
                    minIncrement={10}
                    maxIncrement={50}
                    updateInterval={3000}
                    suffix="+"
                    className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  />
                  <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
                    Tasks Completed
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={200}>
                <div className="text-center">
                  <LiveCounter
                    initialValue={4.9}
                    minIncrement={0.001}
                    maxIncrement={0.005}
                    updateInterval={5000}
                    suffix="/5"
                    decimals={1}
                    className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  />
                  <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
                    User Rating
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={250}>
                <div className="text-center">
                  <LiveCounter
                    initialValue={99.9}
                    minIncrement={0.001}
                    maxIncrement={0.01}
                    updateInterval={4000}
                    suffix="%"
                    decimals={1}
                    className="text-3xl lg:text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
                  />
                  <div className="text-sm lg:text-base text-gray-600 dark:text-gray-400 font-medium">
                    Uptime
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </Container>
        </Section>

        {/* Features Section */}
        <Section id="features" spacing="lg" background="gray">
          <Container>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">
              Powerful Features to Boost Your Productivity
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Everything you need to organize, prioritize, and accomplish your tasks efficiently
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Priority Levels */}
              <AnimatedSection delay={100}>
                <FeatureCard
                  icon="🎯"
                  title="Priority Levels"
                  description="Organize by urgency with 4 priority levels: Low, Medium, High, and Urgent. Focus on what matters most."
                />
              </AnimatedSection>

              {/* Smart Tags */}
              <AnimatedSection delay={150}>
                <FeatureCard
                  icon="🏷️"
                  title="Smart Tags"
                  description="Categorize tasks with custom tags and colors for better organization and quick filtering."
                />
              </AnimatedSection>

              {/* Search, Filter & Sort - Combined */}
              <AnimatedSection delay={200}>
                <FeatureCard
                  icon="🔍"
                  title="Search, Filter & Sort"
                  description="Find any task instantly with full-text search. Filter by status, priority, tags, and due dates. Sort by multiple criteria."
                />
              </AnimatedSection>

              {/* AI Chat Assistant */}
              <AnimatedSection delay={250}>
                <FeatureCard
                  icon="🤖"
                  title="AI Chat Assistant"
                  description="Get help managing tasks with our intelligent AI assistant. Ask questions, create tasks, and more."
                />
              </AnimatedSection>

              {/* Due Dates & Reminders */}
              <AnimatedSection delay={300}>
                <FeatureCard
                  icon="📅"
                  title="Due Dates & Reminders"
                  description="Never miss a deadline with smart reminders and notifications for upcoming tasks."
                />
              </AnimatedSection>

              {/* Recurring Tasks */}
              <AnimatedSection delay={350}>
                <FeatureCard
                  icon="🔄"
                  title="Recurring Tasks"
                  description="Automate repetitive tasks with daily, weekly, monthly, or custom recurrence patterns."
                />
              </AnimatedSection>
            </div>
          </Container>
        </Section>

        {/* How It Works Section */}
        <Section spacing="lg" background="white">
          <Container>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">
              How It Works
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {/* Step 1 */}
              <AnimatedSection delay={100}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl font-bold">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Sign Up Free
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Create your account in seconds. No credit card required. Start organizing immediately.
                  </p>
                </div>
              </AnimatedSection>

              {/* Step 2 */}
              <AnimatedSection delay={200}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl font-bold">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Add Your Tasks
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Organize with priorities, tags, and due dates. Set up recurring tasks and reminders.
                  </p>
                </div>
              </AnimatedSection>

              {/* Step 3 */}
              <AnimatedSection delay={300}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-linear-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <span className="text-white text-2xl font-bold">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    Stay Productive
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Track progress and let AI help you stay on top of everything. Sync across all devices.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </Container>
        </Section>

        {/* Screenshots/Demo Section */}
        <Section spacing="lg" background="gray">
          <Container>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white text-center mb-4">
              See TaskFlow in Action
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
              Watch how TaskFlow helps you stay organized and productive
            </p>

            {/* Demo Video */}
            <AnimatedSection delay={100}>
              <div className="max-w-4xl mx-auto mb-12">
                <div className="relative rounded-xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700">
                  <div className="aspect-video bg-linear-to-br from-blue-100 to-purple-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    {/* Replace this div with actual video embed */}
                    <div className="text-center">
                      <div className="w-20 h-20 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Demo Video</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Add your video embed here</p>
                    </div>
                    {/* Example: <iframe src="https://www.youtube.com/embed/YOUR_VIDEO_ID" ... /> */}
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Screenshot Grid */}
            <ScreenshotGallery />
          </Container>
        </Section>

        {/* Bottom CTA Section with Gradient - T071: Add entrance animation */}
        <AnimatedSection>
          <CTASection
            title="Ready to Boost Your Productivity?"
            subtitle="Join thousands of users who stay organized with smart task management, AI assistance, and powerful features."
            ctaText="Get Started Free"
            ctaHref="/signup"
          />
        </AnimatedSection>
      </main>
    </div>
  )
}

