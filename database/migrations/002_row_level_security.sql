-- FisioFlow 2.0 Row Level Security Policies
-- This migration sets up comprehensive RLS policies for data protection and LGPD compliance

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION is_organization_member(user_uuid UUID, org_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_members 
    WHERE user_id = user_uuid 
    AND organization_id = org_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
  RETURN ARRAY(
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = user_uuid 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES TABLE POLICIES
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Therapists and admins can view profiles in their organizations
CREATE POLICY "Therapists can view organization profiles" ON profiles
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('therapist', 'admin') AND
    EXISTS (
      SELECT 1 FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      WHERE om1.user_id = auth.uid() 
      AND om2.user_id = profiles.id
      AND om1.is_active = true 
      AND om2.is_active = true
    )
  );

-- Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ORGANIZATIONS TABLE POLICIES
-- Organization members can view their organizations
CREATE POLICY "Members can view their organizations" ON organizations
  FOR SELECT USING (
    id = ANY(get_user_organizations(auth.uid()))
  );

-- Organization admins can update their organizations
CREATE POLICY "Admins can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
      AND is_active = true
    )
  );

-- System admins can insert organizations
CREATE POLICY "System admins can insert organizations" ON organizations
  FOR INSERT WITH CHECK (get_user_role(auth.uid()) = 'admin');

-- ORGANIZATION_MEMBERS TABLE POLICIES
-- Users can view memberships in their organizations
CREATE POLICY "Users can view organization memberships" ON organization_members
  FOR SELECT USING (
    organization_id = ANY(get_user_organizations(auth.uid()))
  );

-- Organization admins can manage memberships
CREATE POLICY "Admins can manage memberships" ON organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM organization_members 
      WHERE organization_id = organization_members.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('admin', 'owner')
      AND is_active = true
    )
  );

-- PATIENTS TABLE POLICIES
-- Patients can view their own data
CREATE POLICY "Patients can view own data" ON patients
  FOR SELECT USING (auth.uid() = id);

-- Patients can update their own data (limited fields)
CREATE POLICY "Patients can update own data" ON patients
  FOR UPDATE USING (auth.uid() = id);

-- Therapists can view patients in their organization
CREATE POLICY "Therapists can view organization patients" ON patients
  FOR SELECT USING (
    get_user_role(auth.uid()) IN ('therapist', 'admin') AND
    is_organization_member(auth.uid(), organization_id)
  );

-- Therapists can update patients in their organization
CREATE POLICY "Therapists can update organization patients" ON patients
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('therapist', 'admin') AND
    is_organization_member(auth.uid(), organization_id)
  );

-- Therapists can insert patients in their organization
CREATE POLICY "Therapists can insert patients" ON patients
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('therapist', 'admin') AND
    is_organization_member(auth.uid(), organization_id)
  );

-- THERAPISTS TABLE POLICIES
-- Therapists can view their own data
CREATE POLICY "Therapists can view own data" ON therapists
  FOR SELECT USING (auth.uid() = id);

-- Therapists can update their own data
CREATE POLICY "Therapists can update own data" ON therapists
  FOR UPDATE USING (auth.uid() = id);

-- Organization members can view therapists in their organization
CREATE POLICY "Members can view organization therapists" ON therapists
  FOR SELECT USING (
    is_organization_member(auth.uid(), organization_id)
  );

-- Admins can manage therapists in their organization
CREATE POLICY "Admins can manage therapists" ON therapists
  FOR ALL USING (
    get_user_role(auth.uid()) = 'admin' AND
    is_organization_member(auth.uid(), organization_id)
  );

-- APPOINTMENTS TABLE POLICIES
-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON appointments
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'patient' AND
    patient_id = auth.uid()
  );

-- Therapists can view their appointments
CREATE POLICY "Therapists can view own appointments" ON appointments
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'therapist' AND
    therapist_id = auth.uid()
  );

-- Organization members can view appointments in their organization
CREATE POLICY "Members can view organization appointments" ON appointments
  FOR SELECT USING (
    is_organization_member(auth.uid(), organization_id)
  );

-- Therapists can manage appointments in their organization
CREATE POLICY "Therapists can manage appointments" ON appointments
  FOR ALL USING (
    get_user_role(auth.uid()) IN ('therapist', 'admin') AND
    is_organization_member(auth.uid(), organization_id)
  );

-- AUDIT_LOGS TABLE POLICIES
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'admin' AND
    is_organization_member(auth.uid(), organization_id)
  );

-- System can insert audit logs (for triggers)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- ERROR_LOGS TABLE POLICIES
-- Admins can view error logs in their organization
CREATE POLICY "Admins can view error logs" ON error_logs
  FOR SELECT USING (
    get_user_role(auth.uid()) = 'admin' AND
    (organization_id IS NULL OR is_organization_member(auth.uid(), organization_id))
  );

-- System can insert error logs
CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Admins can update error logs (for resolution)
CREATE POLICY "Admins can update error logs" ON error_logs
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'admin' AND
    (organization_id IS NULL OR is_organization_member(auth.uid(), organization_id))
  );

-- NOTIFICATIONS TABLE POLICIES
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System and admins can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    (get_user_role(auth.uid()) = 'admin' AND is_organization_member(auth.uid(), organization_id))
  );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Try to get organization_id from the record
  IF TG_TABLE_NAME = 'profiles' THEN
    org_id := NULL; -- Profiles don't have direct organization_id
  ELSIF TG_TABLE_NAME = 'organizations' THEN
    org_id := COALESCE(NEW.id, OLD.id);
  ELSE
    org_id := COALESCE(NEW.organization_id, OLD.organization_id);
  END IF;

  INSERT INTO audit_logs (
    organization_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    org_id,
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_patients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON patients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_therapists_trigger
  AFTER INSERT OR UPDATE OR DELETE ON therapists
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_organization_members_trigger
  AFTER INSERT OR UPDATE OR DELETE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();