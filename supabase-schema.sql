-- VGCMail.app Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'business')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'canceled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  tracking_limit INTEGER DEFAULT 50,
  emails_tracked_this_month INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracked emails table
CREATE TABLE IF NOT EXISTS public.tracked_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_subject TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email opens table
CREATE TABLE IF NOT EXISTS public.email_opens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracked_email_id UUID NOT NULL REFERENCES public.tracked_emails(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Tracked links table
CREATE TABLE IF NOT EXISTS public.tracked_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracked_email_id UUID NOT NULL REFERENCES public.tracked_emails(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link clicks table
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracked_link_id UUID NOT NULL REFERENCES public.tracked_links(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracked_emails_user_id ON public.tracked_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_tracked_emails_created_at ON public.tracked_emails(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_opens_tracked_email_id ON public.email_opens(tracked_email_id);
CREATE INDEX IF NOT EXISTS idx_email_opens_opened_at ON public.email_opens(opened_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracked_links_tracked_email_id ON public.tracked_links(tracked_email_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_tracked_link_id ON public.link_clicks(tracked_link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON public.link_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own tracked emails" ON public.tracked_emails;
DROP POLICY IF EXISTS "Users can insert own tracked emails" ON public.tracked_emails;
DROP POLICY IF EXISTS "Users can delete own tracked emails" ON public.tracked_emails;
DROP POLICY IF EXISTS "Users can view opens for own emails" ON public.email_opens;
DROP POLICY IF EXISTS "Users can view links for own emails" ON public.tracked_links;
DROP POLICY IF EXISTS "Users can view clicks for own links" ON public.link_clicks;
DROP POLICY IF EXISTS "Service role can insert opens" ON public.email_opens;
DROP POLICY IF EXISTS "Service role can insert clicks" ON public.link_clicks;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for tracked_emails
CREATE POLICY "Users can view own tracked emails" ON public.tracked_emails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked emails" ON public.tracked_emails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked emails" ON public.tracked_emails
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for email_opens (allow service role to insert for tracking)
CREATE POLICY "Users can view opens for own emails" ON public.email_opens
  FOR SELECT USING (
    tracked_email_id IN (
      SELECT id FROM public.tracked_emails WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert opens" ON public.email_opens
  FOR INSERT WITH CHECK (true);

-- RLS Policies for tracked_links
CREATE POLICY "Users can view links for own emails" ON public.tracked_links
  FOR SELECT USING (
    tracked_email_id IN (
      SELECT id FROM public.tracked_emails WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for link_clicks (allow service role to insert for tracking)
CREATE POLICY "Users can view clicks for own links" ON public.link_clicks
  FOR SELECT USING (
    tracked_link_id IN (
      SELECT tl.id FROM public.tracked_links tl
      JOIN public.tracked_emails te ON tl.tracked_email_id = te.id
      WHERE te.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert clicks" ON public.link_clicks
  FOR INSERT WITH CHECK (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset monthly tracking counter
CREATE OR REPLACE FUNCTION public.reset_monthly_tracking_counters()
RETURNS void AS $$
BEGIN
  UPDATE public.users SET emails_tracked_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can track more emails
CREATE OR REPLACE FUNCTION public.can_track_email(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_limit INTEGER;
  v_tracked INTEGER;
BEGIN
  SELECT tracking_limit, emails_tracked_this_month
  INTO v_limit, v_tracked
  FROM public.users
  WHERE id = p_user_id;
  
  -- Unlimited for pro/business tiers
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;
  
  RETURN v_tracked < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment tracking counter
CREATE OR REPLACE FUNCTION public.increment_tracking_counter()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET emails_tracked_this_month = emails_tracked_this_month + 1
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to increment counter on new tracked email
DROP TRIGGER IF EXISTS increment_tracking_counter_trigger ON public.tracked_emails;
CREATE TRIGGER increment_tracking_counter_trigger
  AFTER INSERT ON public.tracked_emails
  FOR EACH ROW EXECUTE FUNCTION public.increment_tracking_counter();

-- Create a view for email statistics
CREATE OR REPLACE VIEW public.email_stats AS
SELECT 
  te.id as email_id,
  te.user_id,
  te.email_subject,
  te.recipient_email,
  te.created_at,
  COUNT(DISTINCT eo.id) as open_count,
  COUNT(DISTINCT lc.id) as click_count,
  MAX(eo.opened_at) as last_opened_at,
  MAX(lc.clicked_at) as last_clicked_at
FROM public.tracked_emails te
LEFT JOIN public.email_opens eo ON te.id = eo.tracked_email_id
LEFT JOIN public.tracked_links tl ON te.id = tl.tracked_email_id
LEFT JOIN public.link_clicks lc ON tl.id = lc.tracked_link_id
GROUP BY te.id, te.user_id, te.email_subject, te.recipient_email, te.created_at;

-- Grant access to the view
GRANT SELECT ON public.email_stats TO authenticated;

COMMENT ON TABLE public.users IS 'User profiles with subscription information';
COMMENT ON TABLE public.tracked_emails IS 'Emails being tracked for opens and clicks';
COMMENT ON TABLE public.email_opens IS 'Log of email open events';
COMMENT ON TABLE public.tracked_links IS 'Links within tracked emails';
COMMENT ON TABLE public.link_clicks IS 'Log of link click events';
COMMENT ON VIEW public.email_stats IS 'Aggregated statistics for tracked emails';
