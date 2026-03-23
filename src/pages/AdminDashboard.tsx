import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Search, CheckCircle, XCircle, DollarSign, LogOut, Eye, LayoutDashboard } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Application = Database['public']['Tables']['applications']['Row'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  credited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [profileCountries, setProfileCountries] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [creditApp, setCreditApp] = useState<Application | null>(null);
  const [processing, setProcessing] = useState(false);
  const [approvalReason, setApprovalReason] = useState('');

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    else setApplications(data || []);

    // Fetch profile countries
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, country' as any);
    if (profiles) {
      const map: Record<string, string> = {};
      (profiles as any[]).forEach((p: any) => { if (p.country) map[p.user_id] = p.country; });
      setProfileCountries(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchApplications();

    // Realtime subscription for live updates
    const channel = supabase
      .channel('admin-applications')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'applications' },
        () => { fetchApplications(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = applications.filter(app => {
    const matchesSearch = app.full_name.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateStatus = async (app: Application, status: 'approved' | 'rejected') => {
    setProcessing(true);
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', app.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Application ${status}`);
      fetchApplications();
    }
    setProcessing(false);
  };

  const handleCreditGrant = async () => {
    if (!creditApp || !creditAmount) return;
    setProcessing(true);
    const amount = parseFloat(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      setProcessing(false);
      return;
    }

    // Update wallet balance
    const { data: wallet } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', creditApp.user_id)
      .single();

    if (!wallet) {
      toast.error('Wallet not found');
      setProcessing(false);
      return;
    }

    const newBalance = Number(wallet.balance) + amount;

    const { error: walletError } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('user_id', creditApp.user_id);

    if (walletError) {
      toast.error(walletError.message);
      setProcessing(false);
      return;
    }

    // Create transaction
    const { error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: creditApp.user_id,
        application_id: creditApp.id,
        amount,
        type: 'credit',
        description: `Grant credit for application ${creditApp.id.slice(0, 8)}`,
      });

    if (txError) {
      toast.error(txError.message);
      setProcessing(false);
      return;
    }

    // Update application status + approval reason
    await supabase
      .from('applications')
      .update({ status: 'credited' as const, approval_reason: approvalReason || null } as any)
      .eq('id', creditApp.id);

    toast.success(`$${amount.toLocaleString()} credited successfully`);
    setShowCreditDialog(false);
    setCreditAmount('');
    setApprovalReason('');
    setCreditApp(null);
    fetchApplications();
    setProcessing(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5" />
            Admin Panel
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <div className="rounded-md bg-sidebar-accent px-3 py-2 text-sm font-medium text-sidebar-accent-foreground">
            Applications
          </div>
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background">
        <header className="border-b px-8 py-4">
          <h2 className="text-xl font-semibold text-foreground">Grant Applications</h2>
          <p className="text-sm text-muted-foreground">Review and manage all submitted applications</p>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-1">
              {['all', 'pending', 'approved', 'rejected', 'credited'].map(s => (
                <Button
                  key={s}
                  variant={statusFilter === s ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Amount Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      {search || statusFilter !== 'all' ? 'No applications match your filters' : 'No applications yet – test by submitting as a regular user'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(app => (
                    <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedApp(app)}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{app.full_name}</p>
                          <p className="text-sm text-muted-foreground">{app.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{profileCountries[app.user_id] || 'Unknown'}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(app.amount_requested)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[app.status]}>
                          {app.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(app.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <Button size="sm" variant="ghost" onClick={() => setSelectedApp(app)}>
                            <Eye className="mr-1 h-3.5 w-3.5" /> View
                          </Button>
                          {app.status === 'pending' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => updateStatus(app, 'approved')} disabled={processing} className="text-primary">
                                <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateStatus(app, 'rejected')} disabled={processing} className="text-destructive">
                                <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {(app.status === 'approved' || app.status === 'pending') && (
                            <Button
                              size="sm"
                              onClick={() => { setCreditApp(app); setShowCreditDialog(true); }}
                              className="bg-success text-success-foreground hover:bg-success/90"
                            >
                              <DollarSign className="mr-1 h-3.5 w-3.5" /> Credit Grant
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="grid grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Applicant Info</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                    <p className="font-medium">{selectedApp.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedApp.email}</p>
                  </div>
                  {selectedApp.phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="font-medium">{selectedApp.phone}</p>
                    </div>
                  )}
                  {selectedApp.date_of_birth && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                      <p className="font-medium">{new Date(selectedApp.date_of_birth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedApp.occupation && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Occupation</Label>
                      <p className="font-medium">{selectedApp.occupation}</p>
                    </div>
                  )}
                  {(selectedApp.street_address || selectedApp.city || selectedApp.country) && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <p className="font-medium">{[selectedApp.street_address, selectedApp.city, selectedApp.state_province, selectedApp.country].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-xs text-muted-foreground">Amount Requested</Label>
                    <p className="text-lg font-semibold">{formatCurrency(selectedApp.amount_requested)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Purpose</Label>
                    <p>{selectedApp.purpose || 'Not specified'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge variant="outline" className={statusColors[selectedApp.status]}>{selectedApp.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Documents</h3>
                <div className="space-y-2">
                  {selectedApp.id_card_front_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">ID Card — Front</Label>
                      <a href={selectedApp.id_card_front_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm">
                        Download Front
                      </a>
                    </div>
                  )}
                  {selectedApp.id_card_back_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">ID Card — Back</Label>
                      <a href={selectedApp.id_card_back_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm">
                        Download Back
                      </a>
                    </div>
                  )}
                  {selectedApp.signed_document_url && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Signed Document</Label>
                      <a href={selectedApp.signed_document_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm">
                        Download Document
                      </a>
                    </div>
                  )}
                  {!selectedApp.id_card_front_url && !selectedApp.id_card_back_url && !selectedApp.signed_document_url && (
                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                  )}
                </div>

                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider pt-2">Questionnaire Answers</h3>
                {selectedApp.answers && typeof selectedApp.answers === 'object' && Object.keys(selectedApp.answers as object).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedApp.answers as Record<string, string>).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                        <p className="text-sm">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No answers provided</p>
                )}

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground">Submitted</Label>
                  <p className="text-sm">{formatDate(selectedApp.created_at)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Credit Grant Dialog */}
      <Dialog open={showCreditDialog} onOpenChange={setShowCreditDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Credit Grant</DialogTitle>
          </DialogHeader>
          {creditApp && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Credit grant to <strong>{creditApp.full_name}</strong> ({creditApp.email})
              </p>
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason for Approval/Adjustment <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  value={approvalReason}
                  onChange={e => setApprovalReason(e.target.value)}
                  placeholder="e.g., Increased due to higher impact potential"
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCreditGrant}
                disabled={processing || !creditAmount}
                className="w-full bg-success text-success-foreground hover:bg-success/90"
              >
                {processing ? 'Processing...' : `Credit $${creditAmount || '0.00'}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
