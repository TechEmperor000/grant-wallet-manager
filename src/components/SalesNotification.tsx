import { useEffect, useState } from 'react';
import { DollarSign } from 'lucide-react';

const FIRST_NAMES = ['David', 'Sarah', 'Michael', 'Emma', 'James', 'Olivia', 'Robert', 'Sophia', 'William', 'Isabella', 'John', 'Mia', 'Richard', 'Charlotte', 'Thomas', 'Amelia', 'Daniel', 'Harper', 'Matthew', 'Evelyn', 'Andrew', 'Abigail', 'Joshua', 'Emily', 'Christopher', 'Madison', 'Joseph', 'Elizabeth', 'Charles', 'Avery'];
const LAST_NAMES = ['Heaton', 'Mitchell', 'Johnson', 'Williams', 'Brown', 'Davis', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Adams', 'Baker', 'Nelson', 'Hill', 'Campbell', 'Carter'];

function randomName() {
  return `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
}

function randomAmount() {
  return (Math.floor(Math.random() * 44) + 20) * 1000;
}

export default function SalesNotification() {
  const [notification, setNotification] = useState<{ name: string; amount: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => {
      const n = { name: randomName(), amount: randomAmount() };
      setNotification(n);
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };

    show();
    const interval = setInterval(show, Math.floor(Math.random() * 2000) + 7000);
    return () => clearInterval(interval);
  }, []);

  if (!notification) return null;

  return (
    <div
      className={`fixed bottom-20 left-4 z-50 transition-all duration-500 ${
        visible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-lg max-w-xs">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/10">
          <DollarSign className="h-5 w-5 text-success" />
        </div>
        <div className="text-sm">
          <span className="font-semibold text-foreground">{notification.name}</span>
          <span className="text-muted-foreground"> just withdrew </span>
          <span className="font-bold text-success">${notification.amount.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
