-- ==========================================
-- CyberGuard AI : Mock Data Seed
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Insert Mock Users
-- Note: In a real app, these would be created via a Supabase Auth Trigger when they sign up.
INSERT INTO public.users (id, email, full_name, role, readiness_score) 
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'kasun.perera@novatech.lk', 'Kasun Perera', 'Finance Manager', 72),
  ('22222222-2222-2222-2222-222222222222', 'sarah.t@novatech.lk', 'Sarah T.', 'HR Officer', 65)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Coach Agent Learning Profiles
INSERT INTO public.user_learning_profile (user_id, next_difficulty, next_focus, avoid_type, tactic_to_target)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'medium', 'phishing', 'BEC-email', 'urgency+authority'),
  ('22222222-2222-2222-2222-222222222222', 'beginner', 'credential_theft', 'sms-phishing', 'curiosity')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Insert Mock Scenarios
INSERT INTO public.scenarios (id, difficulty, target_role, threat_type, content)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'medium', 'Finance Manager', 'BEC', 
   '{"sender_name": "David Chen", "sender_email": "ceo@novatech-global.com", "subject": "Urgent Wire Transfer", "body": "Kasun, I need you to process this wire transfer immediately for the new acquisition. Do not tell anyone else yet."}'),
  ('44444444-4444-4444-4444-444444444444', 'beginner', 'HR Officer', 'Phishing', 
   '{"sender_name": "IT Helpdesk", "sender_email": "support@novatech-it.com", "subject": "Action Required: Update Password", "body": "Your Office365 password expires in 2 hours. Click here to retain your access."}')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Mock Decisions (For the HITL Admin Dashboard)
INSERT INTO public.decisions (id, user_id, scenario_id, chosen_action, reasoning, is_safe, human_review_required, evaluation)
VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 
   'Ignored the email', 'I shouted across the room to David and he said he didn''t send it, so I just ignored it.',
   false, true, 
   '{"confidence": 61, "reason_for_escalation": "Policy ambiguity regarding physical verification", "evidence": [{"type": "positive", "text": "Did not comply with request."}, {"type": "negative", "text": "Did not report to IT."}]}'),
  
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 
   'Replied to sender', 'I replied asking them to verify their employee ID before I process the bank account change.',
   false, true, 
   '{"confidence": 54, "reason_for_escalation": "Conflicting behavioral signals", "evidence": [{"type": "positive", "text": "Attempted verification"}, {"type": "negative", "text": "Replied to attacker"}]}')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Mock RAG Knowledge (Empty Embeddings for now, just to show data exists)
INSERT INTO public.org_knowledge (category, content, metadata)
VALUES
  ('policy', 'Payment requests must be verified using an independent communication channel.', '{"id": "FIN-SEC-04", "title": "Payment Verification"}'),
  ('policy', 'Do not verify suspicious requests using the same channel the request arrived on.', '{"id": "HR-SEC-02", "title": "Identity Verification"}');

INSERT INTO public.cyber_threats (category, source, content, metadata)
VALUES
  ('threat_definition', 'FBI IC3', 'Business Email Compromise (BEC) is a scam targeting businesses working with foreign suppliers and/or businesses that regularly perform wire transfer payments.', '{"url": "ic3.gov/AnnualReport"}');

INSERT INTO public.cyber_training (category, source, content, metadata)
VALUES
  ('best_practice', 'NCSC', 'Always verify urgent financial requests using a known, trusted secondary channel (e.g. phone call to known number).', '{"topic": "Verification"}');
