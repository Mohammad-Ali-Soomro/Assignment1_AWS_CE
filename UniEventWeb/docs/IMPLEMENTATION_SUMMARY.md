# UniEvent Phase 1 - Implementation Summary

## 1. Architectural Choices

This implementation follows a strict modular MVC-style structure:

- **Routes layer** receives HTTP requests and maps them to controllers.
- **Controller layer** handles request/response orchestration only.
- **Service layer** contains business logic for Ticketmaster fetch, image download, and S3 upload.
- **Model layer** normalizes external API payloads into internal event objects.
- **View layer (EJS)** renders user-facing event pages.
- **Configuration layer** centralizes environment parsing and validation.

This keeps concerns separated, makes modules testable, and supports future extension (scheduled jobs, persistence DB, additional providers).

## 2. Statelessness for Multi-Instance EC2

The app is designed to be stateless:

- No sticky sessions are required.
- No request-critical state is stored in local instance memory.
- Any instance behind an ALB can process any request.
- Event data is fetched on demand from Ticketmaster and image artifacts are externalized to S3.

This aligns with a private-subnet multi-EC2 architecture where instance failure should not break service continuity.

## 3. Data Flow (Ticketmaster -> Processing -> S3 -> User)

1. User requests `/events` or API sync endpoint.
2. `EventController` calls `EventSyncService`.
3. `EventSyncService` calls `TicketmasterService.fetchEvents()`.
4. `TicketmasterService` requests Ticketmaster Discovery API (`/events.json`) via `axios`.
5. Raw events are normalized by `EventModel` to required fields:
   - title
   - date
   - venue
   - description
   - image URL
6. For each event image:
   - image is downloaded as a buffer (`httpDownload` utility),
   - uploaded to S3 via `S3Service` using `@aws-sdk/client-s3`.
7. Response event object includes:
   - original normalized fields,
   - `s3ImageUrl` (if uploaded),
   - `s3ImageKey` (for private-bucket retrieval),
   - `displayImageUrl` (S3 URL fallback to original URL).
8. Before rendering EJS, the web controller generates pre-signed S3 GET URLs and passes them to the view as `signedImageUrl`.
9. Controller returns JSON or renders EJS view.

## 4. Ticketmaster Integration Details

- Base endpoint defaults to `https://app.ticketmaster.com/discovery/v2`.
- Events are requested from `/events.json`.
- Query params include API key, country code, classification, page size, and sort by date ascending.
- Parsing safely handles missing nested properties from Ticketmaster payload.

## 5. S3 Upload Design

- Uses `S3Client` from AWS SDK v3.
- No explicit credentials are provided in code.
- The AWS SDK default credential provider chain is used, enabling IAM role auth on EC2.
- Uses `@aws-sdk/s3-request-presigner` to generate temporary read URLs so private buckets remain private.
- Object keys are generated with:
  - configurable prefix,
  - event date segment,
  - slugified title,
  - random suffix to avoid collisions.

## 6. Health Checks

- Endpoint: `GET /health`
- Returns HTTP 200 with service status JSON.
- Suitable for ALB health check configuration.

## 7. Modular Directory Mapping

- `src/config`: env config and validation
- `src/models`: payload normalization model
- `src/services`: Ticketmaster, S3, sync orchestration, optional scheduler hook
- `src/controllers`: request handlers
- `src/routes`: route definitions (health, web events, API events)
- `src/views`: EJS templates
- `src/middlewares`: centralized error handling
- `src/utils`: low-level download helper

## 8. Scheduler Hook (Phase 1 Ready, Optional)

A scheduler module is included and controlled by env flags:

- `ENABLE_EVENT_SYNC_SCHEDULER`
- `EVENT_SYNC_INTERVAL_MINUTES`

This is intended as an optional hook for local/dev use. In scaled production, scheduled sync should typically be moved to an external scheduler (EventBridge + Lambda/ECS task or cron worker) to avoid duplicate work across multiple EC2 instances.

## 9. Security and Operational Notes

- AWS credentials are not hardcoded.
- Production should rely on IAM roles attached to compute.
- Avoid broad S3 public access; prefer CloudFront or controlled bucket policy.
- Error middleware returns stack traces only outside production.

## 10. Next Logical Phase (Beyond Phase 1)

- Persist normalized event metadata in a database (e.g., RDS/DynamoDB) to avoid repeated full sync per request.
- Add deduplication based on Ticketmaster event ID.
- Move periodic sync to external managed scheduler.
- Add structured logging and observability (CloudWatch metrics/alarms).
