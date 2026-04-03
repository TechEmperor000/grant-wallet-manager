import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SalesNotification from '@/components/SalesNotification';

const SUPPORT_EMAIL = 'eligibleoffer@federalgovgrant.online';

export default function ApplicationSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SalesNotification />
      <div className="max-w-xl w-full text-center space-y-8">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <CheckCircle className="h-12 w-12 text-success" />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Application Submitted Successfully!
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            You have successfully filled for a grant. All you have to do is make sure to visit this website occasionally and refresh because the moment your grant is being approved it will be deposited into your available balance. Also send us a message on email so we can keep you updated once your grant is being appointed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            size="lg"
            onClick={() => window.location.href = `mailto:${SUPPORT_EMAIL}`}
            className="w-full sm:w-auto bg-gold text-gold-foreground hover:bg-gold-dark px-8"
          >
            <Mail className="mr-2 h-5 w-5" /> Email Us
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-8"
          >
            <Home className="mr-2 h-5 w-5" /> Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
