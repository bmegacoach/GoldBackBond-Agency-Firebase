import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { BarChart3, Users, Package, CreditCard, Zap, Ticket, TrendingUp, CheckCircle, ArrowRight, Star, Shield, Globe, Award } from 'lucide-react';
import { redirectToStripeLink } from '../lib/stripe-client';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: 'Lead Mastery',
      description: 'Track and nurture leads through an intelligent sales pipeline with predictive analytics.'
    },
    {
      icon: Users,
      title: 'Client Intelligence',
      description: 'Maintain 360° customer profiles with history, preferences, and automated interaction tracking.'
    },
    {
      icon: Package,
      title: 'Investment Suites',
      description: 'Create and manage bespoke investment packages tailored to your sophisticated clientele.'
    },
    {
      icon: CreditCard,
      title: 'Global Payments',
      description: 'Seamless, secure payment integration with Stripe for instant high-value transactions.'
    },
    {
      icon: Zap,
      title: 'Smart Workflows',
      description: 'Automate complex operational tasks and streamline your agency\'s business logic.'
    },
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Real-time reporting and deep insights to drive strategic business growth.'
    },
    {
      icon: Ticket,
      title: 'Elite Support',
      description: 'Integrated priority ticketing system for maintaining world-class client satisfaction.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and access controls to protect your most sensitive data.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Principal, luxury Estates',
      content: 'GoldBackBond transformed how I manage my high-net-worth relationships. The interface is stunning and the functionality is unmatched.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Senior Financial Advisor',
      content: 'The investment package builder is a game-changer. It allows us to present complex portfolios in a beautiful, digestible format.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Director of Operations',
      content: 'We scrutinized every CRM on the market. GoldBackBond was the only one that felt like a partner in our success, not just a tool.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-gold-500/30 selection:text-gold-900">

      {/* Navigation */}
      <nav className="fixed w-full bg-slate-900/90 backdrop-blur-md border-b border-white/10 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-heading font-bold text-xl">GB</span>
              </div>
              <span className="text-2xl font-heading font-bold text-white tracking-tight">GoldBackBond</span>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white hover:bg-white/10"
                onClick={() => navigate('/signin')}
              >
                Sign In
              </Button>
              <Button
                variant="gold"
                className="shadow-gold-500/20"
                onClick={() => navigate('/signup')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-900">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary-900/40 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gold-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-slate-900"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold-400 text-sm font-medium mb-8 animate-fade-in backdrop-blur-sm">
            <Award className="w-4 h-4" />
            <span className="tracking-wide uppercase text-xs">The #1 CRM for Elite Agencies</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-8 tracking-tight leading-tight">
            Elevate Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-400 to-gold-600">Agency Standard</span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The definitive platform for managing high-value relationships, sophisticated portfolios, and complex workflows. Built for those who demand excellence.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button
              size="lg"
              variant="gold"
              onClick={() => navigate('/signin')}
              className="text-lg px-8 py-6 shadow-xl shadow-gold-500/20 hover:scale-105 transition-transform"
            >
              Sign In
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                redirectToStripeLink();
              }}
              className="text-lg px-8 py-6 border-slate-700 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Get Broadcast Plan
            </Button>
          </div>

          {/* Broadcast Plan Card */}
          <div className="flex justify-center mt-12">
            <Card className="max-w-md w-full bg-gradient-to-br from-gold-100/60 to-gold-50/80 border-gold-200/60 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-2xl font-bold text-gold-700 mb-1">Broadcast Plan</h3>
                  <p className="text-gold-600 text-sm">Enterprise Grade CRM</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-extrabold text-gold-800">$100</span>
                  <span className="text-base text-slate-500 font-normal">/mo</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6 text-slate-700 text-left">
                <li>✔ Cloud Sync & Backup</li>
                <li>✔ Team Collaboration</li>
                <li>✔ Advanced Analytics</li>
                <li>✔ Priority Support</li>
              </ul>
              <Button
                size="lg"
                variant="gold"
                className="w-full text-lg font-bold"
                onClick={() => {
                  redirectToStripeLink();
                }}
              >
                Pay Now
              </Button>
            </Card>
          </div>

          {/* Mockup / Visual */}
          <div className="mt-20 relative mx-auto max-w-5xl">
            <div className="absolute -inset-1 bg-gradient-to-r from-gold-500 to-primary-600 rounded-2xl blur opacity-30"></div>
            <div className="relative rounded-xl bg-slate-900 border border-white/10 shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center">
              <img
                src="/crm demo.png"
                alt="GoldBackBond CRM Dashboard"
                className="max-w-full max-h-full object-contain"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-heading font-bold text-slate-900 mb-6">
              Precision Engineered for Performance
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Start with our baseline features to explore the power of GoldBackBond. Upgrade to our <strong>Broadcast Plan</strong> for cloud sync and team collaboration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100 group-hover:scale-110 group-hover:border-gold-200 transition-all duration-300">
                    <Icon className="w-7 h-7 text-primary-600 group-hover:text-gold-600 transition-colors" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-900/50 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/3">
              <h2 className="text-4xl font-heading font-bold mb-6 leading-tight">
                Trusted by the World's Leading Agencies
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Join an elite network of professionals who have standardized on GoldBackBond for their critical operations.
              </p>
              <div className="flex gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                {/* Logos would go here */}
                <Globe className="w-8 h-8" />
                <Shield className="w-8 h-8" />
                <Award className="w-8 h-8" />
              </div>
            </div>

            <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className={`p-8 bg-white/5 border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors ${index === 2 ? 'md:col-span-2' : ''}`}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center font-bold text-white text-sm">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{testimonial.name}</p>
                      <p className="text-gold-400 text-xs uppercase tracking-wider">{testimonial.role}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block mb-4 p-3 rounded-full bg-gold-50 text-gold-700">
            <Ticket className="w-6 h-6" />
          </div>
          <h2 className="text-4xl md:text-6xl font-heading font-bold text-slate-900 mb-8 tracking-tight">
            Ready to ascend?
          </h2>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Experience the power of GoldBackBond today. Upgrade to <strong>Broadcast Plan</strong> for full cloud features.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/signup')}
              className="text-lg px-10 py-5 shadow-2xl shadow-primary-900/20"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-slate-500 mt-4 sm:mt-0 sm:ml-6">
              <CheckCircle className="w-4 h-4 inline mr-1 text-green-500" /> Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">GB</span>
                </div>
                <span className="text-2xl font-heading font-bold text-white">GoldBackBond</span>
              </div>
              <p className="text-slate-400 max-w-xs leading-relaxed">
                Defining the future of agency management through superior design and intelligent technology.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Platform</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="hover:text-gold-400 cursor-pointer transition-colors">Features</li>
                <li className="hover:text-gold-400 cursor-pointer transition-colors">Pricing</li>
                <li className="hover:text-gold-400 cursor-pointer transition-colors">Enterprise</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-slate-400">
                <li className="hover:text-gold-400 cursor-pointer transition-colors">About Us</li>
                <li className="hover:text-gold-400 cursor-pointer transition-colors">Careers</li>
                <li className="hover:text-gold-400 cursor-pointer transition-colors">Legal</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              © 2024 GoldBackBond. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Globe className="w-5 h-5 text-slate-500 hover:text-white transition-colors cursor-pointer" />
              <div className="w-5 h-5 bg-slate-500 rounded-full hover:bg-white transition-colors cursor-pointer" />
              <div className="w-5 h-5 bg-slate-500 rounded-full hover:bg-white transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}