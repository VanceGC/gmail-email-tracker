import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, Eye, MousePointerClick, BarChart3, Shield, Zap, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LandingPage({ session }) {
  const navigate = useNavigate();

  const features = [
    {
      icon: Eye,
      title: 'Email Open Tracking',
      description: 'Know exactly when recipients open your emails with real-time notifications.'
    },
    {
      icon: MousePointerClick,
      title: 'Link Click Tracking',
      description: 'Track which links get clicked and measure engagement with your content.'
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'View comprehensive statistics and insights about your email performance.'
    },
    {
      icon: Shield,
      title: 'Privacy Focused',
      description: 'Your data stays secure. We respect privacy and comply with regulations.'
    },
    {
      icon: Zap,
      title: 'Instant Setup',
      description: 'Install our Chrome extension and start tracking emails in under 2 minutes.'
    },
    {
      icon: Mail,
      title: 'Gmail Integration',
      description: 'Seamlessly integrates with Gmail. No disruption to your workflow.'
    }
  ];

  const benefits = [
    'Track unlimited emails with Pro plan',
    'Real-time open notifications',
    'Link click analytics',
    'Beautiful dashboard',
    'Chrome extension included',
    'Email support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VGCMail
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link to="/pricing">
                <Button variant="ghost">Pricing</Button>
              </Link>
              {session ? (
                <Link to="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/signup">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Know When Your Emails Are Opened
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Track email opens and link clicks in Gmail. Get real-time notifications and detailed analytics.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/signup">
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/pricing">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              50 free tracked emails per month • No credit card required
            </p>
          </motion.div>

          {/* Hero Image/Demo */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Mail className="h-24 w-24 text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Dashboard Preview</p>
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              ✓ Email Opened
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg"
            >
              🔗 Link Clicked
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to Track Emails
            </h2>
            <p className="text-xl text-gray-600">
              Powerful features to help you understand email engagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <feature.icon className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Start tracking emails in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your free account in seconds. No credit card required.'
              },
              {
                step: '2',
                title: 'Install Extension',
                description: 'Add our Chrome extension to Gmail with one click.'
              },
              {
                step: '3',
                title: 'Start Tracking',
                description: 'Send emails as usual. We\'ll track opens and clicks automatically.'
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 mt-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Why Choose VGCMail?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join thousands of professionals who trust VGCMail for email tracking.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center space-x-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-12 flex items-center justify-center">
              <BarChart3 className="h-64 w-64 text-blue-600 opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Track Your Emails?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Start your free trial today. No credit card required.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Get Started Free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mail className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">VGCMail</span>
              </div>
              <p className="text-sm">
                Email tracking made simple for Gmail users.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                <li><a href="mailto:support@vgcmail.app" className="hover:text-white">Email Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 VGCMail. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
