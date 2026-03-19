import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, ArrowRight, FileText, Search, CheckCircle, CreditCard, Star } from 'lucide-react';
import heroImage from '@/assets/hero-grants.jpg';
import testimonial1 from '@/assets/testimonial-1.jpg';
import testimonial2 from '@/assets/testimonial-2.jpg';
import testimonial3 from '@/assets/testimonial-3.jpg';

const steps = [
  { icon: FileText, title: 'Create Your Account', desc: 'Sign up in minutes with just your email and basic information.' },
  { icon: Search, title: 'Submit Application', desc: 'Fill out the grant application form with your details and funding purpose.' },
  { icon: CheckCircle, title: 'Review & Approval', desc: 'Our team reviews your application and verifies your eligibility.' },
  { icon: CreditCard, title: 'Receive Your Grant', desc: 'Approved funds are credited directly to your Grant Wallet instantly.' },
];

const testimonials = [
  { name: 'Amara Johnson', role: 'Small Business Owner, Atlanta', quote: 'This grant changed everything for my bakery. I was able to purchase new equipment and hire two employees. The process was seamless and the team was incredibly supportive.', image: testimonial1, amount: '$7,500' },
  { name: 'Carlos Rivera', role: 'Community Leader, Houston', quote: 'I applied for a community development grant and received funding within weeks. The portal made it easy to track my application status in real-time.', image: testimonial2, amount: '$10,000' },
  { name: 'Priya Sharma', role: 'Graduate Student, Chicago', quote: 'As a first-generation student, this grant helped me focus on my research without financial stress. I am deeply grateful for this opportunity.', image: testimonial3, amount: '$5,000' },
];

const faqs = [
  { q: 'Who is eligible to apply for grants?', a: 'We accept applications from individuals, small businesses, students, and community organizations across the United States. Eligibility criteria vary by grant type. Check specific requirements on the application form.' },
  { q: 'How much funding can I receive?', a: 'Grant amounts range from $500 to $10,000 depending on the type of grant, your needs, and the purpose of funding. Our review team determines the final approved amount.' },
  { q: 'How long does the approval process take?', a: 'Most applications are reviewed within 5–10 business days. You will receive email notifications at each stage, and you can track your status in real-time through your dashboard.' },
  { q: 'Do I need to repay the grant?', a: 'No. Grants are non-repayable financial awards. Unlike loans, you are not required to pay back any amount received through our programs.' },
  { q: 'What documents do I need to submit?', a: 'Basic applications require only your personal information and a description of your funding purpose. Some grants may request additional documentation such as proof of enrollment, business registration, or a project proposal.' },
  { q: 'How will I receive the funds?', a: 'Approved funds are credited to your Grant Wallet on our platform. You can view your balance and transaction history in real-time on your dashboard.' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => navigate(user ? '/dashboard' : '/auth');

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">Federal Grant Portal</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
                <Button onClick={() => navigate('/auth')} className="bg-gold text-gold-foreground hover:bg-gold-dark">
                  Apply Now
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Diverse community of grant recipients celebrating" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(220,40%,13%,0.94)] via-[hsl(220,40%,13%,0.82)] to-[hsl(220,40%,13%,0.6)]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-28 lg:py-40">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 mb-6">
              <Star className="h-3.5 w-3.5 text-gold" />
              <span className="text-sm font-medium text-gold">Trusted by 10,000+ Recipients Nationwide</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[hsl(0,0%,100%)] font-serif">
              Empowering Dreams Worldwide – Apply for Grants Today
            </h1>
            <p className="mt-6 text-lg md:text-xl text-[hsl(210,40%,80%)] leading-relaxed max-w-xl">
              Access up to <strong className="text-gold">$10,000</strong> in non-repayable grant funding. We support individuals, students, small businesses, and community organizations across the nation.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" onClick={handleCTA} className="bg-gold text-gold-foreground hover:bg-gold-dark text-base px-8 h-12">
                Sign Up & Apply Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="border-[hsl(210,40%,80%,0.3)] text-[hsl(0,0%,100%)] hover:bg-[hsl(0,0%,100%,0.1)] h-12">
                Learn How It Works
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-8 text-[hsl(210,40%,80%)]">
              <div><p className="text-2xl font-bold text-[hsl(0,0%,100%)]">$2.4M+</p><p className="text-sm">Grants Awarded</p></div>
              <div className="h-10 w-px bg-[hsl(210,40%,80%,0.2)]" />
              <div><p className="text-2xl font-bold text-[hsl(0,0%,100%)]">10,000+</p><p className="text-sm">Recipients</p></div>
              <div className="h-10 w-px bg-[hsl(210,40%,80%,0.2)]" />
              <div><p className="text-2xl font-bold text-[hsl(0,0%,100%)]">50 States</p><p className="text-sm">Coverage</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">Our Mission</h2>
          <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
          <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed">
            We believe financial barriers should never stand in the way of progress. Our mission is to connect deserving individuals and communities with the funding they need to build businesses, pursue education, and strengthen their neighborhoods. Through transparent processes and rapid disbursement, we make grant funding accessible to everyone.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: '98%', label: 'Satisfaction Rate', desc: 'Recipients rate their experience as excellent' },
              { value: '5 Days', label: 'Avg. Review Time', desc: 'Fast, transparent application reviews' },
              { value: '$0', label: 'Application Fee', desc: 'Completely free to apply — always' },
            ].map(stat => (
              <div key={stat.label} className="rounded-lg border bg-background p-8">
                <p className="text-3xl font-bold text-gold">{stat.value}</p>
                <p className="mt-2 font-semibold text-foreground">{stat.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">Success Stories</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
            <p className="mt-4 text-muted-foreground">Hear from real people whose lives were transformed by our grants</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map(t => (
              <div key={t.name} className="rounded-lg border bg-card p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <img src={t.image} alt={t.name} className="h-14 w-14 rounded-full object-cover border-2 border-gold/30" />
                  <div>
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">Grant received: </span>
                  <span className="font-semibold text-success">{t.amount}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">How It Works</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
            <p className="mt-4 text-muted-foreground">Four simple steps to receive your grant funding</p>
          </div>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={step.title} className="relative rounded-lg border bg-background p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -top-3 left-6 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-gold-foreground">
                  Step {i + 1}
                </div>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button size="lg" onClick={handleCTA} className="bg-gold text-gold-foreground hover:bg-gold-dark px-8 h-12">
              Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-background">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground font-serif">Frequently Asked Questions</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gold" />
          </div>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-foreground font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[hsl(222,47%,11%)] to-[hsl(217,91%,25%)]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[hsl(0,0%,100%)]">Ready to Apply?</h2>
          <p className="mt-4 text-lg text-[hsl(210,40%,80%)]">
            Join thousands who have already received funding. Applications are free and take less than 10 minutes.
          </p>
          <Button size="lg" onClick={handleCTA} className="mt-8 bg-gold text-gold-foreground hover:bg-gold-dark px-10 h-14 text-lg">
            Sign Up & Apply Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">Federal Grant Portal</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Contact: <a href="mailto:eligibleoffer@federalgovgrant.online" className="text-primary hover:underline">eligibleoffer@federalgovgrant.online</a>
          </p>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
