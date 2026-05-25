# Broker Integration Role

Use this role whenever you add, refactor, or review a React surface that must be observable or controllable through the reusable Rust broker.

## Purpose
- The broker is a standalone Rust executable and must remain reusable across projects.
- React projects integrate with the broker through configuration, adapters, and command contracts.
- Broker integration must stay development-only unless a stronger security model is explicitly approved.

## Required Project Artifacts
- One broker config entry for the project.
- One project-level agent guide that explains how AI agents connect and investigate through the broker.
- One command registry or equivalent declaration for the project adapter.
- One documented log surface per target runtime.

## Mandatory Integration Rules
- Every important screen must expose broker-check read commands.
- Every form must expose field state and validation summary commands.
- Every data page must expose request state and cache state commands.
- Every button must have its own broker-check command or verification API.
- Do not rely on raw UI clicking as the only way to trigger investigation flows.
- Dangerous state mutation commands must be separated from read-only commands and explicitly gated.

## Configuration Rules
- Do not hardcode project-specific rules into the broker binary when configuration can express them.
- Each project must declare `project_id`, `shared_secret`, allowed targets, and allowed command classes.
- Shared secrets must not be committed as real production credentials.
- Release clients must be rejected when the broker is in `dev_only` mode.

## Protocol Rules
- The first socket message must be `register`.
- Route isolation is based on `project_id + session_id`.
- Agent clients send `command` messages.
- App clients send `response` and `event` messages.
- Every routed command must carry a stable `request_id`.
- Responses must be correlated by `request_id` and returned only to the originating agent.
- The broker must emit a timeout result when a pending command expires.

## Logging And Audit Rules
- The broker must append structured audit records for register, message, rejection, disconnect, and auth failure events.
- Timeout and pending-request cleanup events must also be audited.
- Audit records must include timestamp, project context, session context, source, and command classification when available.
- Project-level runtime logs must be documented alongside the broker integration so the agent knows where to read supporting evidence.

## Review Checklist
- Is the project integrated through config instead of broker forks?
- Does every button expose a broker-check command or verification API?
- Are read-only and dangerous commands clearly separated?
- Are development-only guards present and testable?
- Are log locations documented for web, desktop, and Android targets in scope?
