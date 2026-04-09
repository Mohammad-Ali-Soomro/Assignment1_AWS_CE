# UniEvent (Phase 1)

UniEvent is a modular Node.js + Express web application that fetches university-relevant events from the Ticketmaster Discovery API, uploads event posters to Amazon S3, and displays events to users through a server-rendered EJS frontend.

When S3 buckets are private, the web layer generates pre-signed GET URLs so images can render securely without making the bucket public.

## 1) Prerequisites

- Node.js 18+ (recommended 20+)
- npm 9+
- AWS account with an S3 bucket
- Ticketmaster Discovery API key

## 2) Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   copy .env.example .env
   ```
3. Update `.env` values:
   - `TICKETMASTER_API_KEY`
   - `AWS_REGION`
   - `S3_BUCKET_NAME`
4. Run in development:
   ```bash
   npm run dev
   ```
5. Run in production mode:
   ```bash
   npm start
   ```

## 3) Endpoints

- `GET /health`
  - Health check endpoint for ALB/EC2 monitoring.
  - Returns HTTP 200 on success.

- `GET /events`
  - Fetches events from Ticketmaster.
  - Downloads event images and uploads them to S3.
  - Renders events in the EJS view.

- `GET /api/events`
  - Same sync flow as `/events`, returns JSON payload.

- `POST /api/events/sync`
  - Manually triggers sync flow and returns sync summary JSON.

## 4) Testing the Flow Locally

1. Open `http://localhost:3000/health` and confirm HTTP 200.
2. Open `http://localhost:3000/events`.
3. Verify event cards appear with title, date, venue, description, and image.
4. Check the configured S3 bucket for uploaded objects under `S3_EVENTS_PREFIX`.

## 5) AWS Deployment Notes (for later phase)

- Deploy app on multiple EC2 instances behind an Application Load Balancer.
- Use private subnets for EC2, with egress/NAT as needed for Ticketmaster API access.
- Attach an IAM role to EC2 instances granting minimum required S3 permissions.
- Do **not** set AWS credentials in `.env` for production.
- ALB health check path should point to `/health`.

## 6) Required S3 Permissions (IAM Role)

At minimum, allow:
- `s3:PutObject` on target bucket/prefix
- (Optional) `s3:GetObject` if application also needs to read back objects

If images must be publicly viewable directly via S3 URL, configure one of:
- Public bucket/prefix policy (careful with security scope), or
- CloudFront + Origin Access Control and serve through CloudFront URLs.

## 7) Project Structure

```text
src/
  app.js
  server.js
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/
  views/
public/
  css/
docs/
  IMPLEMENTATION_SUMMARY.md
```
