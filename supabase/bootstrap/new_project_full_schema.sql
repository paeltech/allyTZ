-- AllyTZ Panel full schema bootstrap
BEGIN;

-- create_user_roles.sql
-- Create user_roles table for managing user permissions
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'user')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_updated_at();

-- Helper function to check if user is admin (using SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own role
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can read all roles (using the function to avoid recursion)
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can insert/update/delete roles (using the function to avoid recursion)
CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Helper function to safely create admin policies on tables
CREATE OR REPLACE FUNCTION create_admin_policies()
RETURNS void AS $$
BEGIN
  -- Update RLS policies for enquiries to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries') THEN
    DROP POLICY IF EXISTS "Admins can manage all enquiries" ON enquiries;
    CREATE POLICY "Admins can manage all enquiries"
      ON enquiries
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for collaborations to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborations') THEN
    DROP POLICY IF EXISTS "Admins can manage all collaborations" ON collaborations;
    CREATE POLICY "Admins can manage all collaborations"
      ON collaborations
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for trade_analyses to allow admin access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analyses') THEN
    DROP POLICY IF EXISTS "Admins can manage trade analyses" ON trade_analyses;
    CREATE POLICY "Admins can manage trade analyses"
      ON trade_analyses
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for trade_analysis_purchases to allow admin read access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analysis_purchases') THEN
    DROP POLICY IF EXISTS "Admins can read all purchases" ON trade_analysis_purchases;
    CREATE POLICY "Admins can read all purchases"
      ON trade_analysis_purchases
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;

  -- Update RLS policies for sentiment_votes to allow admin read access (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sentiment_votes') THEN
    DROP POLICY IF EXISTS "Admins can read all sentiment votes" ON sentiment_votes;
    CREATE POLICY "Admins can read all sentiment votes"
      ON sentiment_votes
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create policies for existing tables
SELECT create_admin_policies();

-- Drop the helper function as it's no longer needed
DROP FUNCTION IF EXISTS create_admin_policies();


-- Seed admin roles only when those auth users exist (safe for fresh projects)
INSERT INTO user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.id IN (
  'b7a990b7-4a53-487c-8627-dd6069741bae'::uuid,
  '9c9c64d9-63c9-4257-bf40-43b75543f715'::uuid
)
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- create_user_profiles.sql
-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT,
  phone_verified BOOLEAN DEFAULT false,
  phone_verification_code TEXT,
  phone_verification_expires_at TIMESTAMP WITH TIME ZONE,
  whatsapp_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  telegram_notifications_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number ON user_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_verified ON user_profiles(phone_verified);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles
-- Users can read their own profile
CREATE POLICY "Users can read their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON user_profiles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create function to automatically create user profile on signup
-- This function is designed to be safe and not fail user creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- In production, you might want to log this to a table
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- create_signals_table.sql
-- Create signals table for storing trading signals
CREATE TABLE IF NOT EXISTS signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Signal Details
  trading_pair TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell')),
  entry_price DECIMAL(10, 5) NOT NULL,
  stop_loss DECIMAL(10, 5) NOT NULL,
  take_profit_1 DECIMAL(10, 5),
  take_profit_2 DECIMAL(10, 5),
  take_profit_3 DECIMAL(10, 5),
  
  -- Analysis
  title TEXT NOT NULL,
  analysis TEXT,
  risk_reward_ratio DECIMAL(5, 2),
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'cancelled')),
  result TEXT DEFAULT 'pending' CHECK (result IN ('win', 'loss', 'breakeven', 'pending')),
  
  -- Metadata
  chart_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_signals_trading_pair ON signals(trading_pair);
CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
CREATE INDEX IF NOT EXISTS idx_signals_signal_type ON signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_created_at ON signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created_by ON signals(created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_signals_updated_at
  BEFORE UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signals_updated_at();

-- Enable Row Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- Create policies for signals
-- Anyone can read active signals
CREATE POLICY "Anyone can read active signals"
  ON signals
  FOR SELECT
  USING (status = 'active');

-- Users can read all signals (including closed ones)
CREATE POLICY "Authenticated users can read all signals"
  ON signals
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Only admins can manage signals
CREATE POLICY "Admins can manage signals"
  ON signals
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- create_signal_pricing.sql
-- Create signal_pricing table for configurable pricing options
CREATE TABLE IF NOT EXISTS signal_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('monthly', 'per_pip')),
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(pricing_type)
);

-- Create signal_subscriptions table for tracking user subscriptions
CREATE TABLE IF NOT EXISTS signal_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pricing_id UUID NOT NULL REFERENCES signal_pricing(id) ON DELETE RESTRICT,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly', 'per_pip')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  pips_purchased INTEGER DEFAULT 0,
  pips_used INTEGER DEFAULT 0,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_signal_pricing_type ON signal_pricing(pricing_type);
CREATE INDEX IF NOT EXISTS idx_signal_pricing_active ON signal_pricing(is_active);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_user_id ON signal_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_pricing_id ON signal_subscriptions(pricing_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_status ON signal_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_type ON signal_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_created_at ON signal_subscriptions(created_at DESC);

-- Create function to update updated_at timestamp for signal_pricing
CREATE OR REPLACE FUNCTION update_signal_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for signal_pricing
CREATE TRIGGER update_signal_pricing_updated_at
  BEFORE UPDATE ON signal_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_pricing_updated_at();

-- Create function to update updated_at timestamp for signal_subscriptions
CREATE OR REPLACE FUNCTION update_signal_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for signal_subscriptions
CREATE TRIGGER update_signal_subscriptions_updated_at
  BEFORE UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_subscriptions_updated_at();

-- Enable Row Level Security
ALTER TABLE signal_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE signal_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for signal_pricing
-- Anyone can read active pricing
CREATE POLICY "Anyone can read active pricing"
  ON signal_pricing
  FOR SELECT
  USING (is_active = true);

-- Admins can read all pricing
CREATE POLICY "Admins can read all pricing"
  ON signal_pricing
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can manage pricing
CREATE POLICY "Admins can manage pricing"
  ON signal_pricing
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create policies for signal_subscriptions
-- Users can read their own subscriptions
CREATE POLICY "Users can read their own subscriptions"
  ON signal_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON signal_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON signal_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all subscriptions
CREATE POLICY "Admins can read all subscriptions"
  ON signal_subscriptions
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all subscriptions
CREATE POLICY "Admins can manage all subscriptions"
  ON signal_subscriptions
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Insert default pricing options
INSERT INTO signal_pricing (pricing_type, price, currency, description, features, is_active)
VALUES 
  (
    'monthly',
    50.00,
    'USD',
    'Unlimited signals for one month',
    '["Daily verified signals", "Institutional-level risk guidance", "Weekly market outlook", "Signals vault access", "Private Telegram access", "Mobile-first delivery"]'::jsonb,
    true
  ),
  (
    'per_pip',
    0.50,
    'USD',
    'Pay per pip gained from signals',
    '["Pay only for profitable pips", "All signal features included", "No monthly commitment", "Flexible usage"]'::jsonb,
    true
  )
ON CONFLICT (pricing_type) DO NOTHING;

-- create_trade_analyses.sql
-- Create trade_analyses table for storing daily trading pair analyses
CREATE TABLE IF NOT EXISTS trade_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trading_pair TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  technical_analysis JSONB,
  fundamental_analysis JSONB,
  entry_levels JSONB,
  exit_levels JSONB,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(trading_pair, analysis_date)
);

-- Create trade_analysis_purchases table for tracking user purchases
CREATE TABLE IF NOT EXISTS trade_analysis_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_analysis_id UUID NOT NULL REFERENCES trade_analyses(id) ON DELETE CASCADE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, trade_analysis_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_trade_analyses_trading_pair ON trade_analyses(trading_pair);
CREATE INDEX IF NOT EXISTS idx_trade_analyses_analysis_date ON trade_analyses(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_trade_analyses_created_at ON trade_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_user_id ON trade_analysis_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_trade_analysis_id ON trade_analysis_purchases(trade_analysis_id);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_payment_status ON trade_analysis_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_trade_analysis_purchases_purchased_at ON trade_analysis_purchases(purchased_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trade_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_trade_analyses_updated_at
  BEFORE UPDATE ON trade_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_trade_analyses_updated_at();

-- Enable Row Level Security
ALTER TABLE trade_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_analysis_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies for trade_analyses
-- Anyone can read available analyses (to see what's available for purchase)
CREATE POLICY "Anyone can read trade analyses"
  ON trade_analyses
  FOR SELECT
  USING (true);

-- Only authenticated users with admin role can insert/update/delete analyses
-- For now, we'll allow service role to manage this, or you can add a user_roles table later
CREATE POLICY "Service role can manage trade analyses"
  ON trade_analyses
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create policies for trade_analysis_purchases
-- Users can read their own purchases
CREATE POLICY "Users can read their own purchases"
  ON trade_analysis_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
  ON trade_analysis_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own purchases (for payment status updates)
CREATE POLICY "Users can update their own purchases"
  ON trade_analysis_purchases
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- create_events.sql
-- Create events table for storing event information
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  organizer TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Networking', 'Workshop', 'Webinar', 'Conference', 'Seminar', 'Other')),
  type TEXT NOT NULL CHECK (type IN ('Physical', 'Virtual', 'Hybrid')),
  price_type TEXT NOT NULL CHECK (price_type IN ('Free', 'Paid')) DEFAULT 'Free',
  price DECIMAL(10, 2) DEFAULT 0.00,
  location TEXT,
  capacity INTEGER NOT NULL DEFAULT 100,
  cover_image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  registration_start_date TIMESTAMP WITH TIME ZONE,
  registration_end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create event_registrations table for tracking user registrations
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registration_status TEXT NOT NULL DEFAULT 'pending' CHECK (registration_status IN ('pending', 'confirmed', 'cancelled', 'attended', 'no_show')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_reference TEXT,
  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON events(is_featured);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON event_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON event_registrations(registration_status);
CREATE INDEX IF NOT EXISTS idx_event_registrations_registered_at ON event_registrations(registered_at DESC);

-- Create function to update updated_at timestamp for events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();

-- Create function to update updated_at timestamp for event_registrations
CREATE OR REPLACE FUNCTION update_event_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at for event_registrations
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_event_registrations_updated_at();

-- Create function to get registration count for an event
CREATE OR REPLACE FUNCTION get_event_registration_count(event_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM event_registrations
    WHERE event_id = event_uuid
    AND registration_status IN ('pending', 'confirmed')
  );
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for events
-- Anyone can read published events
CREATE POLICY "Anyone can read published events"
  ON events
  FOR SELECT
  USING (status = 'published');

-- Authenticated users can read their own events (if they created them)
CREATE POLICY "Users can read their own events"
  ON events
  FOR SELECT
  USING (created_by = auth.uid());

-- Admins can read all events
CREATE POLICY "Admins can read all events"
  ON events
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Only admins can insert/update/delete events
CREATE POLICY "Admins can manage events"
  ON events
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create policies for event_registrations
-- Users can read their own registrations
CREATE POLICY "Users can read their own registrations"
  ON event_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own registrations
CREATE POLICY "Users can insert their own registrations"
  ON event_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own registrations
CREATE POLICY "Users can update their own registrations"
  ON event_registrations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all registrations
CREATE POLICY "Admins can read all registrations"
  ON event_registrations
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all registrations
CREATE POLICY "Admins can manage all registrations"
  ON event_registrations
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- create_collaborations.sql
-- Create collaborations table for partnership and collaboration enquiries
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT NOT NULL,
  collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('content', 'affiliate', 'education', 'technology', 'events', 'media', 'influencer', 'strategic', 'other')),
  website TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborations_status ON collaborations(status);
CREATE INDEX IF NOT EXISTS idx_collaborations_collaboration_type ON collaborations(collaboration_type);
CREATE INDEX IF NOT EXISTS idx_collaborations_created_at ON collaborations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collaborations_email ON collaborations(email);
CREATE INDEX IF NOT EXISTS idx_collaborations_company ON collaborations(company);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_collaborations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_collaborations_updated_at
  BEFORE UPDATE ON collaborations
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborations_updated_at();

-- Enable Row Level Security
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read their own collaborations
CREATE POLICY "Users can read their own collaborations"
  ON collaborations
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Anyone can insert collaborations (for non-authenticated users too)
CREATE POLICY "Anyone can insert collaborations"
  ON collaborations
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own collaborations
CREATE POLICY "Users can update their own collaborations"
  ON collaborations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own collaborations
CREATE POLICY "Users can delete their own collaborations"
  ON collaborations
  FOR DELETE
  USING (auth.uid() = user_id);


-- create_sentiment_votes.sql
-- Create sentiment_votes table for community sentiment polling
CREATE TABLE IF NOT EXISTS sentiment_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  currency_pair TEXT NOT NULL CHECK (currency_pair IN ('EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'EUR/GBP', 'XAU/USD')),
  sentiment TEXT NOT NULL CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, currency_pair)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_currency_pair ON sentiment_votes(currency_pair);
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_user_id ON sentiment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_votes_created_at ON sentiment_votes(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_sentiment_votes_updated_at
  BEFORE UPDATE ON sentiment_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE sentiment_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all votes
CREATE POLICY "Anyone can read sentiment votes"
  ON sentiment_votes
  FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes"
  ON sentiment_votes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
  ON sentiment_votes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
  ON sentiment_votes
  FOR DELETE
  USING (auth.uid() = user_id);




-- create_notifications_table.sql
-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type TEXT NOT NULL CHECK (notification_type IN ('signal', 'event', 'announcement', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_deleted ON notifications(deleted);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read) WHERE deleted = false;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE read = false AND deleted = false;

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
-- Users can read their own non-deleted notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id AND deleted = false);

-- Users can update their own notifications (mark as read/deleted)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all notifications
CREATE POLICY "Admins can read all notifications"
  ON notifications
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role and admins can insert notifications for any user
CREATE POLICY "Service role and admins can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      is_admin(auth.uid()) OR
      auth.jwt()->>'role' = 'service_role'
    )
  );

-- Admins can update any notification
CREATE POLICY "Admins can update all notifications"
  ON notifications
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete notifications
CREATE POLICY "Admins can delete notifications"
  ON notifications
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create function to automatically update read_at timestamp
CREATE OR REPLACE FUNCTION update_notification_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read = true AND OLD.read = false THEN
    NEW.read_at = TIMEZONE('utc'::text, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for read_at timestamp
CREATE TRIGGER set_notification_read_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_read_at();

-- Create function to automatically update deleted_at timestamp
CREATE OR REPLACE FUNCTION update_notification_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deleted = true AND OLD.deleted = false THEN
    NEW.deleted_at = TIMEZONE('utc'::text, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for deleted_at timestamp
CREATE TRIGGER set_notification_deleted_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_deleted_at();

-- Comment on table
COMMENT ON TABLE notifications IS 'In-app notifications for users - signals, events, announcements, and system messages';

-- create_notification_preferences.sql
-- Create notification_preferences table for user notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email Notification Preferences
  email_signals BOOLEAN DEFAULT true,
  email_analyses BOOLEAN DEFAULT true,
  email_events BOOLEAN DEFAULT true,
  email_courses BOOLEAN DEFAULT true,
  
  -- Push Notification Preferences
  push_signals BOOLEAN DEFAULT true,
  push_analyses BOOLEAN DEFAULT true,
  push_events BOOLEAN DEFAULT true,
  push_courses BOOLEAN DEFAULT true,
  
  -- Marketing Preferences
  marketing_emails BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- Enable Row Level Security
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_preferences
-- Users can read their own preferences
CREATE POLICY "Users can read their own notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can insert their own notification preferences"
  ON notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update their own notification preferences"
  ON notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all preferences
CREATE POLICY "Admins can read all notification preferences"
  ON notification_preferences
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all preferences
CREATE POLICY "Admins can manage all notification preferences"
  ON notification_preferences
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Create function to automatically create default preferences on user signup
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_notification_preferences for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create preferences when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Comment on table
COMMENT ON TABLE notification_preferences IS 'User notification preferences for email and push notifications';

-- create_notification_logs.sql
-- Create notification_logs table for tracking all notifications sent
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES signals(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type TEXT DEFAULT 'whatsapp' CHECK (notification_type IN ('whatsapp', 'email', 'telegram', 'sms')),
  phone_number TEXT,
  email_address TEXT,
  message_content TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  error_message TEXT,
  provider_message_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_signal_id ON notification_logs(signal_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_notification_type ON notification_logs(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for notification_logs
-- Users can read their own notification logs
CREATE POLICY "Users can read their own notification logs"
  ON notification_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can read all notification logs
CREATE POLICY "Admins can read all notification logs"
  ON notification_logs
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can insert notification logs
CREATE POLICY "Service role can insert notification logs"
  ON notification_logs
  FOR INSERT
  WITH CHECK (true);

-- Service role can update notification logs
CREATE POLICY "Service role can update notification logs"
  ON notification_logs
  FOR UPDATE
  USING (true);

-- create_in_app_notification_triggers.sql
-- =============================================================================
-- IN-APP NOTIFICATION TRIGGERS
-- Creates notifications in the notifications table for various events
-- =============================================================================

-- Function to create in-app notifications for new signals
CREATE OR REPLACE FUNCTION create_signal_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for active signals
  IF NEW.status = 'active' THEN
    -- Insert a notification for all users who have push_signals enabled
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT 
      np.user_id,
      'signal',
      '🚀 New Trading Signal: ' || NEW.trading_pair,
      CASE 
        WHEN NEW.signal_type = 'buy' THEN 'BUY signal for ' || NEW.trading_pair || ' at ' || NEW.entry_price
        WHEN NEW.signal_type = 'sell' THEN 'SELL signal for ' || NEW.trading_pair || ' at ' || NEW.entry_price
        ELSE 'New signal for ' || NEW.trading_pair
      END,
      jsonb_build_object(
        'signal_id', NEW.id,
        'trading_pair', NEW.trading_pair,
        'signal_type', NEW.signal_type,
        'entry_price', NEW.entry_price,
        'stop_loss', NEW.stop_loss,
        'take_profit_1', NEW.take_profit_1,
        'take_profit_2', NEW.take_profit_2,
        'confidence_level', NEW.confidence_level
      )
    FROM notification_preferences np
    WHERE np.push_signals = true;
    
    RAISE NOTICE 'Created notifications for new signal: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signal creation
    RAISE WARNING 'Failed to create signal notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create in-app notifications for new trade analyses
CREATE OR REPLACE FUNCTION create_analysis_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a notification for all users who have push_analyses enabled
  INSERT INTO notifications (user_id, notification_type, title, message, metadata)
  SELECT 
    np.user_id,
    'announcement',
    '📊 New Trade Analysis: ' || NEW.trading_pair,
    NEW.title || ' - ' || COALESCE(NEW.summary, 'View detailed market analysis'),
    jsonb_build_object(
      'analysis_id', NEW.id,
      'trading_pair', NEW.trading_pair,
      'risk_level', NEW.risk_level,
      'price', NEW.price
    )
  FROM notification_preferences np
  WHERE np.push_analyses = true;
  
  RAISE NOTICE 'Created notifications for new analysis: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create analysis notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create in-app notifications for new events
CREATE OR REPLACE FUNCTION create_event_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notifications for published events
  IF NEW.status = 'published' THEN
    -- Insert a notification for all users who have push_events enabled
    INSERT INTO notifications (user_id, notification_type, title, message, metadata)
    SELECT 
      np.user_id,
      'event',
      '📅 New Event: ' || NEW.title,
      NEW.description || ' - ' || TO_CHAR(NEW.event_date, 'Mon DD, YYYY at HH24:MI'),
      jsonb_build_object(
        'event_id', NEW.id,
        'event_type', NEW.event_type,
        'event_date', NEW.event_date,
        'location', NEW.location,
        'is_online', NEW.is_online
      )
    FROM notification_preferences np
    WHERE np.push_events = true;
    
    RAISE NOTICE 'Created notifications for new event: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create event notifications: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- CREATE TRIGGERS
-- =============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_signal_created_notification ON signals;
DROP TRIGGER IF EXISTS on_analysis_created_notification ON trade_analyses;
DROP TRIGGER IF EXISTS on_event_created_notification ON events;

-- Create trigger for signals
CREATE TRIGGER on_signal_created_notification
  AFTER INSERT ON signals
  FOR EACH ROW
  EXECUTE FUNCTION create_signal_notifications();

-- Create trigger for trade analyses
CREATE TRIGGER on_analysis_created_notification
  AFTER INSERT ON trade_analyses
  FOR EACH ROW
  EXECUTE FUNCTION create_analysis_notifications();

-- Create trigger for events
CREATE TRIGGER on_event_created_notification
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notifications();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON FUNCTION create_signal_notifications() IS 'Creates in-app notifications for all users when a new signal is created';
COMMENT ON FUNCTION create_analysis_notifications() IS 'Creates in-app notifications for all users when a new analysis is published';
COMMENT ON FUNCTION create_event_notifications() IS 'Creates in-app notifications for all users when a new event is published';

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ In-app notification triggers created successfully!';
  RAISE NOTICE '✓ Signals will now create notifications for users with push_signals enabled';
  RAISE NOTICE '✓ Analyses will now create notifications for users with push_analyses enabled';
  RAISE NOTICE '✓ Events will now create notifications for users with push_events enabled';
END $$;

-- create_signal_broadcast_trigger.sql
-- Create database trigger to automatically send WhatsApp notifications when a signal is created
-- This function will be called after a new signal is inserted

CREATE OR REPLACE FUNCTION trigger_signal_broadcast()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Only trigger for new active signals
  IF NEW.status = 'active' THEN
    -- Get the function URL from environment (you'll need to replace this with your actual project URL)
    function_url := current_setting('app.settings.edge_function_url', true);
    service_role_key := current_setting('app.settings.service_role_key', true);
    
    -- If settings are not configured, use default (replace with your actual values)
    IF function_url IS NULL THEN
      function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-whatsapp-notification';
    END IF;
    
    -- Call the Edge Function asynchronously using pg_net
    -- Note: This requires the pg_net extension to be enabled in Supabase
    PERFORM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object('signalId', NEW.id::text)
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the signal insertion
    RAISE WARNING 'Failed to trigger signal broadcast: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_signal_created ON signals;

CREATE TRIGGER on_signal_created
  AFTER INSERT ON signals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_signal_broadcast();

-- Note: To use this trigger, you need to:
-- 1. Enable the pg_net extension in Supabase dashboard
-- 2. Set the configuration parameters:
--    ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://YOUR_PROJECT.supabase.co/functions/v1/send-whatsapp-notification';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';

-- create_get_all_users_function.sql
-- Create a function to get all users with their roles
-- This function can be called by admins to view all users

CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  role TEXT,
  role_created_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    COALESCE(ur.role, 'user') as role,
    COALESCE(ur.created_at, u.created_at) as role_created_at
  FROM auth.users u
  LEFT JOIN user_roles ur ON u.id = ur.user_id
  ORDER BY u.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users (admin check is inside the function)
GRANT EXECUTE ON FUNCTION get_all_users_with_roles() TO authenticated;

-- create_increment_group_member_count_function.sql
-- Create function to increment group member count atomically
CREATE OR REPLACE FUNCTION increment_group_member_count(group_jid_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_groups
  SET member_count = member_count + 1
  WHERE group_jid = group_jid_param;
END;
$$ LANGUAGE plpgsql;

-- add_full_name_to_user_profiles.sql
-- Add full_name column to user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Create index for faster queries on full_name
CREATE INDEX IF NOT EXISTS idx_user_profiles_full_name ON user_profiles(full_name);

-- Comment on column
COMMENT ON COLUMN user_profiles.full_name IS 'User full name for display purposes';

-- add_chart_image_to_trade_analyses.sql
-- Add chart_image_url column to trade_analyses table
-- Run this migration in Supabase SQL Editor

ALTER TABLE trade_analyses 
ADD COLUMN IF NOT EXISTS chart_image_url TEXT;

-- Create index for chart_image_url queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_trade_analyses_chart_image_url 
ON trade_analyses(chart_image_url) 
WHERE chart_image_url IS NOT NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trade_analyses' 
AND column_name = 'chart_image_url';

-- add_default_user_roles.sql
-- Add default 'user' role to all existing users who don't have a role
-- This ensures all users have a role entry in the user_roles table

-- Insert 'user' role for all auth.users who don't have a role yet
INSERT INTO user_roles (user_id, role)
SELECT 
  u.id as user_id,
  'user' as role
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- Create function to automatically assign default 'user' role to new users
-- This function is designed to be safe and not fail user creation
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Insert default 'user' role for new user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- In production, you might want to log this to a table
      RAISE WARNING 'Error in assign_default_user_role for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;

-- Create trigger to automatically assign 'user' role when user signs up
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_default_user_role();

-- add_provider_message_id_index.sql
-- Add index on provider_message_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS idx_notification_logs_provider_message_id 
ON notification_logs(provider_message_id) 
WHERE provider_message_id IS NOT NULL;

-- Add index on status and notification_type for filtering
CREATE INDEX IF NOT EXISTS idx_notification_logs_status_type 
ON notification_logs(status, notification_type);

-- update_signal_subscriptions_notifications.sql
-- Add notification preference columns to signal_subscriptions table
ALTER TABLE signal_subscriptions
ADD COLUMN IF NOT EXISTS whatsapp_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT false;

-- Create index for active subscriptions with WhatsApp enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_active 
  ON signal_subscriptions(status, whatsapp_notifications) 
  WHERE status = 'active' AND whatsapp_notifications = true;

-- Create index for active subscriptions with email enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_email_active 
  ON signal_subscriptions(status, email_notifications) 
  WHERE status = 'active' AND email_notifications = true;

-- Create index for active subscriptions with telegram enabled
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_telegram_active 
  ON signal_subscriptions(status, telegram_notifications) 
  WHERE status = 'active' AND telegram_notifications = true;

-- auto_subscribe_new_users.sql
-- Auto-subscribe new users to monthly signals
-- This trigger automatically creates a monthly subscription when a new user signs up
-- Only subscribes users who have a phone number in their user profile

-- Create function to automatically subscribe new users to monthly signals
-- This function is designed to be safe and not fail user creation if subscription fails
CREATE OR REPLACE FUNCTION auto_subscribe_new_user()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
  user_phone_number TEXT;
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Get the monthly pricing ID
    SELECT id INTO monthly_pricing_id
    FROM signal_pricing
    WHERE pricing_type = 'monthly' AND is_active = true
    LIMIT 1;

    -- Only create subscription if monthly pricing exists
    IF monthly_pricing_id IS NOT NULL THEN
      -- Check if user has a phone number in their profile
      -- Use a small delay to ensure profile is created first (trigger execution order)
      SELECT phone_number INTO user_phone_number
      FROM user_profiles
      WHERE id = NEW.id;

      -- Only subscribe if user has a phone number
      IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
        -- Check if user already has an active subscription (prevent duplicates)
        IF NOT EXISTS (
          SELECT 1 FROM signal_subscriptions 
          WHERE user_id = NEW.id AND status = 'active'
        ) THEN
          -- Create monthly subscription for new user
          INSERT INTO signal_subscriptions (
            user_id,
            pricing_id,
            subscription_type,
            status,
            payment_status,
            amount_paid,
            whatsapp_notifications,
            email_notifications,
            telegram_notifications,
            start_date,
            end_date
          )
          VALUES (
            NEW.id,
            monthly_pricing_id,
            'monthly',
            'active',
            'completed',
            0.00, -- Free subscription for new users
            true, -- Enable WhatsApp notifications
            true, -- Enable email notifications
            false, -- Disable Telegram by default
            TIMEZONE('utc'::text, NOW()),
            TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' -- Set end date to 1 month from now
          );
        END IF;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- In production, you might want to log this to a table
      RAISE WARNING 'Error in auto_subscribe_new_user for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

-- Create trigger to automatically subscribe new users when they sign up
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_subscribe_new_user();

-- auto_subscribe_on_phone_update.sql
-- Auto-subscribe users when they add a phone number to their profile
-- This trigger subscribes users to monthly signals when they update their profile with a phone number
-- This handles cases where users sign up without a phone number initially

-- Create function to subscribe user when phone number is added
CREATE OR REPLACE FUNCTION auto_subscribe_on_phone_update()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
BEGIN
  -- Only proceed if phone number was just added (was NULL/empty, now has value)
  IF (OLD.phone_number IS NULL OR TRIM(OLD.phone_number) = '') 
     AND NEW.phone_number IS NOT NULL 
     AND TRIM(NEW.phone_number) != '' THEN
    
    -- Get the monthly pricing ID
    SELECT id INTO monthly_pricing_id
    FROM signal_pricing
    WHERE pricing_type = 'monthly' AND is_active = true
    LIMIT 1;

    -- Only create subscription if monthly pricing exists
    IF monthly_pricing_id IS NOT NULL THEN
      -- Check if user already has an active subscription (prevent duplicates)
      IF NOT EXISTS (
        SELECT 1 FROM signal_subscriptions 
        WHERE user_id = NEW.id AND status = 'active'
      ) THEN
        -- Create monthly subscription for user
        INSERT INTO signal_subscriptions (
          user_id,
          pricing_id,
          subscription_type,
          status,
          payment_status,
          amount_paid,
          whatsapp_notifications,
          email_notifications,
          telegram_notifications,
          start_date,
          end_date
        )
        VALUES (
          NEW.id,
          monthly_pricing_id,
          'monthly',
          'active',
          'completed',
          0.00, -- Free subscription
          true, -- Enable WhatsApp notifications
          true, -- Enable email notifications
          false, -- Disable Telegram by default
          TIMEZONE('utc'::text, NOW()),
          TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month'
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS on_user_profile_phone_update ON user_profiles;

-- Create trigger to subscribe users when they add a phone number
CREATE TRIGGER on_user_profile_phone_update
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (OLD.phone_number IS DISTINCT FROM NEW.phone_number)
  EXECUTE FUNCTION auto_subscribe_on_phone_update();

-- enforce_unique_user_email.sql
-- Enforce unique user email constraint
-- Supabase Auth already enforces email uniqueness, but this adds an extra layer of protection

-- Note: Supabase's auth.users table already has email uniqueness enforced at the database level.
-- This migration adds additional safeguards and ensures the constraint is explicit.

-- Create a function to check for duplicate emails (case-insensitive)
CREATE OR REPLACE FUNCTION check_unique_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if email already exists (case-insensitive)
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE LOWER(email) = LOWER(NEW.email)
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email % already exists', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce email uniqueness on insert
-- Note: This may not work if Supabase has restrictions on auth.users triggers
-- If this fails, Supabase Auth already enforces uniqueness, so it's safe to skip
DO $$
BEGIN
  -- Try to create trigger, but don't fail if it already exists or can't be created
  BEGIN
    DROP TRIGGER IF EXISTS enforce_unique_email_trigger ON auth.users;
    CREATE TRIGGER enforce_unique_email_trigger
      BEFORE INSERT OR UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION check_unique_email();
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create trigger on auth.users - Supabase Auth already enforces email uniqueness';
    WHEN OTHERS THEN
      RAISE NOTICE 'Trigger creation skipped: %', SQLERRM;
  END;
END $$;

-- Add a unique index on email (case-insensitive) if it doesn't exist
-- Note: Supabase may already have this, so we use IF NOT EXISTS pattern
DO $$
BEGIN
  -- Try to create unique index, but don't fail if it already exists
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email_unique 
    ON auth.users (LOWER(email));
  EXCEPTION
    WHEN duplicate_table THEN
      RAISE NOTICE 'Unique index on email already exists';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Cannot create index on auth.users - Supabase manages this automatically';
    WHEN OTHERS THEN
      RAISE NOTICE 'Index creation skipped: %', SQLERRM;
  END;
END $$;

-- Verify email uniqueness constraint
-- This query will show if there are any duplicate emails (should return 0 rows)
SELECT LOWER(email) AS email, COUNT(*) AS count
FROM auth.users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

-- If the above query returns any rows, you have duplicate emails that need to be resolved manually

-- fix_admin_policies.sql
-- Fix script to resolve infinite recursion in admin policies
-- Run this in Supabase SQL Editor if you're getting recursion errors

-- First, ensure the is_admin function exists and is correct
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate user_roles policies to use the function
DROP POLICY IF EXISTS "Admins can read all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;

-- Recreate with function to avoid recursion
CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
  ON user_roles
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Fix policies for other tables
DO $$
BEGIN
  -- Fix enquiries policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enquiries') THEN
    DROP POLICY IF EXISTS "Admins can manage all enquiries" ON enquiries;
    CREATE POLICY "Admins can manage all enquiries"
      ON enquiries
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix collaborations policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborations') THEN
    DROP POLICY IF EXISTS "Admins can manage all collaborations" ON collaborations;
    CREATE POLICY "Admins can manage all collaborations"
      ON collaborations
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix trade_analyses policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analyses') THEN
    DROP POLICY IF EXISTS "Admins can manage trade analyses" ON trade_analyses;
    CREATE POLICY "Admins can manage trade analyses"
      ON trade_analyses
      FOR ALL
      USING (is_admin(auth.uid()))
      WITH CHECK (is_admin(auth.uid()));
  END IF;

  -- Fix trade_analysis_purchases policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trade_analysis_purchases') THEN
    DROP POLICY IF EXISTS "Admins can read all purchases" ON trade_analysis_purchases;
    CREATE POLICY "Admins can read all purchases"
      ON trade_analysis_purchases
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;

  -- Fix sentiment_votes policies
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sentiment_votes') THEN
    DROP POLICY IF EXISTS "Admins can read all sentiment votes" ON sentiment_votes;
    CREATE POLICY "Admins can read all sentiment votes"
      ON sentiment_votes
      FOR SELECT
      USING (is_admin(auth.uid()));
  END IF;
END $$;

-- fix_signup_triggers_error_handling.sql
-- Fix signup triggers with proper error handling
-- This migration ensures triggers don't fail user creation if there are issues
-- IMPORTANT: Run this migration to fix the "Database error saving new user" issue

-- Update create_user_profile function with error handling
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update assign_default_user_role function with error handling
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Insert default 'user' role for new user
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user')
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      RAISE WARNING 'Error in assign_default_user_role for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update auto_subscribe_new_user function with error handling
-- Note: This function is disabled during signup because phone number isn't available yet
-- The phone_update trigger will handle subscription when phone is added via update_user_profile_on_signup
-- This function is kept for backward compatibility but won't execute during normal signup flow
CREATE OR REPLACE FUNCTION auto_subscribe_new_user()
RETURNS TRIGGER AS $$
DECLARE
  monthly_pricing_id UUID;
  user_phone_number TEXT;
  has_notification_columns BOOLEAN;
BEGIN
  -- Wrap in exception handler to prevent errors from blocking user creation
  BEGIN
    -- Check if notification columns exist (they might not if migration hasn't run)
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'signal_subscriptions' 
      AND column_name = 'whatsapp_notifications'
    ) INTO has_notification_columns;

    -- Get the monthly pricing ID
    SELECT id INTO monthly_pricing_id
    FROM signal_pricing
    WHERE pricing_type = 'monthly' AND is_active = true
    LIMIT 1;

    -- Only create subscription if monthly pricing exists
    IF monthly_pricing_id IS NOT NULL THEN
      -- Check if user has a phone number in their profile
      -- Note: Profile might not exist yet or phone might not be set
      -- This is OK - the phone_update trigger will handle subscription
      SELECT phone_number INTO user_phone_number
      FROM user_profiles
      WHERE id = NEW.id;

      -- Only subscribe if user has a phone number
      IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
        -- Check if user already has an active subscription (prevent duplicates)
        IF NOT EXISTS (
          SELECT 1 FROM signal_subscriptions 
          WHERE user_id = NEW.id AND status = 'active'
        ) THEN
          -- Create monthly subscription for new user
          -- Handle both cases: with and without notification columns
          IF has_notification_columns THEN
            INSERT INTO signal_subscriptions (
              user_id,
              pricing_id,
              subscription_type,
              status,
              payment_status,
              amount_paid,
              whatsapp_notifications,
              email_notifications,
              telegram_notifications,
              start_date,
              end_date
            )
            VALUES (
              NEW.id,
              monthly_pricing_id,
              'monthly',
              'active',
              'completed',
              0.00, -- Free subscription for new users
              true, -- Enable WhatsApp notifications
              true, -- Enable email notifications
              false, -- Disable Telegram by default
              TIMEZONE('utc'::text, NOW()),
              TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' -- Set end date to 1 month from now
            );
          ELSE
            -- Fallback if notification columns don't exist yet
            INSERT INTO signal_subscriptions (
              user_id,
              pricing_id,
              subscription_type,
              status,
              payment_status,
              amount_paid,
              start_date,
              end_date
            )
            VALUES (
              NEW.id,
              monthly_pricing_id,
              'monthly',
              'active',
              'completed',
              0.00, -- Free subscription for new users
              TIMEZONE('utc'::text, NOW()),
              TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' -- Set end date to 1 month from now
            );
          END IF;
        END IF;
      END IF;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail user creation
      -- The phone_update trigger will handle subscription when phone is added
      RAISE WARNING 'Error in auto_subscribe_new_user for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- subscribe_existing_users.sql
-- Subscribe existing users who are not subscribed to monthly signals
-- This migration ensures all existing users with phone numbers have a monthly subscription

-- Insert monthly subscription for all users who:
-- 1. Don't have an active subscription
-- 2. Have a phone number in their user profile
INSERT INTO signal_subscriptions (
  user_id,
  pricing_id,
  subscription_type,
  status,
  payment_status,
  amount_paid,
  whatsapp_notifications,
  email_notifications,
  telegram_notifications,
  start_date,
  end_date
)
SELECT 
  u.id as user_id,
  sp.id as pricing_id,
  'monthly' as subscription_type,
  'active' as status,
  'completed' as payment_status,
  0.00 as amount_paid, -- Free subscription for existing users
  true as whatsapp_notifications,
  true as email_notifications,
  false as telegram_notifications,
  TIMEZONE('utc'::text, NOW()) as start_date,
  TIMEZONE('utc'::text, NOW()) + INTERVAL '1 month' as end_date
FROM auth.users u
INNER JOIN user_profiles up ON u.id = up.id
CROSS JOIN signal_pricing sp
WHERE sp.pricing_type = 'monthly' AND sp.is_active = true
  -- Only subscribe users who have a phone number
  AND up.phone_number IS NOT NULL
  AND TRIM(up.phone_number) != ''
  -- Only subscribe users who don't have an active subscription
  AND NOT EXISTS (
    SELECT 1 
    FROM signal_subscriptions ss 
    WHERE ss.user_id = u.id 
      AND ss.status = 'active'
  )
ON CONFLICT DO NOTHING; -- Prevent duplicate subscriptions if migration is run multiple times

-- Log the number of users subscribed and how many were skipped
DO $$
DECLARE
  subscribed_count INTEGER;
  users_with_phone INTEGER;
  users_without_phone INTEGER;
BEGIN
  -- Count users with active subscriptions
  SELECT COUNT(*) INTO subscribed_count
  FROM signal_subscriptions
  WHERE status = 'active' AND subscription_type = 'monthly';
  
  -- Count users with phone numbers
  SELECT COUNT(*) INTO users_with_phone
  FROM auth.users u
  INNER JOIN user_profiles up ON u.id = up.id
  WHERE up.phone_number IS NOT NULL AND TRIM(up.phone_number) != '';
  
  -- Count users without phone numbers
  SELECT COUNT(*) INTO users_without_phone
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.id
  WHERE up.phone_number IS NULL OR TRIM(up.phone_number) = '';
  
  RAISE NOTICE 'Migration completed:';
  RAISE NOTICE '  - % users now have active monthly subscriptions', subscribed_count;
  RAISE NOTICE '  - % users with phone numbers (eligible for subscription)', users_with_phone;
  RAISE NOTICE '  - % users without phone numbers (skipped)', users_without_phone;
END $$;

-- migrate_existing_subscribers_to_groups.sql
-- Migration script to add existing active subscribers to initial WhatsApp groups
-- This should be run after creating the groups table and edge functions
-- It will create groups for the current month and add all active subscribers

-- Note: This migration calls the edge function, so it requires:
-- 1. Edge functions to be deployed
-- 2. pg_net extension to be enabled
-- 3. app.settings.edge_function_url and app.settings.service_role_key to be configured

DO $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
  current_month_year TEXT;
BEGIN
  -- Get current month in YYYY-MM format
  current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  
  -- Get function URL and service role key
  function_url := current_setting('app.settings.edge_function_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Default values if not configured
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Check if groups already exist for current month
  IF EXISTS (
    SELECT 1 FROM whatsapp_groups 
    WHERE is_active = true 
    AND month_year = current_month_year
  ) THEN
    RAISE NOTICE 'Groups already exist for %. Skipping migration.', current_month_year;
    RETURN;
  END IF;
  
  -- Call the refresh edge function to create groups and migrate subscribers
  SELECT status INTO response_status
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
      'apikey', COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object()
  );
  
  IF response_status = 200 THEN
    RAISE NOTICE 'Successfully migrated existing subscribers to WhatsApp groups for %.', current_month_year;
  ELSE
    RAISE WARNING 'Migration returned status: %. Check edge function logs.', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to migrate existing subscribers: %. You may need to run the refresh function manually.', SQLERRM;
END $$;

-- update_user_profile_on_signup.sql
-- Create function to update user profile on signup
-- This function bypasses RLS using SECURITY DEFINER, allowing profile updates
-- even when the user doesn't have an active session (e.g., before email confirmation)
CREATE OR REPLACE FUNCTION update_user_profile_on_signup(
  user_id UUID,
  phone_number_param TEXT,
  phone_verified_param BOOLEAN DEFAULT true,
  whatsapp_notifications_param BOOLEAN DEFAULT true,
  email_notifications_param BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
  -- Ensure the profile exists (trigger should have created it, but just in case)
  INSERT INTO public.user_profiles (id)
  VALUES (user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Update the profile with the provided information
  UPDATE public.user_profiles
  SET
    phone_number = phone_number_param,
    phone_verified = phone_verified_param,
    whatsapp_notifications_enabled = whatsapp_notifications_param,
    email_notifications_enabled = email_notifications_param,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anon users
-- This allows the function to be called from the signup form
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN) TO anon;

-- 20260113092044_create_whatsapp_groups_system.sql
-- Create whatsapp_groups table for tracking WhatsApp groups
CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_name TEXT NOT NULL DEFAULT 'AllyTZ Panel - Monthly Subscribers',
  group_jid TEXT NOT NULL UNIQUE, -- WhatsApp group JID from WaSender API
  group_number INTEGER NOT NULL DEFAULT 1, -- For overflow groups (1, 2, 3, etc.)
  member_count INTEGER NOT NULL DEFAULT 0,
  max_members INTEGER NOT NULL DEFAULT 1024, -- Maximum members before overflow
  is_active BOOLEAN NOT NULL DEFAULT true,
  month_year TEXT NOT NULL, -- Format: "YYYY-MM" for monthly tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(month_year, group_number) -- Ensure unique group per month/number combination
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_is_active ON whatsapp_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_month_year ON whatsapp_groups(month_year);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_group_jid ON whatsapp_groups(group_jid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_active_month ON whatsapp_groups(is_active, month_year) WHERE is_active = true;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_whatsapp_groups_updated_at
  BEFORE UPDATE ON whatsapp_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_groups_updated_at();

-- Enable Row Level Security
ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_groups
-- Admins can read all groups
CREATE POLICY "Admins can read all groups"
  ON whatsapp_groups
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Admins can manage all groups
CREATE POLICY "Admins can manage all groups"
  ON whatsapp_groups
  FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Service role can manage groups (for edge functions)
CREATE POLICY "Service role can manage groups"
  ON whatsapp_groups
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
-- Create whatsapp_group_operations table for logging all group operations
CREATE TABLE IF NOT EXISTS whatsapp_group_operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('create', 'add_member', 'remove_member', 'send_message', 'refresh')),
  group_id UUID REFERENCES whatsapp_groups(id) ON DELETE SET NULL,
  group_jid TEXT, -- Denormalized for quick access
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT,
  signal_id UUID REFERENCES signals(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  response_data JSONB, -- Store API response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_type ON whatsapp_group_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_group_id ON whatsapp_group_operations(group_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_user_id ON whatsapp_group_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_success ON whatsapp_group_operations(success);
CREATE INDEX IF NOT EXISTS idx_whatsapp_group_operations_created_at ON whatsapp_group_operations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE whatsapp_group_operations ENABLE ROW LEVEL SECURITY;

-- Create policies for whatsapp_group_operations
-- Admins can read all operations
CREATE POLICY "Admins can read all operations"
  ON whatsapp_group_operations
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can insert operations (for edge functions)
CREATE POLICY "Service role can insert operations"
  ON whatsapp_group_operations
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
-- Add group membership columns to signal_subscriptions table
ALTER TABLE signal_subscriptions
  ADD COLUMN IF NOT EXISTS whatsapp_group_id UUID REFERENCES whatsapp_groups(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_group_jid TEXT; -- Denormalized for quick access

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_group_id ON signal_subscriptions(whatsapp_group_id);
CREATE INDEX IF NOT EXISTS idx_signal_subscriptions_whatsapp_group_jid ON signal_subscriptions(whatsapp_group_jid);
-- Create function to increment group member count atomically
CREATE OR REPLACE FUNCTION increment_group_member_count(group_jid_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE whatsapp_groups
  SET member_count = member_count + 1
  WHERE group_jid = group_jid_param;
END;
$$ LANGUAGE plpgsql;

-- 20260113092045_create_group_triggers.sql
-- Create trigger function to automatically add users to WhatsApp groups when subscription becomes active
CREATE OR REPLACE FUNCTION add_user_to_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
  user_whatsapp_enabled BOOLEAN;
  current_month_year TEXT;
  active_group RECORD;
BEGIN
  -- Only proceed if subscription status is 'active' and WhatsApp notifications are enabled
  IF NEW.status = 'active' 
     AND NEW.whatsapp_notifications = true 
     AND (OLD.status IS NULL OR OLD.status != 'active' OR OLD.whatsapp_notifications != true) THEN
    
    -- Get user's phone number and WhatsApp notification preference
    SELECT phone_number, whatsapp_notifications_enabled, phone_verified
    INTO user_phone_number, user_whatsapp_enabled, user_whatsapp_enabled
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has verified phone number and WhatsApp enabled
    IF user_phone_number IS NOT NULL 
       AND TRIM(user_phone_number) != '' 
       AND user_whatsapp_enabled = true THEN
      
      -- Get current month in YYYY-MM format
      current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
      
      -- Find active group with space available for current month
      SELECT * INTO active_group
      FROM whatsapp_groups
      WHERE is_active = true
        AND month_year = current_month_year
        AND member_count < max_members
      ORDER BY group_number ASC
      LIMIT 1;
      
      -- If no group with space exists, get or create one via edge function
      IF active_group IS NULL THEN
        -- Get function URL and service role key
        function_url := current_setting('app.settings.edge_function_url', true);
        service_role_key := current_setting('app.settings.service_role_key', true);
        
        -- Default values if not configured
        IF function_url IS NULL THEN
          function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
        END IF;
        
        -- Call edge function to get or create active group
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'get_or_create_active_group',
            'monthYear', current_month_year
          )
        );
        
        -- Re-fetch the group after creation
        SELECT * INTO active_group
        FROM whatsapp_groups
        WHERE is_active = true
          AND month_year = current_month_year
          AND member_count < max_members
        ORDER BY group_number ASC
        LIMIT 1;
      END IF;
      
      -- If we have an active group, add user to it
      IF active_group IS NOT NULL THEN
        -- Call edge function to add member
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'add_member',
            'groupJid', active_group.group_jid,
            'phoneNumber', user_phone_number,
            'userId', NEW.user_id::text
          )
        );
        
        -- Update subscription with group info
        NEW.whatsapp_group_id := active_group.id;
        NEW.whatsapp_group_jid := active_group.group_jid;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to add user to WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_active_add_to_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_active_add_to_group
  AFTER INSERT OR UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_whatsapp_group();
-- Create trigger function to automatically remove users from WhatsApp groups when subscription expires
CREATE OR REPLACE FUNCTION remove_user_from_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
BEGIN
  -- Only proceed if subscription status changed to 'expired' or 'cancelled'
  -- and user was previously in a group
  IF (NEW.status = 'expired' OR NEW.status = 'cancelled')
     AND (OLD.status = 'active')
     AND OLD.whatsapp_group_jid IS NOT NULL THEN
    
    -- Get user's phone number
    SELECT phone_number INTO user_phone_number
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has phone number
    IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
      
      -- Get function URL and service role key
      function_url := current_setting('app.settings.edge_function_url', true);
      service_role_key := current_setting('app.settings.service_role_key', true);
      
      -- Default values if not configured
      IF function_url IS NULL THEN
        function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
      END IF;
      
      -- Call edge function to remove member
      PERFORM net.http_post(
        url := function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
          'apikey', COALESCE(service_role_key, '')
        ),
        body := jsonb_build_object(
          'action', 'remove_member',
          'groupJid', OLD.whatsapp_group_jid,
          'phoneNumber', user_phone_number,
          'userId', NEW.user_id::text
        )
      );
      
      -- Clear group info from subscription
      NEW.whatsapp_group_id := NULL;
      NEW.whatsapp_group_jid := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to remove user from WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_expired_remove_from_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_expired_remove_from_group
  AFTER UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION remove_user_from_whatsapp_group();

-- 20260113092055_create_monthly_group_refresh_job.sql
-- Create scheduled job to run monthly group refresh
-- This uses pg_cron extension which needs to be enabled in Supabase

-- Note: pg_cron must be enabled in Supabase dashboard first
-- To enable: Go to Database > Extensions > Enable pg_cron

-- Create function to call the refresh edge function
CREATE OR REPLACE FUNCTION call_refresh_whatsapp_groups()
RETURNS void AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Get function URL and service role key
  function_url := current_setting('app.settings.edge_function_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Default values if not configured
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Call the refresh edge function
  SELECT status INTO response_status
  FROM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
      'apikey', COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object()
  );
  
  -- Log the result
  IF response_status != 200 THEN
    RAISE WARNING 'Refresh WhatsApp groups returned status: %', response_status;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call refresh WhatsApp groups: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run on the 1st of each month at 00:00 UTC
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can use Supabase's cron jobs feature instead

-- Uncomment the following line if pg_cron is enabled:
-- SELECT cron.schedule(
--   'refresh-whatsapp-groups-monthly',
--   '0 0 1 * *', -- Run at 00:00 UTC on the 1st of every month
--   $$SELECT call_refresh_whatsapp_groups();$$
-- );

-- Alternative: Use Supabase's built-in cron jobs
-- Go to Database > Cron Jobs in Supabase dashboard and create:
-- Schedule: 0 0 1 * * (cron expression for 1st of month at 00:00 UTC)
-- SQL: SELECT call_refresh_whatsapp_groups();

-- 20260113092114_setup_cron_job.sql
-- ============================================
-- Setup Cron Job for Monthly Group Refresh
-- ============================================
-- 
-- IMPORTANT: This script sets up the cron job using Supabase's pg_cron extension
-- 
-- Prerequisites:
-- 1. Enable pg_cron extension in Supabase Dashboard:
--    - Go to Database > Extensions
--    - Search for "pg_cron" and enable it
-- 
-- 2. Enable pg_net extension (required for calling edge functions):
--    - Go to Database > Extensions  
--    - Search for "pg_net" and enable it
--
-- 3. Set database configuration (if not already set):
--    ALTER DATABASE postgres SET app.settings.edge_function_url = 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
--    ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
--
-- ============================================

-- Check if pg_cron is available and schedule the job
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job to run on the 1st of each month at 00:00 UTC
    PERFORM cron.schedule(
      'refresh-whatsapp-groups-monthly',
      '0 0 1 * *',
      'SELECT call_refresh_whatsapp_groups();'
    );
    RAISE NOTICE 'Cron job "refresh-whatsapp-groups-monthly" scheduled successfully';
  ELSE
    RAISE WARNING 'pg_cron extension is not enabled. Please enable it in Supabase Dashboard > Database > Extensions';
    RAISE NOTICE 'Alternatively, use Supabase Cron Jobs feature in the dashboard';
  END IF;
END $$;

-- 20260113095536_update_triggers_use_settings_table.sql
-- Create app_settings table to store configuration values
-- This avoids needing superuser privileges for ALTER DATABASE

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create function to get setting value
CREATE OR REPLACE FUNCTION get_app_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM app_settings
  WHERE key = setting_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default settings (can be updated via SQL or admin UI)
INSERT INTO app_settings (key, value, description)
VALUES 
  ('edge_function_url', 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups', 'Base URL for edge functions'),
  ('service_role_key', '', 'Service role key for edge function authentication')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read settings
CREATE POLICY "Admins can read settings"
  ON app_settings
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Service role can read settings
CREATE POLICY "Service role can read settings"
  ON app_settings
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admins can update settings
CREATE POLICY "Admins can update settings"
  ON app_settings
  FOR UPDATE
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Service role can update settings
CREATE POLICY "Service role can update settings"
  ON app_settings
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
-- Create trigger function to automatically add users to WhatsApp groups when subscription becomes active
CREATE OR REPLACE FUNCTION add_user_to_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
  user_whatsapp_enabled BOOLEAN;
  current_month_year TEXT;
  active_group RECORD;
BEGIN
  -- Only proceed if subscription status is 'active' and WhatsApp notifications are enabled
  IF NEW.status = 'active' 
     AND NEW.whatsapp_notifications = true 
     AND (OLD.status IS NULL OR OLD.status != 'active' OR OLD.whatsapp_notifications != true) THEN
    
    -- Get user's phone number and WhatsApp notification preference
    SELECT phone_number, whatsapp_notifications_enabled, phone_verified
    INTO user_phone_number, user_whatsapp_enabled, user_whatsapp_enabled
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has verified phone number and WhatsApp enabled
    IF user_phone_number IS NOT NULL 
       AND TRIM(user_phone_number) != '' 
       AND user_whatsapp_enabled = true THEN
      
      -- Get current month in YYYY-MM format
      current_month_year := TO_CHAR(NOW(), 'YYYY-MM');
      
      -- Find active group with space available for current month
      SELECT * INTO active_group
      FROM whatsapp_groups
      WHERE is_active = true
        AND month_year = current_month_year
        AND member_count < max_members
      ORDER BY group_number ASC
      LIMIT 1;
      
      -- If no group with space exists, get or create one via edge function
      IF active_group IS NULL THEN
        -- Get function URL and service role key from app_settings table
        SELECT get_app_setting('edge_function_url') INTO function_url;
        SELECT get_app_setting('service_role_key') INTO service_role_key;
        
        -- Default values if not configured
        IF function_url IS NULL OR function_url = '' THEN
          function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
        END IF;
        
        -- Call edge function to get or create active group
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'get_or_create_active_group',
            'monthYear', current_month_year
          )
        );
        
        -- Re-fetch the group after creation
        SELECT * INTO active_group
        FROM whatsapp_groups
        WHERE is_active = true
          AND month_year = current_month_year
          AND member_count < max_members
        ORDER BY group_number ASC
        LIMIT 1;
      END IF;
      
      -- If we have an active group, add user to it
      IF active_group IS NOT NULL THEN
        -- Call edge function to add member
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_role_key, ''),
            'apikey', COALESCE(service_role_key, '')
          ),
          body := jsonb_build_object(
            'action', 'add_member',
            'groupJid', active_group.group_jid,
            'phoneNumber', user_phone_number,
            'userId', NEW.user_id::text
          )
        );
        
        -- Update subscription with group info
        NEW.whatsapp_group_id := active_group.id;
        NEW.whatsapp_group_jid := active_group.group_jid;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to add user to WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_active_add_to_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_active_add_to_group
  AFTER INSERT OR UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION add_user_to_whatsapp_group();
-- Create trigger function to automatically remove users from WhatsApp groups when subscription expires
CREATE OR REPLACE FUNCTION remove_user_from_whatsapp_group()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  user_phone_number TEXT;
BEGIN
  -- Only proceed if subscription status changed to 'expired' or 'cancelled'
  -- and user was previously in a group
  IF (NEW.status = 'expired' OR NEW.status = 'cancelled')
     AND (OLD.status = 'active')
     AND OLD.whatsapp_group_jid IS NOT NULL THEN
    
    -- Get user's phone number
    SELECT phone_number INTO user_phone_number
    FROM user_profiles
    WHERE id = NEW.user_id;
    
    -- Only proceed if user has phone number
    IF user_phone_number IS NOT NULL AND TRIM(user_phone_number) != '' THEN
      
      -- Get function URL and service role key from app_settings table
      SELECT get_app_setting('edge_function_url') INTO function_url;
      SELECT get_app_setting('service_role_key') INTO service_role_key;
      
      -- Default values if not configured
      IF function_url IS NULL OR function_url = '' THEN
        function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/manage-whatsapp-groups';
      END IF;
      
      -- Only call edge function if service role key is available
      IF service_role_key IS NOT NULL AND service_role_key != '' THEN
        -- Call edge function to remove member
        PERFORM net.http_post(
          url := function_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || service_role_key,
            'apikey', service_role_key
          ),
          body := jsonb_build_object(
            'action', 'remove_member',
            'groupJid', OLD.whatsapp_group_jid,
            'phoneNumber', user_phone_number,
            'userId', NEW.user_id::text
          )
        );
      END IF;
      
      -- Clear group info from subscription
      NEW.whatsapp_group_id := NULL;
      NEW.whatsapp_group_jid := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the subscription update
    RAISE WARNING 'Failed to remove user from WhatsApp group: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_subscription_expired_remove_from_group ON signal_subscriptions;

CREATE TRIGGER on_subscription_expired_remove_from_group
  AFTER UPDATE ON signal_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION remove_user_from_whatsapp_group();
-- Create scheduled job to run monthly group refresh
-- This uses pg_cron extension which needs to be enabled in Supabase

-- Note: pg_cron must be enabled in Supabase dashboard first
-- To enable: Go to Database > Extensions > Enable pg_cron

-- Create function to call the refresh edge function
CREATE OR REPLACE FUNCTION call_refresh_whatsapp_groups()
RETURNS void AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
  response_status INT;
BEGIN
  -- Get function URL and service role key from app_settings table
  SELECT get_app_setting('edge_function_url') INTO function_url;
  SELECT get_app_setting('service_role_key') INTO service_role_key;
  
  -- Default values if not configured
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/refresh-whatsapp-groups';
  END IF;
  
  -- Replace manage-whatsapp-groups with refresh-whatsapp-groups in URL if needed
  function_url := REPLACE(function_url, 'manage-whatsapp-groups', 'refresh-whatsapp-groups');
  
  -- Only call if service role key is available
  IF service_role_key IS NOT NULL AND service_role_key != '' THEN
    -- Call the refresh edge function
    SELECT status INTO response_status
    FROM net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key,
        'apikey', service_role_key
      ),
      body := jsonb_build_object()
    );
    
    -- Log the result
    IF response_status != 200 THEN
      RAISE WARNING 'Refresh WhatsApp groups returned status: %', response_status;
    END IF;
  ELSE
    RAISE WARNING 'Service role key not configured. Please set it in app_settings table.';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to call refresh WhatsApp groups: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run on the 1st of each month at 00:00 UTC
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can use Supabase's cron jobs feature instead

-- Uncomment the following line if pg_cron is enabled:
-- SELECT cron.schedule(
--   'refresh-whatsapp-groups-monthly',
--   '0 0 1 * *', -- Run at 00:00 UTC on the 1st of every month
--   $$SELECT call_refresh_whatsapp_groups();$$
-- );

-- Alternative: Use Supabase's built-in cron jobs
-- Go to Database > Cron Jobs in Supabase dashboard and create:
-- Schedule: 0 0 1 * * (cron expression for 1st of month at 00:00 UTC)
-- SQL: SELECT call_refresh_whatsapp_groups();

-- 20260207000000_create_signal_updates.sql
-- =============================================================================
-- SIGNAL UPDATES: Store changes separately from initial signal data
-- On UPDATE to signals: store initial snapshot (first time only), then store
-- change diff. Create in-app notifications for each update.
-- =============================================================================

-- Table: signal_updates (history of changes per signal)
CREATE TABLE IF NOT EXISTS signal_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES signals(id) ON DELETE CASCADE,

  -- revision_type: 'initial' = snapshot when first update occurred; 'update' = one change set
  revision_type TEXT NOT NULL CHECK (revision_type IN ('initial', 'update')),

  -- For 'initial': snapshot of all tracked fields at creation (JSONB).
  -- For 'update': changes as { "field_name": { "old": value, "new": value }, ... }
  snapshot JSONB,
  changes JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signal_updates_signal_id ON signal_updates(signal_id);
CREATE INDEX IF NOT EXISTS idx_signal_updates_created_at ON signal_updates(signal_id, created_at DESC);

ALTER TABLE signal_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read signal updates for readable signals" ON signal_updates;
CREATE POLICY "Users can read signal updates for readable signals"
  ON signal_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM signals s
      WHERE s.id = signal_updates.signal_id
      AND (s.status = 'active' OR auth.uid() IS NOT NULL)
    )
  );

DROP POLICY IF EXISTS "Admins can read all signal updates" ON signal_updates;
CREATE POLICY "Admins can read all signal updates"
  ON signal_updates
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Allow trigger (SECURITY DEFINER) or admins to insert
DROP POLICY IF EXISTS "Allow insert signal updates" ON signal_updates;
CREATE POLICY "Allow insert signal updates"
  ON signal_updates
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()) OR current_setting('role', true) = 'service_role');

COMMENT ON TABLE signal_updates IS 'History of changes to signals; initial snapshot plus each update diff.';

-- Build changes JSONB from OLD and NEW for tracked columns
CREATE OR REPLACE FUNCTION build_signal_changes(OLD signals, NEW signals)
RETURNS JSONB AS $$
DECLARE
  ch JSONB := '{}'::jsonb;
BEGIN
  IF OLD.entry_price IS DISTINCT FROM NEW.entry_price THEN
    ch := ch || jsonb_build_object('entry_price', jsonb_build_object('old', OLD.entry_price, 'new', NEW.entry_price));
  END IF;
  IF OLD.stop_loss IS DISTINCT FROM NEW.stop_loss THEN
    ch := ch || jsonb_build_object('stop_loss', jsonb_build_object('old', OLD.stop_loss, 'new', NEW.stop_loss));
  END IF;
  IF (OLD.take_profit_1 IS DISTINCT FROM NEW.take_profit_1) OR (OLD.take_profit_1 IS NULL AND NEW.take_profit_1 IS NOT NULL) OR (OLD.take_profit_1 IS NOT NULL AND NEW.take_profit_1 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_1', jsonb_build_object('old', OLD.take_profit_1, 'new', NEW.take_profit_1));
  END IF;
  IF (OLD.take_profit_2 IS DISTINCT FROM NEW.take_profit_2) OR (OLD.take_profit_2 IS NULL AND NEW.take_profit_2 IS NOT NULL) OR (OLD.take_profit_2 IS NOT NULL AND NEW.take_profit_2 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_2', jsonb_build_object('old', OLD.take_profit_2, 'new', NEW.take_profit_2));
  END IF;
  IF (OLD.take_profit_3 IS DISTINCT FROM NEW.take_profit_3) OR (OLD.take_profit_3 IS NULL AND NEW.take_profit_3 IS NOT NULL) OR (OLD.take_profit_3 IS NOT NULL AND NEW.take_profit_3 IS NULL) THEN
    ch := ch || jsonb_build_object('take_profit_3', jsonb_build_object('old', OLD.take_profit_3, 'new', NEW.take_profit_3));
  END IF;
  IF OLD.title IS DISTINCT FROM NEW.title THEN
    ch := ch || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title));
  END IF;
  IF (OLD.analysis IS DISTINCT FROM NEW.analysis) OR (OLD.analysis IS NULL AND NEW.analysis IS NOT NULL) OR (OLD.analysis IS NOT NULL AND NEW.analysis IS NULL) THEN
    ch := ch || jsonb_build_object('analysis', jsonb_build_object('old', OLD.analysis, 'new', NEW.analysis));
  END IF;
  IF (OLD.confidence_level IS DISTINCT FROM NEW.confidence_level) OR (OLD.confidence_level IS NULL AND NEW.confidence_level IS NOT NULL) OR (OLD.confidence_level IS NOT NULL AND NEW.confidence_level IS NULL) THEN
    ch := ch || jsonb_build_object('confidence_level', jsonb_build_object('old', OLD.confidence_level, 'new', NEW.confidence_level));
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    ch := ch || jsonb_build_object('status', jsonb_build_object('old', OLD.status, 'new', NEW.status));
  END IF;
  IF OLD.trading_pair IS DISTINCT FROM NEW.trading_pair THEN
    ch := ch || jsonb_build_object('trading_pair', jsonb_build_object('old', OLD.trading_pair, 'new', NEW.trading_pair));
  END IF;
  IF OLD.signal_type IS DISTINCT FROM NEW.signal_type THEN
    ch := ch || jsonb_build_object('signal_type', jsonb_build_object('old', OLD.signal_type, 'new', NEW.signal_type));
  END IF;
  RETURN ch;
END;
$$ LANGUAGE plpgsql;

-- Snapshot of signal row as JSONB (for initial state)
CREATE OR REPLACE FUNCTION signal_row_to_snapshot(r signals)
RETURNS JSONB AS $$
BEGIN
  RETURN jsonb_build_object(
    'trading_pair', r.trading_pair,
    'signal_type', r.signal_type,
    'entry_price', r.entry_price,
    'stop_loss', r.stop_loss,
    'take_profit_1', r.take_profit_1,
    'take_profit_2', r.take_profit_2,
    'take_profit_3', r.take_profit_3,
    'title', r.title,
    'analysis', r.analysis,
    'confidence_level', r.confidence_level,
    'status', r.status,
    'created_at', r.created_at
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger: on UPDATE to signals, store initial snapshot (if first update) and store change diff; create notifications
CREATE OR REPLACE FUNCTION on_signal_updated_store_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  ch JSONB;
  is_first BOOLEAN;
  msg_text TEXT;
  title_text TEXT;
BEGIN
  ch := build_signal_changes(OLD, NEW);
  IF ch = '{}'::jsonb THEN
    RETURN NEW; -- no tracked changes
  END IF;

  -- Check if this is the first update for this signal
  SELECT NOT EXISTS (SELECT 1 FROM signal_updates WHERE signal_id = OLD.id LIMIT 1) INTO is_first;

  IF is_first THEN
    INSERT INTO signal_updates (signal_id, revision_type, snapshot, created_at)
    VALUES (OLD.id, 'initial', signal_row_to_snapshot(OLD), OLD.updated_at);
  END IF;

  INSERT INTO signal_updates (signal_id, revision_type, changes, created_at)
  VALUES (NEW.id, 'update', ch, TIMEZONE('utc'::text, NOW()));

  -- In-app notifications for users with push_signals
  title_text := '📝 Signal updated: ' || NEW.trading_pair;
  msg_text := 'SL/TP or details updated. Tap to view changes.';
  IF ch ? 'stop_loss' OR ch ? 'take_profit_1' OR ch ? 'take_profit_2' OR ch ? 'take_profit_3' THEN
    msg_text := 'Stop loss or take profit levels updated. Tap to view.';
  ELSIF ch ? 'entry_price' THEN
    msg_text := 'Entry price updated. Tap to view.';
  ELSIF ch ? 'status' THEN
    msg_text := 'Status: ' || (ch->'status'->>'old') || ' → ' || (ch->'status'->>'new');
  END IF;

  INSERT INTO notifications (user_id, notification_type, title, message, metadata)
  SELECT
    np.user_id,
    'signal',
    title_text,
    msg_text,
    jsonb_build_object(
      'signal_id', NEW.id,
      'trading_pair', NEW.trading_pair,
      'signal_type', NEW.signal_type,
      'updated', true,
      'changes', ch
    )
  FROM notification_preferences np
  WHERE np.push_signals = true;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'signal_updates trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_signal_updated_store_updates ON signals;
CREATE TRIGGER on_signal_updated_store_updates
  AFTER UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION on_signal_updated_store_and_notify();

COMMENT ON FUNCTION on_signal_updated_store_and_notify() IS 'Stores signal change history in signal_updates and creates in-app notifications';

-- 20260207100000_sync_auth_user_profiles.sql
-- Sync auth.users and user_profiles: backfill missing profiles and match data
-- 1. Ensure every auth.users row has a corresponding user_profiles row
-- 2. Backfill user_profiles.full_name and phone_number from auth.users.raw_user_meta_data where missing

-- Ensure full_name column exists (idempotent; add_full_name_to_user_profiles may have run)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Backfill: insert user_profiles for any auth.users that don't have one
INSERT INTO public.user_profiles (id, full_name, phone_number, created_at, updated_at)
SELECT
  u.id,
  TRIM(COALESCE(
    u.raw_user_meta_data->>'full_name',
    (COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
  ))::TEXT,
  NULLIF(TRIM(u.raw_user_meta_data->>'phone'::TEXT), ''),
  u.created_at,
  u.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Sync from auth to profile where profile fields are null (don't overwrite existing)
UPDATE public.user_profiles p
SET
  full_name = COALESCE(
    p.full_name,
    NULLIF(TRIM(
      COALESCE(u.raw_user_meta_data->>'full_name',
        (COALESCE(u.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(u.raw_user_meta_data->>'last_name', ''))
      )
    ), '')
  ),
  phone_number = COALESCE(NULLIF(TRIM(p.phone_number), ''), NULLIF(TRIM(u.raw_user_meta_data->>'phone'), '')),
  updated_at = TIMEZONE('utc'::text, NOW())
FROM auth.users u
WHERE u.id = p.id
  AND (
    (p.full_name IS NULL OR TRIM(p.full_name) = '')
    OR (p.phone_number IS NULL OR TRIM(p.phone_number) = '')
  );

-- 3. create_user_profile: on new signup, sync full_name and phone from auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  meta_full_name TEXT;
  meta_phone TEXT;
BEGIN
  meta_full_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    (COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
  )), '');
  meta_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  BEGIN
    INSERT INTO public.user_profiles (id, full_name, phone_number)
    VALUES (NEW.id, meta_full_name, meta_phone)
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
      phone_number = COALESCE(NULLIF(TRIM(user_profiles.phone_number), ''), EXCLUDED.phone_number),
      updated_at = TIMEZONE('utc'::text, NOW());
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Extend update_user_profile_on_signup to accept optional full_name (keeps auth and profile in sync)
-- Drop old 5-param version so the 6-param (full_name_param DEFAULT NULL) is the single definition
DROP FUNCTION IF EXISTS update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION update_user_profile_on_signup(
  user_id UUID,
  phone_number_param TEXT,
  phone_verified_param BOOLEAN DEFAULT true,
  whatsapp_notifications_param BOOLEAN DEFAULT true,
  email_notifications_param BOOLEAN DEFAULT true,
  full_name_param TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_profiles (id)
  VALUES (user_id)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.user_profiles
  SET
    phone_number = COALESCE(NULLIF(TRIM(phone_number_param), ''), phone_number),
    phone_verified = phone_verified_param,
    whatsapp_notifications_enabled = whatsapp_notifications_param,
    email_notifications_enabled = email_notifications_param,
    full_name = COALESCE(NULLIF(TRIM(full_name_param), ''), full_name),
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_profile_on_signup(UUID, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO anon;

-- 20260207120000_add_email_to_user_profiles.sql
-- Add email to user_profiles and sync from auth.users so admin/list views can show email
-- without relying on get_all_users_with_roles RPC (which reads auth.users).

-- 1. Add column
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Backfill from auth.users
UPDATE public.user_profiles p
SET
  email = u.email,
  updated_at = TIMEZONE('utc'::text, NOW())
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email <> u.email);

-- 3. create_user_profile: set email on new signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  meta_full_name TEXT;
  meta_phone TEXT;
BEGIN
  meta_full_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    (COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''))
  )), '');
  meta_phone := NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), '');

  BEGIN
    INSERT INTO public.user_profiles (id, full_name, phone_number, email)
    VALUES (NEW.id, meta_full_name, meta_phone, NEW.email)
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
      phone_number = COALESCE(NULLIF(TRIM(user_profiles.phone_number), ''), EXCLUDED.phone_number),
      email = COALESCE(NULLIF(TRIM(user_profiles.email), ''), NEW.email),
      updated_at = TIMEZONE('utc'::text, NOW());
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Error in create_user_profile for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Keep user_profiles.email in sync when auth.users.email changes (optional; may not be allowed on hosted Supabase)
CREATE OR REPLACE FUNCTION sync_user_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.user_profiles
    SET email = NEW.email, updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS sync_user_profile_email_trigger ON auth.users;
  CREATE TRIGGER sync_user_profile_email_trigger
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_profile_email();
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger on auth.users not created (may be restricted): %', SQLERRM;
END;
$$;

COMMENT ON COLUMN user_profiles.email IS 'Synced from auth.users for admin/list views; set on signup and backfill.';

-- 20260209100000_create_push_tokens.sql
-- Push tokens table for storing Expo push tokens per user/device
-- Used to send on-device push notifications via Expo Push API

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, expo_push_token)
);

CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_expo_push_token ON push_tokens(expo_push_token);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens (upsert flow)
CREATE POLICY "Users can update own push tokens"
  ON push_tokens FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own tokens (e.g. on logout)
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- Service role needs to read tokens when sending push (handled via service role client in Edge Function)
-- No SELECT policy for anon/authenticated on other users' tokens

COMMENT ON TABLE push_tokens IS 'Expo push tokens for on-device notifications; RLS restricts to own rows';

-- 20260209100001_trigger_push_on_notification.sql
-- Trigger to send push notification when a row is inserted into notifications.
-- Requires pg_net extension. Uses app.settings.service_role_key (same as other Edge triggers).

CREATE OR REPLACE FUNCTION trigger_send_push_for_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  function_url := current_setting('app.settings.push_edge_function_url', true);
  IF function_url IS NULL THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-push-for-notification';
  END IF;

  service_role_key := current_setting('app.settings.service_role_key', true);

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger push for notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_notification_created_send_push ON notifications;

CREATE TRIGGER on_notification_created_send_push
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_send_push_for_notification();

COMMENT ON FUNCTION trigger_send_push_for_notification() IS 'Invokes send-push-for-notification Edge Function via pg_net when a notification is inserted';

-- 20260210100000_fix_push_trigger_auth.sql
-- Fix 401 on send-push-for-notification: trigger must send a valid Bearer token.
-- Use app_settings via get_app_setting when called from a session that can read it (admin/service_role).
-- When notifications are created by SECURITY DEFINER triggers (create_signal_notifications etc.),
-- the inserting "session" is still the original user, so get_app_setting may return null due to RLS.
-- So we read from a dedicated table that only the trigger definer can read (no RLS), and fall back to
-- get_app_setting and current_setting for flexibility.

-- Table for push edge function auth (read by trigger definer only; RLS disabled so definer can read)
CREATE TABLE IF NOT EXISTS push_edge_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE push_edge_config DISABLE ROW LEVEL SECURITY;

-- Ensure only the table owner (and thus SECURITY DEFINER functions owned by same role) can use it
COMMENT ON TABLE push_edge_config IS 'Bearer token for invoking send-push-for-notification; set once via SQL. No RLS so trigger definer can read.';

-- Function that runs as definer and can read push_edge_config (and fallbacks)
CREATE OR REPLACE FUNCTION get_push_edge_bearer_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  bearer TEXT;
BEGIN
  -- 1) Prefer key stored in push_edge_config (readable by definer)
  SELECT value INTO bearer FROM push_edge_config WHERE key = 'bearer_key' LIMIT 1;
  IF bearer IS NOT NULL AND bearer <> '' THEN
    RETURN bearer;
  END IF;
  -- 2) Fallback: app_settings (works when caller is admin/service_role)
  bearer := get_app_setting('service_role_key');
  IF bearer IS NOT NULL AND bearer <> '' THEN
    RETURN bearer;
  END IF;
  -- 3) Fallback: PostgreSQL GUC (ALTER DATABASE / ALTER ROLE)
  bearer := current_setting('app.settings.service_role_key', true);
  RETURN COALESCE(bearer, '');
END;
$$;

COMMENT ON FUNCTION get_push_edge_bearer_key() IS 'Returns Bearer token for push Edge Function; used by trigger_send_push_for_notification. Set push_edge_config.bearer_key or app_settings.service_role_key or app.settings.service_role_key.';

-- Replace push trigger to use get_push_edge_bearer_key()
CREATE OR REPLACE FUNCTION trigger_send_push_for_notification()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  bearer_key TEXT;
BEGIN
  function_url := current_setting('app.settings.push_edge_function_url', true);
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/send-push-for-notification';
  END IF;

  bearer_key := get_push_edge_bearer_key();
  IF bearer_key IS NULL OR bearer_key = '' THEN
    RAISE WARNING 'Push trigger: no bearer key. Set push_edge_config (bearer_key) or app_settings.service_role_key or app.settings.service_role_key.';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer_key
    ),
    body := jsonb_build_object('notification_id', NEW.id::text)
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to trigger push for notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- One-time: insert placeholder so project can set the key (anon or service_role key from Dashboard → API)
INSERT INTO push_edge_config (key, value)
VALUES ('bearer_key', '')
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE push_edge_config IS 'Set value for key bearer_key to your Supabase anon or service_role key (Dashboard → API) so the push notification Edge Function can be invoked. Example: UPDATE push_edge_config SET value = ''eyJ...'' WHERE key = ''bearer_key'';';

-- =============================================================================
-- AFTER APPLYING THIS MIGRATION (required for push to work):
-- 1. In Supabase SQL Editor or Dashboard → Database → push_edge_config:
--    UPDATE push_edge_config SET value = '<your_anon_or_service_role_key>' WHERE key = 'bearer_key';
--    Get the key from: Dashboard → Project Settings → API → anon public (or service_role).
-- 2. Ensure the mobile app saves a push token: run the app on a physical device (not Expo Go),
--    log in, grant notification permission; check push_tokens table for a row for that user.
-- =============================================================================

-- 20260420100000_push_tokens_rls_select.sql
-- PostgREST upsert with resolution=merge-duplicates must SELECT existing rows to resolve
-- conflicts. Without a SELECT policy, authenticated clients get 42501 on upsert even when
-- INSERT/UPDATE policies exist (see push_tokens migration).

CREATE POLICY "Users can select own push tokens"
  ON push_tokens FOR SELECT
  USING (auth.uid() = user_id);

COMMENT ON POLICY "Users can select own push tokens" ON push_tokens IS
  'Required for client upsert; users may only read their own token rows.';

-- 20260421100000_trading_tips_and_tip_notifications.sql
-- Trading tips/quotes for mobile + daily push notifications
-- Requires: notification_preferences table, notifications table (existing)

-- ---------------------------------------------------------------------------
-- trading_tips: curated content; clients read active rows only
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trading_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  content_kind TEXT NOT NULL DEFAULT 'tip' CHECK (content_kind IN ('tip', 'quote')),
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trading_tips_active_sort ON trading_tips (active, sort_order, id);

ALTER TABLE trading_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read active trading tips"
  ON trading_tips FOR SELECT
  TO authenticated
  USING (active = true);

COMMENT ON TABLE trading_tips IS 'Daily rotatable trading tips and quotes; distributed via distribute-daily-tip Edge Function';

-- ---------------------------------------------------------------------------
-- Idempotency: one dispatch record per UTC calendar day
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trading_tip_daily_dispatch (
  dispatch_date DATE PRIMARY KEY,
  tip_id UUID NOT NULL REFERENCES trading_tips (id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE trading_tip_daily_dispatch ENABLE ROW LEVEL SECURITY;

-- No client access; service role / postgres only
COMMENT ON TABLE trading_tip_daily_dispatch IS 'Records UTC dates when daily tip notifications were sent';

-- ---------------------------------------------------------------------------
-- notifications: allow notification_type tip
-- ---------------------------------------------------------------------------
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN ('signal', 'event', 'announcement', 'system', 'tip'));

COMMENT ON TABLE notifications IS 'In-app notifications including signals, events, announcements, system, and daily tips';

-- ---------------------------------------------------------------------------
-- notification_preferences: push_tips (default on)
-- ---------------------------------------------------------------------------
ALTER TABLE notification_preferences
  ADD COLUMN IF NOT EXISTS push_tips BOOLEAN DEFAULT true;

UPDATE notification_preferences SET push_tips = true WHERE push_tips IS NULL;

-- ---------------------------------------------------------------------------
-- RPC: user IDs eligible for daily tip (opt-out via push_tips = false)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_user_ids_opted_in_daily_tips()
RETURNS TABLE (user_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id AS user_id
  FROM auth.users u
  LEFT JOIN notification_preferences np ON np.user_id = u.id
  WHERE COALESCE(np.push_tips, true) = true;
$$;

REVOKE ALL ON FUNCTION public.list_user_ids_opted_in_daily_tips() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_user_ids_opted_in_daily_tips() TO service_role;

COMMENT ON FUNCTION public.list_user_ids_opted_in_daily_tips() IS 'Users who should receive daily trading tip notifications';

-- ---------------------------------------------------------------------------
-- Seed tips and quotes (deterministic sort_order); idempotent if table empty
-- ---------------------------------------------------------------------------
INSERT INTO trading_tips (title, body, content_kind, sort_order, active)
SELECT v.title, v.body, v.ck::text, v.so, v.act
FROM (VALUES
  ('Risk per trade', 'Never risk more than 1–2% of your account on a single trade. Survival matters more than one winning setup.', 'tip', 1, true),
  ('Plan the trade', 'Define entry, stop, and targets before you click buy or sell. If you cannot explain the trade in one sentence, skip it.', 'tip', 2, true),
  ('Cut losses', 'Small losses are tuition. Large losses are career-ending. Honor your stop loss every time.', 'tip', 3, true),
  ('Journal everything', 'Track setups, emotions, and outcomes. Your journal is the only coach that never lies.', 'tip', 4, true),
  ('Correlations', 'EUR/USD and GBP/USD often move together. Size down when you are effectively doubling exposure.', 'tip', 5, true),
  ('News spikes', 'Major news can gap through stops. Reduce size or stand aside 15 minutes before high-impact releases.', 'tip', 6, true),
  ('Trend vs range', 'In a trend, buy pullbacks; in a range, fade extremes. Mixing the two is expensive.', 'tip', 7, true),
  ('Patience', 'The market pays you to wait for A+ setups. B and C setups look tempting because you are bored.', 'tip', 8, true),
  ('Leverage', 'High leverage does not create edge; it accelerates mistakes. Use the minimum that still lets you trade your plan.', 'tip', 9, true),
  ('Revenge trading', 'After a loss, step away. Revenge trades are where discipline dies.', 'tip', 10, true),
  ('Expectancy', 'A 40% win rate can be profitable with good reward-to-risk. Track expectancy, not win rate alone.', 'tip', 11, true),
  ('Position sizing', 'Size so that a normal stop loss feels boring, not scary. If it is scary, you are too large.', 'tip', 12, true),
  ('Mark Douglas', '“The best traders have developed a mindset that allows them to remain confident, yet still stay objective.”', 'quote', 13, true),
  ('Paul Tudor Jones', '“Don’t focus on making money; focus on protecting what you have.”', 'quote', 14, true),
  ('Jesse Livermore', '“The money is made by sitting, not trading.”', 'quote', 15, true),
  ('Van Tharp', '“Position sizing is the most important part of any trading system.”', 'quote', 16, true),
  ('Alexander Elder', '“The goal of a successful trader is to make the best trades. Money is secondary.”', 'quote', 17, true),
  ('Ed Seykota', '“Win or lose, everybody gets what they want out of the market.”', 'quote', 18, true),
  ('Ray Dalio', '“Pain + reflection = progress.”', 'quote', 19, true),
  ('Warren Buffett', '“Risk comes from not knowing what you are doing.”', 'quote', 20, true),
  ('Session overlap', 'London–New York overlap often has the cleanest liquidity. Know when you are trading quiet vs active hours.', 'tip', 21, true),
  ('Stop hunting', 'Retail clusters stops at obvious highs and lows. Expect liquidity grabs before real moves.', 'tip', 22, true),
  ('Higher time frame', 'Your entry may be on M15, but the bias should usually agree with H4 or D1. Fight the higher TF at your peril.', 'tip', 23, true),
  ('Consistency', 'One good month does not make a system. Aim for repeatable process, not one lucky streak.', 'tip', 24, true)
) AS v(title, body, ck, so, act)
WHERE NOT EXISTS (SELECT 1 FROM trading_tips LIMIT 1);

-- 20260421100001_schedule_distribute_daily_tip.sql
-- Schedule daily trading tip distribution (07:00 UTC) via pg_net.
-- Prerequisites: enable pg_cron and pg_net in Supabase Dashboard → Database → Extensions.
-- Uses same bearer resolution as push trigger (push_edge_config / app_settings / GUC).

CREATE OR REPLACE FUNCTION trigger_distribute_daily_tip_http()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  bearer_key TEXT;
BEGIN
  function_url := current_setting('app.settings.distribute_daily_tip_edge_function_url', true);
  IF function_url IS NULL OR function_url = '' THEN
    function_url := 'https://iurstpwtdnlmpvwyhqfn.supabase.co/functions/v1/distribute-daily-tip';
  END IF;

  bearer_key := get_push_edge_bearer_key();
  IF bearer_key IS NULL OR bearer_key = '' THEN
    RAISE WARNING 'distribute-daily-tip cron: no bearer key. Configure push_edge_config or app_settings.service_role_key.';
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || bearer_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

COMMENT ON FUNCTION trigger_distribute_daily_tip_http() IS 'POSTs to distribute-daily-tip Edge Function with service role bearer; scheduled 07:00 UTC';

DO $$
DECLARE
  jid bigint;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE WARNING 'pg_cron not enabled. Enable pg_cron or use Dashboard / external cron to POST .../functions/v1/distribute-daily-tip with Authorization: Bearer <service_role_key>';
    RETURN;
  END IF;

  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'distribute-daily-tip-utc' LIMIT 1;
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;

  PERFORM cron.schedule(
    'distribute-daily-tip-utc',
    '0 7 * * *',
    'SELECT trigger_distribute_daily_tip_http();'
  );
  RAISE NOTICE 'Cron job distribute-daily-tip-utc scheduled (07:00 UTC)';
END $$;

-- 20260421120000_trading_tips_admin_rls.sql
-- Allow admins to manage trading_tips (full CRUD + read inactive rows).
-- Non-admin authenticated users keep read access to active rows only (existing policy).

CREATE POLICY "Admins can read all trading tips"
  ON trading_tips FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert trading tips"
  ON trading_tips FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update trading tips"
  ON trading_tips FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete trading tips"
  ON trading_tips FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

COMMENT ON POLICY "Admins can read all trading tips" ON trading_tips IS 'Admin dashboard: list inactive and active tips';

-- 20260421130000_create_enquiries.sql
-- Enquiries table for Help & Support (timestamped so `supabase db push` applies it reliably)
CREATE TABLE IF NOT EXISTS enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  enquiry_type TEXT NOT NULL CHECK (enquiry_type IN ('general', 'trading', 'signals', 'course', 'mentorship', 'technical', 'billing', 'partnership', 'other')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enquiries_user_id ON enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiries_enquiry_type ON enquiries(enquiry_type);
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquiries_email ON enquiries(email);

CREATE OR REPLACE FUNCTION update_enquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_enquiries_updated_at ON enquiries;
CREATE TRIGGER update_enquiries_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_enquiries_updated_at();

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own enquiries" ON enquiries;
CREATE POLICY "Users can read their own enquiries"
  ON enquiries
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Anyone can insert enquiries" ON enquiries;
CREATE POLICY "Anyone can insert enquiries"
  ON enquiries
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own enquiries" ON enquiries;
CREATE POLICY "Users can update their own enquiries"
  ON enquiries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own enquiries" ON enquiries;
CREATE POLICY "Users can delete their own enquiries"
  ON enquiries
  FOR DELETE
  USING (auth.uid() = user_id);

-- 20260507200000_secure_event_registration_count.sql
-- Aggregate registration counts correctly for anon/authenticated clients (RLS hides other users' rows).
CREATE OR REPLACE FUNCTION public.get_event_registration_count(event_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.events WHERE id = event_uuid AND status = 'published') THEN
    RETURN 0;
  END IF;
  SELECT COUNT(*)::INTEGER INTO n
  FROM public.event_registrations
  WHERE event_id = event_uuid
    AND registration_status IN ('pending', 'confirmed');
  RETURN COALESCE(n, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.get_event_registration_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_event_registration_count(UUID) TO authenticated;

-- 20260608100000_create_missing_app_tables.sql
-- Tables referenced by the app but missing from prior migrations

CREATE TABLE IF NOT EXISTS broker_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  broker_account_id TEXT,
  telegram_username TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broker_verifications_user_id ON broker_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_broker_verifications_status ON broker_verifications(status);

ALTER TABLE broker_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own broker verifications" ON broker_verifications;
CREATE POLICY "Users can insert own broker verifications"
  ON broker_verifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own broker verifications" ON broker_verifications;
CREATE POLICY "Users can read own broker verifications"
  ON broker_verifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage broker verifications" ON broker_verifications;
CREATE POLICY "Admins can manage broker verifications"
  ON broker_verifications FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS user_course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);

ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own course enrollments" ON user_course_enrollments;
CREATE POLICY "Users can insert own course enrollments"
  ON user_course_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own course enrollments" ON user_course_enrollments;
CREATE POLICY "Users can read own course enrollments"
  ON user_course_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read all course enrollments" ON user_course_enrollments;
CREATE POLICY "Admins can read all course enrollments"
  ON user_course_enrollments FOR SELECT
  USING (is_admin(auth.uid()));

CREATE TABLE IF NOT EXISTS user_filters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page TEXT NOT NULL CHECK (page IN ('courses', 'events')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_filters_user_id ON user_filters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_filters_page ON user_filters(page);

ALTER TABLE user_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own filters" ON user_filters;
CREATE POLICY "Users can manage own filters"
  ON user_filters FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE broker_verifications IS 'Broker partnership verification requests (Trade With AllyTZ flow)';
COMMENT ON TABLE user_course_enrollments IS 'Course enrollment tracking for dashboard academy';
COMMENT ON TABLE user_filters IS 'Saved filter presets for courses and events pages';
COMMIT;
