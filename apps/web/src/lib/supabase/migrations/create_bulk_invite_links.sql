-- Migration: Create bulk_invite_links table
-- Description: Table for storing bulk invitation links that allow multiple users to register

CREATE TABLE IF NOT EXISTS public.bulk_invite_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Link configuration
    token VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(100), -- Optional name for the link (e.g., "Invitación Equipo de Ventas")

    -- Limits and constraints
    max_uses INTEGER NOT NULL DEFAULT 100, -- Maximum number of registrations allowed
    current_uses INTEGER NOT NULL DEFAULT 0, -- Current number of registrations
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),

    -- Validity period
    expires_at TIMESTAMPTZ NOT NULL,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'expired', 'exhausted')),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_bulk_invite_links_token ON public.bulk_invite_links(token);

-- Index for organization queries
CREATE INDEX IF NOT EXISTS idx_bulk_invite_links_org ON public.bulk_invite_links(organization_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_bulk_invite_links_status ON public.bulk_invite_links(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bulk_invite_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_bulk_invite_links_updated_at ON public.bulk_invite_links;
CREATE TRIGGER trigger_bulk_invite_links_updated_at
    BEFORE UPDATE ON public.bulk_invite_links
    FOR EACH ROW
    EXECUTE FUNCTION update_bulk_invite_links_updated_at();

-- Function to auto-expire links
CREATE OR REPLACE FUNCTION check_bulk_invite_link_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if link has expired
    IF NEW.expires_at < NOW() AND NEW.status = 'active' THEN
        NEW.status = 'expired';
    END IF;

    -- Check if link has reached max uses
    IF NEW.current_uses >= NEW.max_uses AND NEW.status = 'active' THEN
        NEW.status = 'exhausted';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check status on update
DROP TRIGGER IF EXISTS trigger_check_bulk_invite_link_status ON public.bulk_invite_links;
CREATE TRIGGER trigger_check_bulk_invite_link_status
    BEFORE UPDATE ON public.bulk_invite_links
    FOR EACH ROW
    EXECUTE FUNCTION check_bulk_invite_link_status();

-- RLS Policies
ALTER TABLE public.bulk_invite_links ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins/owners can view their org's links
CREATE POLICY "Organization admins can view bulk invite links"
    ON public.bulk_invite_links
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.organization_id = bulk_invite_links.organization_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'owner')
        )
    );

-- Policy: Organization admins/owners can create links
CREATE POLICY "Organization admins can create bulk invite links"
    ON public.bulk_invite_links
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.organization_id = bulk_invite_links.organization_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'owner')
        )
    );

-- Policy: Organization admins/owners can update their org's links
CREATE POLICY "Organization admins can update bulk invite links"
    ON public.bulk_invite_links
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.organization_id = bulk_invite_links.organization_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'owner')
        )
    );

-- Policy: Organization admins/owners can delete their org's links
CREATE POLICY "Organization admins can delete bulk invite links"
    ON public.bulk_invite_links
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.organization_users ou
            WHERE ou.organization_id = bulk_invite_links.organization_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'owner')
        )
    );

-- Policy: Anyone can read active links by token (for registration page)
CREATE POLICY "Anyone can read active links by token"
    ON public.bulk_invite_links
    FOR SELECT
    USING (status = 'active' AND expires_at > NOW() AND current_uses < max_uses);

-- Table to track which users registered via bulk invite links
CREATE TABLE IF NOT EXISTS public.bulk_invite_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_invite_link_id UUID NOT NULL REFERENCES public.bulk_invite_links(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(bulk_invite_link_id, user_id)
);

-- Index for link registrations
CREATE INDEX IF NOT EXISTS idx_bulk_invite_registrations_link ON public.bulk_invite_registrations(bulk_invite_link_id);

-- RLS for registrations table
ALTER TABLE public.bulk_invite_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins can view registrations
CREATE POLICY "Organization admins can view bulk invite registrations"
    ON public.bulk_invite_registrations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.bulk_invite_links bil
            JOIN public.organization_users ou ON ou.organization_id = bil.organization_id
            WHERE bil.id = bulk_invite_registrations.bulk_invite_link_id
            AND ou.user_id = auth.uid()
            AND ou.role IN ('admin', 'owner')
        )
    );

-- Function to increment link usage when a user registers
CREATE OR REPLACE FUNCTION increment_bulk_invite_usage(p_token VARCHAR)
RETURNS UUID AS $$
DECLARE
    v_link_id UUID;
    v_org_id UUID;
BEGIN
    -- Get and lock the link
    SELECT id, organization_id INTO v_link_id, v_org_id
    FROM public.bulk_invite_links
    WHERE token = p_token
    AND status = 'active'
    AND expires_at > NOW()
    AND current_uses < max_uses
    FOR UPDATE;

    IF v_link_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Increment usage
    UPDATE public.bulk_invite_links
    SET current_uses = current_uses + 1
    WHERE id = v_link_id;

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION increment_bulk_invite_usage(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_bulk_invite_usage(VARCHAR) TO anon;

COMMENT ON TABLE public.bulk_invite_links IS 'Stores bulk invitation links for organizations';
COMMENT ON COLUMN public.bulk_invite_links.token IS 'Unique token used in the invitation URL';
COMMENT ON COLUMN public.bulk_invite_links.max_uses IS 'Maximum number of users that can register with this link';
COMMENT ON COLUMN public.bulk_invite_links.current_uses IS 'Number of users who have already registered';
COMMENT ON COLUMN public.bulk_invite_links.role IS 'Role assigned to users who register via this link';
