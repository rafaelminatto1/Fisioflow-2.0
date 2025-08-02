-- FisioFlow 2.0 Seed Data for Development
-- This migration creates sample data for development and testing

-- Insert sample organization
INSERT INTO organizations (id, name, cnpj, email, phone, address, settings) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Clínica FisioFlow Demo',
  '12.345.678/0001-90',
  'contato@fisioflowteste.com.br',
  '+55 11 99999-9999',
  '{
    "street": "Rua das Flores, 123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567",
    "country": "Brasil"
  }',
  '{
    "timezone": "America/Sao_Paulo",
    "language": "pt-BR",
    "businessHours": {
      "monday": {"start": "08:00", "end": "18:00"},
      "tuesday": {"start": "08:00", "end": "18:00"},
      "wednesday": {"start": "08:00", "end": "18:00"},
      "thursday": {"start": "08:00", "end": "18:00"},
      "friday": {"start": "08:00", "end": "17:00"},
      "saturday": {"start": "08:00", "end": "12:00"},
      "sunday": {"closed": true}
    },
    "appointmentDuration": 60,
    "allowOnlineBooking": true
  }'
);

-- Note: In a real application, user profiles would be created through Supabase Auth
-- These are example profiles that would exist after user registration

-- Sample profiles (these would normally be created via Supabase Auth)
-- Admin user
INSERT INTO profiles (id, role, first_name, last_name, phone, cpf, address, preferences) VALUES
(
  '123e4567-e89b-12d3-a456-426614174000',
  'admin',
  'Maria',
  'Silva',
  '+55 11 98765-4321',
  '123.456.789-00',
  '{
    "street": "Av. Paulista, 1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01310-100",
    "country": "Brasil"
  }',
  '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "theme": "light"
  }'
);

-- Therapist user
INSERT INTO profiles (id, role, first_name, last_name, phone, cpf, date_of_birth, address, preferences) VALUES
(
  '234e5678-e89b-12d3-a456-426614174001',
  'therapist',
  'João',
  'Santos',
  '+55 11 97654-3210',
  '234.567.890-11',
  '1985-03-15',
  '{
    "street": "Rua Augusta, 500",
    "neighborhood": "Consolação",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01305-000",
    "country": "Brasil"
  }',
  '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "notifications": {
      "email": true,
      "sms": true,
      "push": true
    },
    "theme": "light"
  }'
);

-- Patient user
INSERT INTO profiles (id, role, first_name, last_name, phone, cpf, date_of_birth, address, preferences) VALUES
(
  '345e6789-e89b-12d3-a456-426614174002',
  'patient',
  'Ana',
  'Costa',
  '+55 11 96543-2109',
  '345.678.901-22',
  '1990-07-22',
  '{
    "street": "Rua da Consolação, 200",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01302-000",
    "country": "Brasil"
  }',
  '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "notifications": {
      "email": true,
      "sms": false,
      "push": true
    },
    "theme": "light"
  }'
);

-- Partner user
INSERT INTO profiles (id, role, first_name, last_name, phone, cpf, date_of_birth, address, preferences) VALUES
(
  '456e7890-e89b-12d3-a456-426614174003',
  'partner',
  'Carlos',
  'Oliveira',
  '+55 11 95432-1098',
  '456.789.012-33',
  '1982-11-08',
  '{
    "street": "Rua Oscar Freire, 300",
    "neighborhood": "Jardins",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01426-000",
    "country": "Brasil"
  }',
  '{
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "notifications": {
      "email": true,
      "sms": true,
      "push": false
    },
    "theme": "dark"
  }'
);

-- Organization memberships
INSERT INTO organization_members (organization_id, user_id, role, permissions) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '123e4567-e89b-12d3-a456-426614174000',
  'owner',
  '{
    "canManageUsers": true,
    "canManageSettings": true,
    "canViewReports": true,
    "canManageAppointments": true,
    "canManagePatients": true
  }'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '234e5678-e89b-12d3-a456-426614174001',
  'member',
  '{
    "canManageUsers": false,
    "canManageSettings": false,
    "canViewReports": true,
    "canManageAppointments": true,
    "canManagePatients": true
  }'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '345e6789-e89b-12d3-a456-426614174002',
  'member',
  '{
    "canManageUsers": false,
    "canManageSettings": false,
    "canViewReports": false,
    "canManageAppointments": false,
    "canManagePatients": false
  }'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '456e7890-e89b-12d3-a456-426614174003',
  'member',
  '{
    "canManageUsers": false,
    "canManageSettings": false,
    "canViewReports": false,
    "canManageAppointments": false,
    "canManagePatients": false
  }'
);

-- Patient data
INSERT INTO patients (id, organization_id, medical_record_number, emergency_contact, medical_history, insurance_info, notes) VALUES
(
  '345e6789-e89b-12d3-a456-426614174002',
  '550e8400-e29b-41d4-a716-446655440000',
  'MR-2024-001',
  '{
    "name": "Pedro Costa",
    "relationship": "Esposo",
    "phone": "+55 11 94321-0987",
    "email": "pedro.costa@email.com"
  }',
  '{
    "allergies": ["Dipirona"],
    "medications": ["Ibuprofeno 600mg"],
    "conditions": ["Lombalgia crônica"],
    "surgeries": [],
    "familyHistory": ["Diabetes - Mãe", "Hipertensão - Pai"]
  }',
  '{
    "provider": "Unimed",
    "planNumber": "123456789",
    "validUntil": "2024-12-31",
    "coverage": "Fisioterapia - 20 sessões/ano"
  }',
  'Paciente com histórico de dor lombar há 2 anos. Trabalha em escritório, posição sentada prolongada.'
);

-- Therapist data
INSERT INTO therapists (id, organization_id, license_number, specialties, qualifications, schedule_settings) VALUES
(
  '234e5678-e89b-12d3-a456-426614174001',
  '550e8400-e29b-41d4-a716-446655440000',
  'CREFITO-12345',
  ARRAY['Ortopedia', 'Neurologia', 'Pilates'],
  '{
    "degree": "Fisioterapia - USP",
    "postGraduate": ["Especialização em Ortopedia - UNIFESP"],
    "certifications": ["Pilates Clínico", "Dry Needling"],
    "experience": "8 anos"
  }',
  '{
    "workingHours": {
      "monday": {"start": "08:00", "end": "18:00", "break": {"start": "12:00", "end": "13:00"}},
      "tuesday": {"start": "08:00", "end": "18:00", "break": {"start": "12:00", "end": "13:00"}},
      "wednesday": {"start": "08:00", "end": "18:00", "break": {"start": "12:00", "end": "13:00"}},
      "thursday": {"start": "08:00", "end": "18:00", "break": {"start": "12:00", "end": "13:00"}},
      "friday": {"start": "08:00", "end": "17:00", "break": {"start": "12:00", "end": "13:00"}},
      "saturday": {"start": "08:00", "end": "12:00"},
      "sunday": {"closed": true}
    },
    "appointmentDuration": 60,
    "bufferTime": 15,
    "maxAppointmentsPerDay": 8
  }'
);

-- Sample appointments
INSERT INTO appointments (organization_id, patient_id, therapist_id, title, description, start_time, end_time, status, appointment_type, location, notes) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '345e6789-e89b-12d3-a456-426614174002',
  '234e5678-e89b-12d3-a456-426614174001',
  'Consulta Inicial - Lombalgia',
  'Avaliação inicial para dor lombar crônica',
  '2024-01-15 09:00:00-03',
  '2024-01-15 10:00:00-03',
  'completed',
  'consultation',
  'Sala 1',
  'Paciente apresentou dor lombar 7/10 na escala EVA. Limitação funcional significativa.'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '345e6789-e89b-12d3-a456-426614174002',
  '234e5678-e89b-12d3-a456-426614174001',
  'Fisioterapia - Sessão 1',
  'Primeira sessão de fisioterapia para lombalgia',
  '2024-01-17 14:00:00-03',
  '2024-01-17 15:00:00-03',
  'completed',
  'therapy',
  'Sala 2',
  'Exercícios de mobilização e fortalecimento do core. Paciente respondeu bem ao tratamento.'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '345e6789-e89b-12d3-a456-426614174002',
  '234e5678-e89b-12d3-a456-426614174001',
  'Fisioterapia - Sessão 2',
  'Segunda sessão de fisioterapia para lombalgia',
  '2024-01-22 14:00:00-03',
  '2024-01-22 15:00:00-03',
  'scheduled',
  'therapy',
  'Sala 2',
  'Continuidade do protocolo de exercícios. Avaliar evolução da dor.'
);

-- Sample notifications
INSERT INTO notifications (organization_id, user_id, title, message, type, data) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  '345e6789-e89b-12d3-a456-426614174002',
  'Consulta Agendada',
  'Sua consulta foi agendada para 22/01/2024 às 14:00',
  'info',
  '{
    "appointmentId": "' || (SELECT id FROM appointments WHERE title = 'Fisioterapia - Sessão 2') || '",
    "type": "appointment_scheduled"
  }'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  '234e5678-e89b-12d3-a456-426614174001',
  'Novo Paciente',
  'Ana Costa foi adicionada como nova paciente',
  'info',
  '{
    "patientId": "345e6789-e89b-12d3-a456-426614174002",
    "type": "new_patient"
  }'
);

-- Create a function to generate more sample data if needed
CREATE OR REPLACE FUNCTION generate_sample_appointments(
  start_date DATE DEFAULT CURRENT_DATE,
  days_count INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  current_date DATE;
  appointment_count INTEGER := 0;
  hour_slot INTEGER;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= start_date + days_count LOOP
    -- Skip weekends for this example
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      -- Create appointments for working hours (9-17)
      FOR hour_slot IN 9..16 LOOP
        -- 50% chance of having an appointment in each slot
        IF random() > 0.5 THEN
          INSERT INTO appointments (
            organization_id,
            patient_id,
            therapist_id,
            title,
            description,
            start_time,
            end_time,
            status,
            appointment_type,
            location
          ) VALUES (
            '550e8400-e29b-41d4-a716-446655440000',
            '345e6789-e89b-12d3-a456-426614174002',
            '234e5678-e89b-12d3-a456-426614174001',
            'Fisioterapia - Sessão ' || (appointment_count + 1),
            'Sessão de fisioterapia para lombalgia',
            current_date + (hour_slot || ' hours')::INTERVAL,
            current_date + ((hour_slot + 1) || ' hours')::INTERVAL,
            CASE 
              WHEN current_date < CURRENT_DATE THEN 'completed'
              WHEN current_date = CURRENT_DATE THEN 'confirmed'
              ELSE 'scheduled'
            END,
            'therapy',
            'Sala ' || (1 + (appointment_count % 3))
          );
          appointment_count := appointment_count + 1;
        END IF;
      END LOOP;
    END IF;
    
    current_date := current_date + 1;
  END LOOP;
  
  RETURN appointment_count;
END;
$$ LANGUAGE plpgsql;

-- Uncomment the line below to generate sample appointments for the next 30 days
-- SELECT generate_sample_appointments();