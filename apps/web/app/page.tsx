import React from 'react';
import Link from 'next/link';
import { BookOpen, Brain, Users, Shield } from 'lucide-react';
import EnvironmentBadge from '@/components/EnvironmentBadge';

// Force dynamic rendering to avoid build-time Firebase initialization
export const dynamic = 'force-dynamic';

export default function HomePage() {
  const buildInfo = {
    gitSha: process.env.GIT_SHA || 'dev-build',
    buildTime: process.env.BUILD_TIME || Date.now().toString(),
    environment: process.env.NEXT_PUBLIC_ENV || 'development',
    region: process.env.NEXT_PUBLIC_REGION || 'local'
  };

  const formatBuildTime = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-bg relative overflow-hidden">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-accent" />
                <h1 className="text-2xl font-bold text-tutor">TutorAI</h1>
              </div>
              <EnvironmentBadge 
                environment={buildInfo.environment}
                gitSha={buildInfo.gitSha}
              />
            </div>
            
            <nav className="flex items-center space-x-4">
              <Link href="/auth/signin" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/auth/signup" className="btn-primary">
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-fade-in">
              <h2 className="text-4xl md:text-6xl font-bold text-tutor mb-6">
                AI-Powered
                <span className="text-accent block">Socratic Learning</span>
              </h2>
              <p className="text-xl text-muted mb-8 max-w-3xl mx-auto">
                Revolutionary K-12 mathematics learning platform that uses pure AI-driven 
                Socratic method to provide personalized tutoring experiences for Primary 6 students.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/chapters" className="btn-primary text-lg px-8 py-3">
                  Start Learning
                </Link>
                <Link href="/demo" className="btn-secondary text-lg px-8 py-3">
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h3 className="text-3xl font-bold text-tutor mb-4">
                Why Choose TutorAI?
              </h3>
              <p className="text-lg text-muted">
                Built for Singapore's Primary 6 mathematics curriculum with cutting-edge AI technology
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Brain,
                  title: 'Pure Socratic Method',
                  description: 'No direct answers, only guided discovery through strategic questioning'
                },
                {
                  icon: BookOpen,
                  title: 'MOE Curriculum Aligned',
                  description: 'Complete integration with Singapore Primary 6 mathematics syllabus'
                },
                {
                  icon: Users,
                  title: 'Story-Driven Learning',
                  description: 'Mathematical concepts wrapped in engaging 4-5 problem narrative arcs'
                },
                {
                  icon: Shield,
                  title: 'PDPA Compliant',
                  description: 'Full adherence to Singapore data protection regulations'
                }
              ].map((feature, index) => (
                <div key={index} className="card text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <feature.icon className="h-12 w-12 text-accent mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-tutor mb-2">{feature.title}</h4>
                  <p className="text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Build Information */}
        <section className="py-12 bg-surfaceAlt">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="card">
              <h4 className="text-lg font-semibold text-tutor mb-4">Build Information</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-tutor">Environment:</span>
                  <span className="ml-2 text-muted">{buildInfo.environment}</span>
                </div>
                <div>
                  <span className="font-medium text-tutor">Region:</span>
                  <span className="ml-2 text-muted">{buildInfo.region}</span>
                </div>
                <div>
                  <span className="font-medium text-tutor">Build SHA:</span>
                  <span className="ml-2 text-muted font-mono">{buildInfo.gitSha}</span>
                </div>
                <div>
                  <span className="font-medium text-tutor">Build Time:</span>
                  <span className="ml-2 text-muted">{formatBuildTime(buildInfo.buildTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-6 w-6 text-accent" />
            <span className="text-xl font-bold text-tutor">TutorAI</span>
          </div>
          <p className="text-muted mb-4">
            Revolutionizing mathematics education with AI-powered Socratic learning
          </p>
          <div className="flex justify-center space-x-6 text-sm text-muted">
            <Link href="/privacy" className="hover:text-accent transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-accent transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-accent transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}