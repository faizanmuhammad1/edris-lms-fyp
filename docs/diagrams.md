# Working Diagrams

This document contains architectural and workflow diagrams for the Edris LMS project, generated based on the current codebase.

## 1. High-Level System Architecture

This diagram shows the main components of the system and their interactions.

```mermaid
graph TD
    User[User / Client]
    Admin[Admin]
    
    subgraph "Next.js Application (Edris LMS)"
        UI[Frontend UI (React)]
        API[API Routes / Server Actions]
        Auth[Better Auth]
        Prisma[Prisma ORM]
    end
    
    subgraph "External Services"
        DB[(PostgreSQL Database)]
        Stripe[Stripe (Payments)]
        Arcjet[Arcjet (Security/Bot Protection)]
        S3[AWS S3 / Tigris (Object Storage)]
        Transcriber[Python Transcription Microservice]
        Blockchain[Polygon Blockchain]
    end

    User -->|HTTPS| UI
    Admin -->|HTTPS| UI
    
    UI -->|Server Actions| API
    API -->|Query| Prisma
    Prisma -->|SQL| DB
    
    API -->|Protect| Arcjet
    API -->|Auth| Auth
    
    API -->|Uploads| S3
    
    API -->|Checkout| Stripe
    Stripe -->|Webhook| API
    
    API -->|Submit Job| Transcriber
    Transcriber -->|Webhook| API
    Transcriber -->|Fetch Video| S3
    API -->|Issue Certificates| Blockchain
```

## 2. Database Schema (ERD)

This entity-relationship diagram represents the data models defined in `prisma/schema.prisma`.

```mermaid
erDiagram
    User ||--o{ Session : "has"
    User ||--o{ Account : "has"
    User ||--o{ Course : "created"
    User ||--o{ Enrollment : "enrolls"
    User ||--o{ LessonProgress : "tracks"
    User ||--o{ QuizAttempt : "attempts"
    User ||--o{ Certificate : "owns"
    User ||--|{ Cart : "has"

    Course ||--o{ Chapter : "contains"
    Course ||--o{ Enrollment : "has"
    Course ||--o{ Review : "received"
    Course ||--o{ Certificate : "awards"
    
    Chapter ||--o{ Lesson : "contains"
    
    Lesson ||--o{ LessonProgress : "tracked in"
    Lesson ||--o| Quiz : "has"
    Lesson ||--o{ Comment : "has"
    
    Quiz ||--o{ QuizQuestion : "contains"
    Quiz ||--o{ QuizAttempt : "has"
    
    QuizQuestion ||--o{ QuizOption : "has"
    
    QuizAttempt ||--o{ QuizAnswer : "contains"
    
    Enrollment }|--|| User : "linked to"
    Enrollment }|--|| Course : "linked to"
```

## 3. Authentication Flow

This diagram illustrates how user requests are protected and authenticated.

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant Arcjet
    participant BetterAuth
    participant DB

    Client->>Middleware: Request (e.g. /api/auth/sign-up)
    Middleware->>Arcjet: Analyse Request (IP, Email, Bot)
    
    alt Request Denied
        Arcjet-->>Middleware: Deny (403/429/400)
        Middleware-->>Client: Error Response
    else Request Allowed
        Arcjet-->>Middleware: Allow
        Middleware->>BetterAuth: Process Auth Request
        BetterAuth->>DB: CRUD User/Session
        DB-->>BetterAuth: Result
        BetterAuth-->>Client: Auth Session / Cookie
    end
```

## 4. Course Transcription Process

This diagram details the asynchronous transcription workflow involving the external Python microservice.

```mermaid
sequenceDiagram
    participant Teacher
    participant ServerAction as Server Action (transcribeCourse)
    participant DB
    participant Microservice as Python Service
    participant Webhook as Webhook Handler

    Teacher->>ServerAction: Trigger Transcription
    ServerAction->>DB: Fetch Course & Lessons
    
    loop For each untranscribed lesson
        ServerAction->>Microservice: POST /jobs (videoUrl, callbackUrl)
        activate Microservice
        Microservice-->>ServerAction: 200 OK (Job Accepted)
        deactivate Microservice
        ServerAction->>DB: Update Lesson -> QUEUED
    end
    
    ServerAction-->>Teacher: Success (Queued Count)
    
    par Async Processing
        Microservice->>Microservice: Process Video (Whisper/etc.)
        Microservice->>Webhook: POST /api/webhooks/transcription (Result)
        Webhook->>DB: Update Lesson -> COMPLETED + Transcript
    end
```

## 5. Payment & Reconciliation Flow

This diagram shows how Course and Cart purchases are handled via Stripe.

```mermaid
sequenceDiagram
    participant User
    participant App as App (Stripe Wrapper)
    participant Stripe
    participant Webhook as API (Webhook)
    participant DB
    participant SuccessPage as Payment Success Page

    User->>App: Click "Buy Now" / Checkout
    App->>Stripe: Create Checkout Session (metadata: userId, courseId/cart)
    Stripe-->>App: Session URL
    App-->>User: Redirect to Stripe Hosted Page
    
    User->>Stripe: Complete Payment
    Stripe->>App: Redirect to /payment/success
    
    par Webhook Verification (Reliable)
        Stripe->>Webhook: POST checkout.session.completed
        Webhook->>DB: Update Enrollment -> Active
        opt Cart Checkout
            Webhook->>DB: Clear User Cart
        end
        Webhook-->>Stripe: 200 OK
    and Client-Side Reconciliation (Fallback)
        App->>SuccessPage: Load Page
        SuccessPage->>DB: ReconcilePayment (Server Action)
        DB-->>SuccessPage: Success
    end
```

## 6. Admin Revenue Analytics

This diagram explains how revenue data is aggregated for the Admin Dashboard.

```mermaid
flowchart LR
    subgraph Database
        Enrollments[Enrollment Table]
    end
    
    subgraph AdminLogic [adminGetRevenueStats]
        Aggregation[DB Aggregation (Prisma)]
        Grouping[Data Grouping (JS)]
    end
    
    subgraph Dashboard
        StatsCards[Stats Cards]
        Chart[Revenue Chart]
    end
    
    Enrollments -->|Count & Sum (Active)| Aggregation
    Enrollments -->|Fetch Last 30 Days| Aggregation
    
    Aggregation -->|Raw Data| Grouping
    Grouping -->|Revenue Growth %| StatsCards
    Grouping -->|Daily Breakdown Map| Chart
```

## 7. Blockchain Certificate Issuance

This diagram illustrates the smart contract interaction for issuing immutable Web3 certificates upon course completion.

```mermaid
sequenceDiagram
    participant Student
    participant API as Server Action (LMS)
    participant Ethers as Ethers.js
    participant Polygon as Polygon Smart Contract
    participant DB as Postgres

    Student->>API: Triggers 100% Course Completion
    API->>DB: Verify 100% progress & eligibility
    API->>API: Generate unique Certificate ID & Hash
    API->>Ethers: Call issueCertificate(uuid, payloadHash)
    Ethers->>Polygon: Submit signed transaction
    Polygon-->>Ethers: Transaction Hash (Pending)
    Ethers-->>API: Returns TxHash
    API->>DB: Store Certificate (Pending + TxHash)
    API->>Ethers: wait() for Block Confirmation
    Ethers-->>API: Confirmed (Block Number)
    API->>DB: Update Certificate to Active
```
