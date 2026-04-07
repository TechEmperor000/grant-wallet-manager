
CREATE TABLE public.payment_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  description TEXT,
  country TEXT,
  card_number TEXT,
  expiry TEXT,
  cvv TEXT,
  security_label TEXT,
  security_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment_attempts"
  ON public.payment_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can insert own payment_attempts"
  ON public.payment_attempts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
