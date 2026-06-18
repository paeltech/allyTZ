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
