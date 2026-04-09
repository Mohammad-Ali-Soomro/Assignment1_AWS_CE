# Assignment 1: AWS Cloud Engineering - UniEvent Deployment
**Course:** Cloud Computing  
**Submitted by:** Mohammad Ali  
**Registration Number:** 2023326  
**Date:** April 2026  

---

![Uploading banner.png…]()



## Executive Summary

This report documents the complete implementation and deployment of the **UniEvent** web application on Amazon Web Services (AWS). The assignment required designing and deploying a scalable, highly available, and secure cloud architecture using AWS services including Virtual Private Cloud (VPC), Elastic Compute Cloud (EC2), Application Load Balancer (ALB), and Amazon S3. The solution demonstrates enterprise-grade cloud architecture principles with emphasis on network isolation, security-first design, and fault tolerance across multiple Availability Zones.

---

## Assignment Objectives

The primary objectives of this assignment were to:

1. Design and implement a custom VPC with public and private subnet architecture spanning multiple Availability Zones.
2. Deploy a Node.js application server within private subnets while maintaining secure internet connectivity through a public-facing load balancer.
3. Implement security best practices including Security Groups with principle of least privilege and IAM role-based access control.
4. Ensure high availability through multi-AZ deployment and automated load balancing.
5. Document the complete deployment methodology and troubleshooting approach.

---

## Architecture Design

### Infrastructure Overview

The deployed architecture follows the AWS Well-Architected Framework, implementing the following topology:

**Network Tier:**
- One Virtual Private Cloud (VPC) with CIDR block spanning 10.0.0.0/16
- Two Public Subnets (10.0.1.0/24 in ap-southeast-2a, 10.0.2.0/24 in ap-southeast-2b) for internet-facing resources
- Two Private Subnets (10.0.3.0/24 in ap-southeast-2a, 10.0.4.0/24 in ap-southeast-2b) for application servers
- Internet Gateway for inbound internet connectivity to public resources
- NAT Gateway deployed in public subnet to enable outbound connectivity from private instances

**Compute Tier:**
- Two t3.micro EC2 instances deployed in private subnets for application hosting
- Node.js runtime environment with npm package dependencies
- PM2 process manager for application lifecycle management

**Load Balancing Tier:**
- Application Load Balancer (ALB) deployed across both public subnets
- Target Group configured for health checks and traffic distribution to application servers
- HTTP listener on Port 80 for incoming traffic routing

**Storage Tier:**
- Amazon S3 bucket for storing application files and event poster assets
- IAM role-based access control for secure S3 access from compute instances

---

## Implementation Methodology

### Phase 1: Network Infrastructure Setup

The VPC and network foundation was established as follows:

1. **VPC Creation:** Provisioned a custom VPC with appropriate CIDR block allocation to support application scaling.
2. **Subnet Configuration:** Created two pairs of public and private subnets across two separate Availability Zones (AZs) to ensure geographic redundancy and high availability.
3. **Internet Connectivity:** Attached an Internet Gateway to the VPC and configured route tables:
   - Public subnets routed all outbound traffic (0.0.0.0/0) to the Internet Gateway
   - Private subnets routed all outbound traffic to the NAT Gateway
4. **NAT Gateway Setup:** Provisioned a NAT Gateway in the public subnet to enable private EC2 instances to initiate outbound connections to external APIs (Ticketmaster) while remaining unexposed to inbound internet traffic.

### Phase 2: Security Configuration

Security-first design principles were implemented through:

1. **ALB Security Group:**
   - Inbound Rule: Allow TCP Port 80 (HTTP) from 0.0.0.0/0 (any source)
   - No explicit outbound restrictions (default allow all)
   - Purpose: Receive internet HTTP requests and forward to backend servers

2. **EC2 Security Group:**
   - Inbound Rule: Allow TCP Port 3000 only from ALB Security Group (source restriction)
   - No inbound from internet directly
   - Purpose: Enforce that only the load balancer can reach application servers

3. **IAM Role Configuration:**
   - Attached AmazonS3FullAccess policy for read/write access to application files and event posters in S3
   - Attached AmazonSSMManagedInstanceCore policy to enable AWS Systems Manager Session Manager connectivity
   - Benefit: Eliminated reliance on SSH key pairs, providing secure shell access through AWS native mechanisms

### Phase 3: Primary Application Server Deployment

The initial EC2 instance was provisioned and configured as follows:

1. **Instance Launch:** Launched a t3.micro EC2 instance (named UniEvent-Server-1) in Private Subnet A
2. **Secure Access:** Established remote connection via AWS Systems Manager Session Manager without SSH keys
3. **Environment Setup:**
   - Installed Node.js runtime (LTS version)
   - Downloaded application source code and dependencies from S3
   - Executed npm install to resolve all required packages
4. **Application Startup:** Started the Node.js backend using PM2 process manager listening on port 3000
5. **Background Operation:** Configured PM2 to manage application lifecycle and restart on failure

### Phase 4: Load Balancing Configuration

The ALB was deployed to front-end the application servers:

1. **Target Group Creation:**
   - Protocol: HTTP on Port 3000
   - Health Check Configuration: Path /health, interval 30 seconds, 2 consecutive successes threshold
   - Registered UniEvent-Server-1 as initial target

2. **ALB Deployment:**
   - Deployed across both public subnets for redundancy
   - Listener Configuration: HTTP Port 80 → Forward to Target Group
   - Security Group: ALB Security Group (allowing Port 80)

3. **DNS Publishing:** ALB was assigned a DNS name for external access

### Phase 5: High Availability Implementation

To eliminate single points of failure:

1. **AMI Creation:** Generated an Amazon Machine Image (AMI) from the configured UniEvent-Server-1 instance, capturing the complete OS configuration and application setup
2. **Secondary Instance Launch:** Deployed UniEvent-Server-2 from the created AMI into Private Subnet B (different AZ)
3. **Target Group Registration:** Registered UniEvent-Server-2 with the existing Target Group alongside UniEvent-Server-1
4. **Traffic Distribution:** ALB now distributes incoming requests across both instances using round-robin algorithm
5. **Availability Guarantee:** Architecture now survives single AZ failure with uninterrupted service delivery

---

## Technical Challenges and Resolution

### Challenge 1: ALB Health Check Failures (HTTP 302 Redirect)

**Problem Description:**  
Once registered with the Target Group, the application targets were marked as "Unhealthy" despite the application responding to manual HTTP requests. ALB health checks were failing.

**Root Cause Analysis:**  
The Node.js application implements internal routing that issues HTTP 302 redirect responses for specific paths. The health check endpoint was returning a 302 response, which the Target Group's default configuration (only accepting HTTP 200) interpreted as a failure.

**Resolution Applied:**  
Modified the Target Group's advanced health check settings to accept both HTTP 200 (OK) and HTTP 302 (Redirect) as success responses. This allows health checks to pass while the application internally redirects as intended.

### Challenge 2: Application Offline After AMI Instance Launch

**Problem Description:**  
After creating the AMI and launching UniEvent-Server-2 from this image, both EC2 instances appeared healthy (AWS system checks passed) but the application process was not running.

**Root Cause Analysis:**  
The AMI creation process initiates a safe-reboot of the source instance to ensure data consistency. Since PM2 was not configured with startup/autostart hooks, the Node.js process did not restart automatically after the system reboot.

**Resolution Applied:**  
Accessed both instances via Session Manager and manually issued pm2 start app or equivalent command to restart the application processes. Both servers then returned to healthy status in the Target Group.

### Challenge 3: Browser Connection Timeout to ALB DNS

**Problem Description:**  
Initial attempts to access the ALB DNS endpoint resulted in browser timeout.

**Root Cause Analysis:**  
Modern browsers implement automatic HTTPS redirect behavior. The browser was attempting to connect to HTTPS (Port 443) by default, while the ALB listener was configured only for HTTP (Port 80). This mismatch caused connection refusal.

**Resolution Applied:**  
Explicitly specified the HTTP protocol in the URL (e.g., http://[alb-dns]/events) to bypass browser HTTPS forcing and correctly reach the HTTP-only listener. Application then loaded successfully.

---

## Deployment Results

### Successful Outcomes

1. **Dual-Instance Architecture:** Both EC2 instances are running UniEvent application in separate AZs
2. **Load Balancer Operational:** ALB successfully distributes HTTP traffic across both backend servers
3. **Security Compliance:** Network isolation enforced (public servers only in public subnets, application servers only in private subnets)
4. **High Availability:** System remains operational if one AZ experiences outage
5. **Automated Access:** Session Manager provides secure shell access without SSH key management
6. **API Integration:** Application successfully connects to Ticketmaster API via NAT Gateway

### Deployment Verification

- **Website Endpoint:** http://unievent-alb-1550279616.ap-southeast-2.elb.amazonaws.com/events
- **Status:** Fully operational with multi-AZ redundancy
- **Health Checks:** Both application instances showing healthy status in Target Group
- **Performance:** Load balancer successfully distributes requests across instances

---

## Repository Contents

The repository includes the following structure:

- **README.md** - Complete assignment documentation and deployment report
- **Screenshots.pdf** - AWS Management Console screenshots documenting architecture deployment
- **UniEventWeb/** - Application source code and web files
  - src/ - Application logic (controllers, routes, services, models, middleware)
  - public/ - Static assets and CSS stylesheets
  - views/ - EJS template files for web interface
  - config/ - Application configuration files
  - docs/ - Additional implementation documentation
  - package.json - Node.js dependencies and project metadata

---

## Conclusion

This assignment demonstrates successful implementation of a production-grade cloud architecture on AWS, meeting all specified objectives. The UniEvent application deployment incorporates industry best practices including network segmentation, least-privilege security, multi-AZ redundancy, and load-balanced traffic distribution. All technical challenges were systematically diagnosed and resolved through systematic troubleshooting and configuration adjustments.

The documented methodology provides a comprehensive reference architecture for deploying Node.js applications on AWS with high availability, security, and scalability requirements.

---

**Repository URL:** https://github.com/Mohammad-Ali-Soomro/Assignment1_AWS_CE
