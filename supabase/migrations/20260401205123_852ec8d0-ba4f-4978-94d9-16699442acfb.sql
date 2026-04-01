
-- Add next_error_code to applications (per-user withdrawal error)
ALTER TABLE public.applications ADD COLUMN next_error_code text DEFAULT 'global_default';
ALTER TABLE public.applications ADD COLUMN custom_error_message text;

-- Create admin_settings table for global defaults
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read/write admin_settings
CREATE POLICY "Admins can read admin_settings" ON public.admin_settings FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin_settings" ON public.admin_settings FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update admin_settings" ON public.admin_settings FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Authenticated users can read admin_settings (needed for withdraw flow)
CREATE POLICY "Users can read admin_settings" ON public.admin_settings FOR SELECT TO authenticated USING (true);

-- Insert default global error
INSERT INTO public.admin_settings (key, value) VALUES ('default_withdrawal_error', 'account_issues');
