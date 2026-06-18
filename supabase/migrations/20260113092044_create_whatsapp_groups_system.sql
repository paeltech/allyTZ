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
