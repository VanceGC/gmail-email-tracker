import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Check, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

export default function PricingPage({ session }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null);

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out VGCMail',
      icon: Mail,
      features: [
        '50 tracked emails per month',
        'Email open tracking',
        'Basic analytics',
        'Email support',
        'Chrome extension'
      ],
      cta: 'Get Started',
      popular: false,
      priceId: null
    },
    {
      name: 'Pro',
      price: '$9.99',
      period: 'per month',
      description: 'For professionals who need more',
      icon: Zap,
      features: [
        'Unlimited tracked emails',
        'Email open tracking',
        'Link click tracking',
        'Advanced analytics',
        'Priority support',
        'Chrome extension',
        'Full tracking history'
      ],
      cta: 'Start Pro Trial',
      popular: true,
      priceId: 'price_1SFHqPKdqvrj50kO9o4pTyKq'
    },
    {
      name: 'Business',
      price: '$29.99',
      period: 'per month',
      description: 'For teams and power users',
      icon: Crown,
      features: [
        'Everything in Pro',
        'Team features (coming soon)',
        'API access',
        'Custom integrations',
        'Dedicated support',
        'Advanced reporting',
        'White-label option'
      ],
      cta: 'Start Business Trial',
      popular: false,
      priceId: 'price_1SFHqbKdqvrj50kOoPhNdiYT'
    }
  ];

  const handleSelectPlan = async (plan) => {
    if (!session) {
      navigate('/signup');
      return;
    }
    
    if (plan.priceId) {
      try {
        setLoading(plan.name);
        const result = await api.createCheckoutSession(
          plan.priceId,
          session.user.id,
          session.user.email
        );
        
        if (result.url) {
          window.location.href = result.url;
        }
      } catch (error) {
        console.error('Error creating checkout session:', error);
        alert('Failed to start checkout. Please try again.');
        setLoading(null);
      }
    } else {
      navigate('/dashboard');
    }
  };

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
              <Link to="/">
                <Button variant="ghost">Home</Button>
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

      {/* Pricing Header */}
      <section className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Choose the plan that's right for you
            </p>
            <p className="text-sm text-gray-500">
              All plans include a 14-day free trial • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl p-8 ${
                  plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <plan.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
                  <div className="mb-2">
                    <span className="text-5xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-600 ml-2">/{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loading === plan.name}
                  className={`w-full ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : ''
                  }`}
                  variant={plan.popular ? 'default' : 'outline'}
                  size="lg"
                >
                  {loading === plan.name ? 'Loading...' : plan.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.'
              },
              {
                q: 'Is there a free trial?',
                a: 'Yes! All paid plans come with a 14-day free trial. No credit card required to start.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. You can cancel your subscription at any time from your account settings.'
              },
              {
                q: 'Do you offer refunds?',
                a: 'Yes, we offer a 30-day money-back guarantee if you\'re not satisfied with VGCMail.'
              },
              {
                q: 'Is my data secure?',
                a: 'Yes! We use industry-standard encryption and security practices to protect your data.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="border-b border-gray-200 pb-6"
              >
                <h3 className="text-lg font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </motion.div>
            ))}
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
              Still Have Questions?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Our team is here to help. Contact us anytime.
            </p>
            <a href="mailto:support@vgcmail.app">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Contact Support
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Mail className="h-6 w-6 text-blue-500" />
            <span className="text-xl font-bold text-white">VGCMail</span>
          </div>
          <p className="text-sm">&copy; 2025 VGCMail. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
