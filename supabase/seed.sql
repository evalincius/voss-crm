-- Seed data: test user
-- The handle_new_user trigger auto-creates profile + workspace + membership

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Test User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  jsonb_build_object('sub', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'email', 'test@example.com'),
  'email',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  now(),
  now(),
  now()
);

-- ============================================================
-- D5 QA seed data
-- ============================================================

DO $$
DECLARE
  v_user_id  uuid := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  v_org_id   uuid;
BEGIN
  -- Look up the org created by the handle_new_user trigger
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found for test user';
  END IF;

  -- ========== PRODUCTS (3) ==========
  INSERT INTO products (id, organization_id, name, description, created_by) VALUES
    ('d5010001-0001-4000-a000-000000000001', v_org_id, 'Enterprise Plan', 'Full-featured enterprise subscription', v_user_id),
    ('d5010001-0001-4000-a000-000000000002', v_org_id, 'Starter Plan', 'Entry-level plan for small teams', v_user_id),
    ('d5010001-0001-4000-a000-000000000003', v_org_id, 'Add-on Analytics', 'Analytics add-on module', v_user_id);

  -- ========== PEOPLE (20) ==========
  INSERT INTO people (id, organization_id, full_name, email, phone, lifecycle, created_by) VALUES
    ('d5010002-0001-4000-a000-000000000001', v_org_id, 'Alice Johnson', 'alice@acme.com', '+1-555-0101', 'customer', v_user_id),
    ('d5010002-0001-4000-a000-000000000002', v_org_id, 'Bob Williams', 'bob@acme.com', '+1-555-0102', 'engaged', v_user_id),
    ('d5010002-0001-4000-a000-000000000003', v_org_id, 'Carol Martinez', 'carol@globex.com', '+1-555-0103', 'contacted', v_user_id),
    ('d5010002-0001-4000-a000-000000000004', v_org_id, 'David Brown', 'david@globex.com', '+1-555-0104', 'new', v_user_id),
    ('d5010002-0001-4000-a000-000000000005', v_org_id, 'Eva Chen', 'eva@initech.com', '+1-555-0105', 'customer', v_user_id),
    ('d5010002-0001-4000-a000-000000000006', v_org_id, 'Frank Lee', 'frank@initech.com', '+1-555-0106', 'engaged', v_user_id),
    ('d5010002-0001-4000-a000-000000000007', v_org_id, 'Grace Kim', 'grace@wayne.com', '+1-555-0107', 'contacted', v_user_id),
    ('d5010002-0001-4000-a000-000000000008', v_org_id, 'Henry Patel', 'henry@wayne.com', '+1-555-0108', 'new', v_user_id),
    ('d5010002-0001-4000-a000-000000000009', v_org_id, 'Iris Novak', 'iris@stark.com', '+1-555-0109', 'customer', v_user_id),
    ('d5010002-0001-4000-a000-000000000010', v_org_id, 'Jack Torres', 'jack@stark.com', '+1-555-0110', 'engaged', v_user_id),
    ('d5010002-0001-4000-a000-000000000011', v_org_id, 'Karen Wright', 'karen@umbrella.com', '+1-555-0111', 'contacted', v_user_id),
    ('d5010002-0001-4000-a000-000000000012', v_org_id, 'Leo Rivera', 'leo@umbrella.com', '+1-555-0112', 'new', v_user_id),
    ('d5010002-0001-4000-a000-000000000013', v_org_id, 'Mia Schmidt', 'mia@oscorp.com', '+1-555-0113', 'customer', v_user_id),
    ('d5010002-0001-4000-a000-000000000014', v_org_id, 'Noah Adams', 'noah@oscorp.com', '+1-555-0114', 'engaged', v_user_id),
    ('d5010002-0001-4000-a000-000000000015', v_org_id, 'Olivia Hughes', 'olivia@lexcorp.com', '+1-555-0115', 'contacted', v_user_id),
    ('d5010002-0001-4000-a000-000000000016', v_org_id, 'Paul Green', 'paul@lexcorp.com', '+1-555-0116', 'new', v_user_id),
    ('d5010002-0001-4000-a000-000000000017', v_org_id, 'Quinn Foster', 'quinn@daily.com', '+1-555-0117', 'customer', v_user_id),
    ('d5010002-0001-4000-a000-000000000018', v_org_id, 'Rachel Diaz', 'rachel@daily.com', '+1-555-0118', 'engaged', v_user_id),
    ('d5010002-0001-4000-a000-000000000019', v_org_id, 'Sam Murphy', 'sam@planet.com', '+1-555-0119', 'contacted', v_user_id),
    ('d5010002-0001-4000-a000-000000000020', v_org_id, 'Tina Reyes', 'tina@planet.com', '+1-555-0120', 'new', v_user_id);

  -- ========== TEMPLATES (10) ==========
  INSERT INTO templates (id, organization_id, title, category, status, body, created_by) VALUES
    ('d5010003-0001-4000-a000-000000000001', v_org_id, 'Cold Intro Email', 'cold_email', 'approved', 'Hi {{name}}, I wanted to reach out about...', v_user_id),
    ('d5010003-0001-4000-a000-000000000002', v_org_id, 'Follow-up Nudge', 'warm_outreach', 'approved', 'Just checking in on our previous conversation...', v_user_id),
    ('d5010003-0001-4000-a000-000000000003', v_org_id, 'Product Demo Invite', 'warm_outreach', 'approved', 'Would you be interested in a quick demo of...', v_user_id),
    ('d5010003-0001-4000-a000-000000000004', v_org_id, 'Newsletter Template', 'content', 'approved', 'This month in product updates...', v_user_id),
    ('d5010003-0001-4000-a000-000000000005', v_org_id, 'Offer Proposal', 'offer', 'approved', 'Based on our discussion, here is our proposal...', v_user_id),
    ('d5010003-0001-4000-a000-000000000006', v_org_id, 'Paid Ad Copy A', 'paid_ads', 'approved', 'Discover how our platform can help you...', v_user_id),
    ('d5010003-0001-4000-a000-000000000007', v_org_id, 'Paid Ad Copy B', 'paid_ads', 'draft', 'Transform your workflow with...', v_user_id),
    ('d5010003-0001-4000-a000-000000000008', v_org_id, 'Re-engagement Email', 'warm_outreach', 'draft', 'We noticed you haven''t logged in recently...', v_user_id),
    ('d5010003-0001-4000-a000-000000000009', v_org_id, 'Case Study Share', 'content', 'approved', 'See how {{company}} achieved 3x growth with...', v_user_id),
    ('d5010003-0001-4000-a000-000000000010', v_org_id, 'Archived Promo', 'cold_email', 'archived', 'Limited time offer on our...', v_user_id);

  -- ========== CAMPAIGNS (4) ==========
  INSERT INTO campaigns (id, organization_id, name, type, created_by) VALUES
    ('d5010004-0001-4000-a000-000000000001', v_org_id, 'Q1 Cold Outreach', 'cold_outreach', v_user_id),
    ('d5010004-0001-4000-a000-000000000002', v_org_id, 'Enterprise Warm Leads', 'warm_outreach', v_user_id),
    ('d5010004-0001-4000-a000-000000000003', v_org_id, 'Blog Content Push', 'content', v_user_id),
    ('d5010004-0001-4000-a000-000000000004', v_org_id, 'LinkedIn Ads Spring', 'paid_ads', v_user_id);

  -- ========== CAMPAIGN_PEOPLE (~30 memberships) ==========
  INSERT INTO campaign_people (id, organization_id, campaign_id, person_id, created_by) VALUES
    -- Q1 Cold Outreach: 10 people (new + contacted)
    ('d5010005-0001-4000-a000-000000000001', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000003', v_user_id),
    ('d5010005-0001-4000-a000-000000000002', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000004', v_user_id),
    ('d5010005-0001-4000-a000-000000000003', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000007', v_user_id),
    ('d5010005-0001-4000-a000-000000000004', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000008', v_user_id),
    ('d5010005-0001-4000-a000-000000000005', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000011', v_user_id),
    ('d5010005-0001-4000-a000-000000000006', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000012', v_user_id),
    ('d5010005-0001-4000-a000-000000000007', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000015', v_user_id),
    ('d5010005-0001-4000-a000-000000000008', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000016', v_user_id),
    ('d5010005-0001-4000-a000-000000000009', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000019', v_user_id),
    ('d5010005-0001-4000-a000-000000000010', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010002-0001-4000-a000-000000000020', v_user_id),
    -- Enterprise Warm Leads: 8 people (engaged + customer)
    ('d5010005-0001-4000-a000-000000000011', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000001', v_user_id),
    ('d5010005-0001-4000-a000-000000000012', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000002', v_user_id),
    ('d5010005-0001-4000-a000-000000000013', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000005', v_user_id),
    ('d5010005-0001-4000-a000-000000000014', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000006', v_user_id),
    ('d5010005-0001-4000-a000-000000000015', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000009', v_user_id),
    ('d5010005-0001-4000-a000-000000000016', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000010', v_user_id),
    ('d5010005-0001-4000-a000-000000000017', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000013', v_user_id),
    ('d5010005-0001-4000-a000-000000000018', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010002-0001-4000-a000-000000000014', v_user_id),
    -- Blog Content Push: 6 people
    ('d5010005-0001-4000-a000-000000000019', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000001', v_user_id),
    ('d5010005-0001-4000-a000-000000000020', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000005', v_user_id),
    ('d5010005-0001-4000-a000-000000000021', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000009', v_user_id),
    ('d5010005-0001-4000-a000-000000000022', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000013', v_user_id),
    ('d5010005-0001-4000-a000-000000000023', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000017', v_user_id),
    ('d5010005-0001-4000-a000-000000000024', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010002-0001-4000-a000-000000000018', v_user_id),
    -- LinkedIn Ads Spring: 6 people
    ('d5010005-0001-4000-a000-000000000025', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000003', v_user_id),
    ('d5010005-0001-4000-a000-000000000026', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000007', v_user_id),
    ('d5010005-0001-4000-a000-000000000027', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000011', v_user_id),
    ('d5010005-0001-4000-a000-000000000028', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000015', v_user_id),
    ('d5010005-0001-4000-a000-000000000029', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000019', v_user_id),
    ('d5010005-0001-4000-a000-000000000030', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010002-0001-4000-a000-000000000020', v_user_id);

  -- ========== CAMPAIGN_PRODUCTS ==========
  INSERT INTO campaign_products (id, organization_id, campaign_id, product_id, created_by) VALUES
    ('d5010006-0001-4000-a000-000000000001', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010001-0001-4000-a000-000000000002', v_user_id),
    ('d5010006-0001-4000-a000-000000000002', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010001-0001-4000-a000-000000000001', v_user_id),
    ('d5010006-0001-4000-a000-000000000003', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010001-0001-4000-a000-000000000003', v_user_id),
    ('d5010006-0001-4000-a000-000000000004', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010001-0001-4000-a000-000000000001', v_user_id),
    ('d5010006-0001-4000-a000-000000000005', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010001-0001-4000-a000-000000000002', v_user_id);

  -- ========== CAMPAIGN_TEMPLATES ==========
  INSERT INTO campaign_templates (id, organization_id, campaign_id, template_id, created_by) VALUES
    ('d5010007-0001-4000-a000-000000000001', v_org_id, 'd5010004-0001-4000-a000-000000000001', 'd5010003-0001-4000-a000-000000000001', v_user_id),
    ('d5010007-0001-4000-a000-000000000002', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010003-0001-4000-a000-000000000002', v_user_id),
    ('d5010007-0001-4000-a000-000000000003', v_org_id, 'd5010004-0001-4000-a000-000000000002', 'd5010003-0001-4000-a000-000000000003', v_user_id),
    ('d5010007-0001-4000-a000-000000000004', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010003-0001-4000-a000-000000000004', v_user_id),
    ('d5010007-0001-4000-a000-000000000005', v_org_id, 'd5010004-0001-4000-a000-000000000003', 'd5010003-0001-4000-a000-000000000009', v_user_id),
    ('d5010007-0001-4000-a000-000000000006', v_org_id, 'd5010004-0001-4000-a000-000000000004', 'd5010003-0001-4000-a000-000000000006', v_user_id);

  -- ========== TEMPLATE_PRODUCTS ==========
  INSERT INTO template_products (id, organization_id, template_id, product_id, created_by) VALUES
    ('d5010008-0001-4000-a000-000000000001', v_org_id, 'd5010003-0001-4000-a000-000000000001', 'd5010001-0001-4000-a000-000000000002', v_user_id),
    ('d5010008-0001-4000-a000-000000000002', v_org_id, 'd5010003-0001-4000-a000-000000000003', 'd5010001-0001-4000-a000-000000000001', v_user_id),
    ('d5010008-0001-4000-a000-000000000003', v_org_id, 'd5010003-0001-4000-a000-000000000005', 'd5010001-0001-4000-a000-000000000001', v_user_id),
    ('d5010008-0001-4000-a000-000000000004', v_org_id, 'd5010003-0001-4000-a000-000000000006', 'd5010001-0001-4000-a000-000000000002', v_user_id),
    ('d5010008-0001-4000-a000-000000000005', v_org_id, 'd5010003-0001-4000-a000-000000000009', 'd5010001-0001-4000-a000-000000000003', v_user_id);

  -- ========== DEALS (15) ==========
  -- 4 prospect, 3 offer_sent, 3 interested, 2 objection, 2 validated, 1 lost
  -- Some with next_step_at in near future; some with old created_at for stale deals testing
  INSERT INTO deals (id, organization_id, person_id, product_id, campaign_id, stage, value, currency, next_step_at, notes, created_by, created_at) VALUES
    -- Prospect (4) — 2 with future follow-ups, 2 stale (old created_at, no interactions)
    ('d5010009-0001-4000-a000-000000000001', v_org_id, 'd5010002-0001-4000-a000-000000000003', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000001', 'prospect', 15000, 'EUR', now() + interval '2 days', 'Initial call scheduled', v_user_id, now() - interval '3 days'),
    ('d5010009-0001-4000-a000-000000000002', v_org_id, 'd5010002-0001-4000-a000-000000000004', 'd5010001-0001-4000-a000-000000000002', NULL, 'prospect', 5000, 'EUR', now() + interval '5 days', 'Needs product info', v_user_id, now() - interval '2 days'),
    ('d5010009-0001-4000-a000-000000000003', v_org_id, 'd5010002-0001-4000-a000-000000000007', 'd5010001-0001-4000-a000-000000000001', NULL, 'prospect', 20000, 'EUR', NULL, 'Stale prospect', v_user_id, now() - interval '30 days'),
    ('d5010009-0001-4000-a000-000000000004', v_org_id, 'd5010002-0001-4000-a000-000000000008', 'd5010001-0001-4000-a000-000000000002', NULL, 'prospect', 4000, 'EUR', NULL, 'Very stale prospect', v_user_id, now() - interval '45 days'),
    -- Offer Sent (3) — 1 with follow-up, 1 stale
    ('d5010009-0001-4000-a000-000000000005', v_org_id, 'd5010002-0001-4000-a000-000000000002', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000002', 'offer_sent', 25000, 'EUR', now() + interval '1 day', 'Proposal sent, awaiting response', v_user_id, now() - interval '7 days'),
    ('d5010009-0001-4000-a000-000000000006', v_org_id, 'd5010002-0001-4000-a000-000000000006', 'd5010001-0001-4000-a000-000000000003', NULL, 'offer_sent', 8000, 'EUR', NULL, 'Sent analytics add-on offer', v_user_id, now() - interval '20 days'),
    ('d5010009-0001-4000-a000-000000000007', v_org_id, 'd5010002-0001-4000-a000-000000000010', 'd5010001-0001-4000-a000-000000000001', NULL, 'offer_sent', 18000, 'EUR', now() + interval '3 days', 'Follow-up demo scheduled', v_user_id, now() - interval '5 days'),
    -- Interested (3)
    ('d5010009-0001-4000-a000-000000000008', v_org_id, 'd5010002-0001-4000-a000-000000000001', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000002', 'interested', 30000, 'EUR', now() + interval '4 days', 'Very engaged, negotiating terms', v_user_id, now() - interval '14 days'),
    ('d5010009-0001-4000-a000-000000000009', v_org_id, 'd5010002-0001-4000-a000-000000000005', 'd5010001-0001-4000-a000-000000000002', NULL, 'interested', 6000, 'EUR', NULL, 'Interested in starter plan', v_user_id, now() - interval '10 days'),
    ('d5010009-0001-4000-a000-000000000010', v_org_id, 'd5010002-0001-4000-a000-000000000009', 'd5010001-0001-4000-a000-000000000003', NULL, 'interested', 12000, 'EUR', NULL, 'Considering analytics add-on', v_user_id, now() - interval '8 days'),
    -- Objection (2) — 1 stale
    ('d5010009-0001-4000-a000-000000000011', v_org_id, 'd5010002-0001-4000-a000-000000000011', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000004', 'objection', 22000, 'EUR', now() + interval '7 days', 'Price objection, preparing counter', v_user_id, now() - interval '12 days'),
    ('d5010009-0001-4000-a000-000000000012', v_org_id, 'd5010002-0001-4000-a000-000000000014', 'd5010001-0001-4000-a000-000000000002', NULL, 'objection', 5500, 'EUR', NULL, 'Feature gap concern', v_user_id, now() - interval '25 days'),
    -- Validated (2)
    ('d5010009-0001-4000-a000-000000000013', v_org_id, 'd5010002-0001-4000-a000-000000000013', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000002', 'validated', 35000, 'EUR', NULL, 'Contract signed!', v_user_id, now() - interval '30 days'),
    ('d5010009-0001-4000-a000-000000000014', v_org_id, 'd5010002-0001-4000-a000-000000000017', 'd5010001-0001-4000-a000-000000000002', NULL, 'validated', 7000, 'EUR', NULL, 'Onboarding started', v_user_id, now() - interval '20 days'),
    -- Lost (1)
    ('d5010009-0001-4000-a000-000000000015', v_org_id, 'd5010002-0001-4000-a000-000000000015', 'd5010001-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000001', 'lost', 16000, 'EUR', NULL, 'Went with competitor', v_user_id, now() - interval '15 days');

  -- ========== INTERACTIONS (30) ==========
  -- Mix of types; some with next_step_at; some linked to deals; distributed across people
  INSERT INTO interactions (id, organization_id, person_id, type, summary, next_step_at, occurred_at, deal_id, campaign_id, created_by) VALUES
    -- Recent interactions (active deals)
    ('d501000a-0001-4000-a000-000000000001', v_org_id, 'd5010002-0001-4000-a000-000000000003', 'call', 'Discovery call about Enterprise Plan', now() + interval '3 days', now() - interval '1 day', 'd5010009-0001-4000-a000-000000000001', 'd5010004-0001-4000-a000-000000000001', v_user_id),
    ('d501000a-0001-4000-a000-000000000002', v_org_id, 'd5010002-0001-4000-a000-000000000002', 'email', 'Sent proposal PDF', now() + interval '2 days', now() - interval '2 days', 'd5010009-0001-4000-a000-000000000005', 'd5010004-0001-4000-a000-000000000002', v_user_id),
    ('d501000a-0001-4000-a000-000000000003', v_org_id, 'd5010002-0001-4000-a000-000000000001', 'meeting', 'Negotiation meeting', now() + interval '5 days', now() - interval '3 days', 'd5010009-0001-4000-a000-000000000008', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000004', v_org_id, 'd5010002-0001-4000-a000-000000000010', 'dm', 'Quick DM about demo time', NULL, now() - interval '1 day', 'd5010009-0001-4000-a000-000000000007', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000005', v_org_id, 'd5010002-0001-4000-a000-000000000011', 'call', 'Discussed pricing concerns', now() + interval '6 days', now() - interval '4 days', 'd5010009-0001-4000-a000-000000000011', 'd5010004-0001-4000-a000-000000000004', v_user_id),
    -- Campaign outreach interactions
    ('d501000a-0001-4000-a000-000000000006', v_org_id, 'd5010002-0001-4000-a000-000000000004', 'email', 'Cold outreach - initial contact', NULL, now() - interval '5 days', NULL, 'd5010004-0001-4000-a000-000000000001', v_user_id),
    ('d501000a-0001-4000-a000-000000000007', v_org_id, 'd5010002-0001-4000-a000-000000000007', 'email', 'Cold email sent via campaign', NULL, now() - interval '28 days', NULL, 'd5010004-0001-4000-a000-000000000001', v_user_id),
    ('d501000a-0001-4000-a000-000000000008', v_org_id, 'd5010002-0001-4000-a000-000000000008', 'email', 'Introduction email', NULL, now() - interval '40 days', NULL, 'd5010004-0001-4000-a000-000000000001', v_user_id),
    ('d501000a-0001-4000-a000-000000000009', v_org_id, 'd5010002-0001-4000-a000-000000000012', 'email', 'Cold outreach attempt', NULL, now() - interval '6 days', NULL, 'd5010004-0001-4000-a000-000000000001', v_user_id),
    ('d501000a-0001-4000-a000-000000000010', v_org_id, 'd5010002-0001-4000-a000-000000000016', 'email', 'First touch email', NULL, now() - interval '3 days', NULL, 'd5010004-0001-4000-a000-000000000001', v_user_id),
    -- Warm outreach interactions
    ('d501000a-0001-4000-a000-000000000011', v_org_id, 'd5010002-0001-4000-a000-000000000005', 'call', 'Warm follow-up call', NULL, now() - interval '8 days', 'd5010009-0001-4000-a000-000000000009', 'd5010004-0001-4000-a000-000000000002', v_user_id),
    ('d501000a-0001-4000-a000-000000000012', v_org_id, 'd5010002-0001-4000-a000-000000000006', 'meeting', 'Analytics demo presentation', NULL, now() - interval '18 days', 'd5010009-0001-4000-a000-000000000006', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000013', v_org_id, 'd5010002-0001-4000-a000-000000000009', 'call', 'Check-in on analytics interest', now() + interval '10 days', now() - interval '5 days', 'd5010009-0001-4000-a000-000000000010', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000014', v_org_id, 'd5010002-0001-4000-a000-000000000013', 'meeting', 'Contract review meeting', NULL, now() - interval '32 days', 'd5010009-0001-4000-a000-000000000013', 'd5010004-0001-4000-a000-000000000002', v_user_id),
    ('d501000a-0001-4000-a000-000000000015', v_org_id, 'd5010002-0001-4000-a000-000000000014', 'email', 'Feature gap discussion', NULL, now() - interval '22 days', 'd5010009-0001-4000-a000-000000000012', NULL, v_user_id),
    -- Content/general interactions
    ('d501000a-0001-4000-a000-000000000016', v_org_id, 'd5010002-0001-4000-a000-000000000017', 'form_submission', 'Downloaded whitepaper', NULL, now() - interval '25 days', NULL, 'd5010004-0001-4000-a000-000000000003', v_user_id),
    ('d501000a-0001-4000-a000-000000000017', v_org_id, 'd5010002-0001-4000-a000-000000000018', 'form_submission', 'Webinar registration', NULL, now() - interval '10 days', NULL, 'd5010004-0001-4000-a000-000000000003', v_user_id),
    ('d501000a-0001-4000-a000-000000000018', v_org_id, 'd5010002-0001-4000-a000-000000000019', 'dm', 'LinkedIn message response', NULL, now() - interval '7 days', NULL, 'd5010004-0001-4000-a000-000000000004', v_user_id),
    ('d501000a-0001-4000-a000-000000000019', v_org_id, 'd5010002-0001-4000-a000-000000000020', 'email', 'Ad click follow-up', NULL, now() - interval '4 days', NULL, 'd5010004-0001-4000-a000-000000000004', v_user_id),
    -- Notes and misc
    ('d501000a-0001-4000-a000-000000000020', v_org_id, 'd5010002-0001-4000-a000-000000000001', 'note', 'Key decision maker at Acme', NULL, now() - interval '15 days', NULL, NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000021', v_org_id, 'd5010002-0001-4000-a000-000000000002', 'note', 'Prefers email communication', NULL, now() - interval '10 days', NULL, NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000022', v_org_id, 'd5010002-0001-4000-a000-000000000005', 'meeting', 'Product walkthrough', NULL, now() - interval '12 days', NULL, NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000023', v_org_id, 'd5010002-0001-4000-a000-000000000009', 'email', 'Sent case study', NULL, now() - interval '6 days', NULL, NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000024', v_org_id, 'd5010002-0001-4000-a000-000000000013', 'call', 'Onboarding kickoff', NULL, now() - interval '28 days', 'd5010009-0001-4000-a000-000000000013', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000025', v_org_id, 'd5010002-0001-4000-a000-000000000015', 'email', 'Final attempt before marking lost', NULL, now() - interval '16 days', 'd5010009-0001-4000-a000-000000000015', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000026', v_org_id, 'd5010002-0001-4000-a000-000000000017', 'call', 'Renewal discussion', now() + interval '14 days', now() - interval '18 days', 'd5010009-0001-4000-a000-000000000014', NULL, v_user_id),
    -- Interactions to make certain deals NOT stale
    ('d501000a-0001-4000-a000-000000000027', v_org_id, 'd5010002-0001-4000-a000-000000000001', 'email', 'Sent updated pricing', NULL, now() - interval '2 days', 'd5010009-0001-4000-a000-000000000008', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000028', v_org_id, 'd5010002-0001-4000-a000-000000000005', 'dm', 'Quick question about features', NULL, now() - interval '3 days', 'd5010009-0001-4000-a000-000000000009', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000029', v_org_id, 'd5010002-0001-4000-a000-000000000011', 'note', 'Preparing counter-proposal', NULL, now() - interval '2 days', 'd5010009-0001-4000-a000-000000000011', NULL, v_user_id),
    ('d501000a-0001-4000-a000-000000000030', v_org_id, 'd5010002-0001-4000-a000-000000000009', 'call', 'Final decision call', NULL, now() - interval '4 days', 'd5010009-0001-4000-a000-000000000010', NULL, v_user_id);

END $$;
