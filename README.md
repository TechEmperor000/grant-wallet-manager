# Federal Grant Management Portal

A full-stack grant management system with admin panel, user dashboard, and real-time balance updates.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud — Auth, Database, Realtime
- **Chat Widget**: tawk.to

## Setup Guide

### 1. Database

The database is automatically provisioned via Lovable Cloud. Tables:
- `profiles` — User profile data
- `applications` — Grant applications
- `wallets` — User wallet balances
- `transactions` — Credit transaction history
- `user_roles` — Role-based access control

### 2. Make a User an Admin

Insert a role into the `user_roles` table via the Cloud tab:

```sql
INSERT INTO public.user_roles (user_id, role) VALUES ('<user-uuid>', 'admin');
```

### 3. tawk.to Live Chat

1. Create an account at [https://www.tawk.to](https://www.tawk.to)
2. Get your Property ID from Dashboard → Settings → Chat Widget
3. Replace `TAWK_PROPERTY_ID` in `src/components/TawkToWidget.tsx` with your actual ID

### 4. Telegram Notifications (Optional)

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token and chat ID
3. Create an edge function to send notifications

### 5. Key Configuration

| Variable | Description |
|----------|-------------|
| `TAWK_PROPERTY_ID` | tawk.to widget ID (in TawkToWidget.tsx) |
| `SUPPORT_EMAIL` | eligibleoffer@federalgovgrant.online |

### 6. Security

All tables have RLS enabled. Users only see their own data. Admins bypass via `has_role()` security definer function.

## Features

- ✅ Email/password authentication
- ✅ Role-based admin access (via user_roles table)
- ✅ Searchable/filterable application table
- ✅ Application detail modals
- ✅ Approve / Reject / Credit Grant actions
- ✅ Real-time wallet balance updates via Supabase Realtime
- ✅ Grant application form
- ✅ Transaction history
- ✅ tawk.to chat widget placeholder
- ✅ Responsive design with skeleton loading states
