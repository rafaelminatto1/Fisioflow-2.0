---
inclusion: always
---

# Fisioflow 2.0 Product Guide

**Fisioflow 2.0** is a comprehensive physiotherapy clinic management system with multi-portal architecture serving therapists, patients, and partners.

## Domain Context
- **Healthcare Focus**: Physiotherapy and rehabilitation services
- **Compliance**: Brazilian LGPD data protection requirements
- **Multi-tenant**: Supports multiple clinics and therapist practices
- **Clinical Workflow**: Emphasizes evidence-based treatment documentation

## User Roles & Portals
- **Therapist Portal** (`/`): Primary interface for healthcare providers and clinic administrators
- **Patient Portal** (`/patient-portal`): Self-service interface for treatment tracking and engagement
- **Partner Portal** (`/partner-portal`): Interface for physical educators and external healthcare partners

## Core Business Entities
- **Patient**: Central entity with medical history, treatment plans, and progress tracking
- **Appointment**: Scheduling with recurrence patterns, therapist assignment, and session notes
- **Treatment Plan**: Clinical protocols with exercises, goals, and progress metrics
- **SOAP Notes**: Clinical documentation following medical standards
- **Exercise Library**: Categorized exercises with video demonstrations and protocols
- **Group Sessions**: Multi-patient therapy with gamification elements

## Key Business Rules
- All clinical data requires proper medical documentation
- Patient consent and privacy (LGPD) must be maintained
- Treatment plans require therapist approval and regular review
- Financial transactions follow Brazilian healthcare billing standards
- AI assistance supplements but never replaces clinical judgment

## Technical Conventions
- Use medical terminology consistently (e.g., "patient" not "user" in clinical contexts)
- Implement proper error handling for clinical data operations
- Ensure all forms validate medical data requirements
- Follow accessibility standards for healthcare applications
- Maintain audit trails for clinical actions

## AI Integration Guidelines
- AI suggestions are advisory only - require therapist validation
- Clinical AI responses must include disclaimers
- Economic AI focuses on practice optimization, not patient care decisions
- All AI interactions should be logged for compliance

## Data Sensitivity
- Patient medical data is highly sensitive - implement proper access controls
- Financial data requires secure handling and audit trails
- Clinical notes and assessments need version control and approval workflows
- Export/import functions must maintain data integrity and compliance