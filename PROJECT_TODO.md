HIGH PRIORITY (Before Production)

□ Remove public register API
□ Prevent SUPER_ADMIN creation through API
□ Add role-specific user creation APIs
□ Add organization-level access control
□ Add input validation
□ Add rate limiting on login

# Immediate Next Tasks

- [ ] Create Booth Coordinator API
- [ ] Get Users By Organization
- [ ] Get User By ID
- [ ] Deactivate User
- [ ] Reset Password
- [ ] Booth Management Module

# Security Hardening (Before Production)

- [ ] Remove Public Register API
- [ ] Prevent SUPER_ADMIN Creation Via API
- [ ] Role-Specific User Creation APIs
- [ ] Organization-Level Access Restrictions
- [ ] Input Validation
- [ ] Rate Limiting On Login

Security Improvements

- [ ] Validate assigned coordinator exists
- [ ] Validate coordinator role is BOOTH_COORDINATOR
- [ ] Validate coordinator belongs to same organization

# Security Hardening Phase

## User Module

- [ ] Remove public register API
- [ ] Prevent SUPER_ADMIN creation via API
- [ ] Add input validation
- [ ] Add rate limiting

## Booth Module

- [ ] Validate assigned coordinator exists
- [ ] Validate coordinator role = BOOTH_COORDINATOR
- [ ] Validate coordinator belongs to same organization
- [ ] Prevent assigning inactive coordinators

## Election Module

- [ ] Prevent modifying COMPLETED elections
- [ ] Validate startDate < endDate

## Organization Module

- [ ] Organization-level access restrictions review

Turnout Module Improvements

- [ ] Restrict reportHour values
- [ ] Prevent duplicate turnout for same booth/hour