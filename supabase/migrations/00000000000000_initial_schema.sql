-- ============================================================================
-- Initial Schema Migration
-- Creates enums, tables, functions, triggers, and RLS policies
-- ============================================================================

-- ===================
-- 1. ENUMS
-- ===================

CREATE TYPE public.user_role AS ENUM ('admin', 'user');
CREATE TYPE public.organization_role AS ENUM ('owner', 'member');
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

-- ===================
-- 2. TABLES
-- ===================

-- 2.1 profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  current_organization_id UUID, -- FK added after organizations table
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2.2 organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2.3 FK: profiles.current_organization_id -> organizations.id
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_current_org_fk
  FOREIGN KEY (current_organization_id) REFERENCES organizations(id)
  ON DELETE SET NULL;

-- 2.4 organization_members
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 2.5 organization_invitations
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX org_invitations_pending_unique
  ON organization_invitations (organization_id, email) WHERE status = 'pending';

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- ===================
-- 3. HELPER FUNCTIONS
-- ===================

-- 3.1 user_organization_ids() — returns UUID[] of all orgs user belongs to
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(array_agg(om.organization_id), ARRAY[]::uuid[])
  FROM public.organization_members om WHERE om.user_id = auth.uid();
$$;

-- 3.2 user_current_organization_id() — returns user's active org UUID
CREATE OR REPLACE FUNCTION public.user_current_organization_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.current_organization_id FROM public.profiles p WHERE p.id = auth.uid();
$$;

-- ===================
-- 4. TRIGGER FUNCTIONS
-- ===================

-- 4.1 update_updated_at() — generic timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4.2 handle_new_user() — creates profile + workspace on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, user_name);

  new_org_id := gen_random_uuid();
  INSERT INTO public.organizations (id, name, slug, created_by) VALUES (
    new_org_id,
    user_name || '''s Workspace',
    lower(regexp_replace(user_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8),
    NEW.id
  );

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (new_org_id, NEW.id, 'owner');

  UPDATE public.profiles SET current_organization_id = new_org_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================
-- 5. RPC FUNCTIONS
-- ===================

-- 5.1 create_organization_with_membership()
CREATE OR REPLACE FUNCTION public.create_organization_with_membership(
  org_name TEXT,
  org_slug TEXT DEFAULT NULL,
  org_logo_url TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  new_org_id UUID;
  final_slug TEXT;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Generate slug if not provided
  IF org_slug IS NULL OR org_slug = '' THEN
    final_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]', '-', 'g'))
                  || '-' || substr(gen_random_uuid()::text, 1, 8);
  ELSE
    final_slug := org_slug;
  END IF;

  -- Create organization
  new_org_id := gen_random_uuid();
  INSERT INTO public.organizations (id, name, slug, logo_url, created_by)
  VALUES (new_org_id, org_name, final_slug, org_logo_url, current_user_id);

  -- Create owner membership
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (new_org_id, current_user_id, 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'id', new_org_id,
    'name', org_name,
    'slug', final_slug
  );
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization slug already exists');
END;
$$;

-- 5.2 validate_invitation_token()
CREATE OR REPLACE FUNCTION public.validate_invitation_token(invitation_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  inv RECORD;
BEGIN
  SELECT
    i.status,
    i.expires_at,
    i.role,
    o.name AS organization_name,
    p.full_name AS inviter_name
  INTO inv
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  LEFT JOIN public.profiles p ON p.id = i.invited_by
  WHERE i.token = invitation_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invitation token');
  END IF;

  IF inv.status != 'pending' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitation has already been ' || inv.status::text);
  END IF;

  IF inv.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invitation has expired');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'organization_name', inv.organization_name,
    'inviter_name', inv.inviter_name,
    'role', inv.role
  );
END;
$$;

-- 5.3 accept_invitation()
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_token TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  inv RECORD;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Lock the invitation row for update
  SELECT
    i.id,
    i.organization_id,
    i.role,
    i.status,
    i.expires_at,
    o.name AS organization_name
  INTO inv
  FROM public.organization_invitations i
  JOIN public.organizations o ON o.id = i.organization_id
  WHERE i.token = invitation_token
  FOR UPDATE OF i;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid invitation token');
  END IF;

  IF inv.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has already been ' || inv.status::text);
  END IF;

  IF inv.expires_at < now() THEN
    -- Mark as expired
    UPDATE public.organization_invitations SET status = 'expired' WHERE id = inv.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has expired');
  END IF;

  -- Create membership (ignore if already a member)
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (inv.organization_id, current_user_id, inv.role)
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- Mark invitation as accepted
  UPDATE public.organization_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = inv.id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', inv.organization_id,
    'organization_name', inv.organization_name
  );
END;
$$;

-- ===================
-- 6. RLS POLICIES
-- ===================

-- 6.1 profiles policies
CREATE POLICY "Users can view own profile and co-workers"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT om.user_id FROM public.organization_members om
      WHERE om.organization_id = ANY(public.user_organization_ids())
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 6.2 organizations policies
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (id = ANY(public.user_organization_ids()));

CREATE POLICY "Authenticated users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owners can update organizations"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete organizations"
  ON public.organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organizations.id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- 6.3 organization_members policies
CREATE POLICY "Members can view other members in their orgs"
  ON public.organization_members FOR SELECT
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "Owners can add members"
  ON public.organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can update member roles"
  ON public.organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can remove members or members can leave"
  ON public.organization_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- 6.4 organization_invitations policies
CREATE POLICY "Owners and invitees can view invitations"
  ON public.organization_invitations FOR SELECT
  USING (
    email = (SELECT p.email FROM public.profiles p WHERE p.id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can create invitations"
  ON public.organization_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can update invitations"
  ON public.organization_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

CREATE POLICY "Owners can delete invitations"
  ON public.organization_invitations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = organization_invitations.organization_id
        AND om.user_id = auth.uid()
        AND om.role = 'owner'
    )
  );

-- ===================
-- 7. GRANTS
-- ===================

GRANT EXECUTE ON FUNCTION public.validate_invitation_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_with_membership(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_organization_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_current_organization_id() TO authenticated;
