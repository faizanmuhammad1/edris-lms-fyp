# Edris LMS: Comprehensive System Diagrams

This document contains all the architectural, sequence, state, and structural diagrams for the Edris LMS platform, visualised using Mermaid.js.

## 1. Context and Architectural Diagrams

### 1.1 High-Level Context Diagram
```mermaid
flowchart LR
    Student((Student))
    Teacher((Teacher))
    Admin((Admin))

    LMS[Edris LMS Platform]

    PostgreSQL[(PostgreSQL)]
    Storage[(AWS S3 / Tigris)]
    Redis[(Redis Queue)]

    Stripe[Stripe Payment Gateway]
    Mux[Mux Video Streaming]
    Blockchain[Polygon Blockchain]
    AI[Fine-Tuned Model Engine]
    Resend[Resend Mail Service]

    Student -->|Learns, Pays| LMS
    Teacher -->|Uploads, Grades| LMS
    Admin -->|Moderates, Manages| LMS

    LMS <-->|Reads/Writes| PostgreSQL
    LMS -->|Stores Files| Storage
    LMS <-->|Checkout / Webhooks| Stripe
    LMS <-->|Creates Assets / Webhooks| Mux
    LMS -->|Issues Certificates| Blockchain
    LMS <-->|Generates Summaries & Auto-Grading| AI
    LMS -->|Sends Transactional Emails| Resend

    subgraph Transcription Microservice
        FastAPI[FastAPI Gateway]
        Worker[Whisper Worker]
        FastAPI --> Redis
        Worker --> Redis
    end

    LMS -->|Submits Video Job| FastAPI
    Worker -->|Webhook Call| LMS
    Worker -->|Downloads Video| Storage
```

### 1.2 Component Diagram (LMS Internals)
```mermaid
flowchart TD
    subgraph Frontend [Next.js React Client]
        PublicUI[Public Catalog UI]
        DashboardUI[Student Dashboard]
        TeacherUI[Teacher Portal]
        AdminUI[Admin Portal]
        VideoPlayer[Mux Video Player]
        RichText[Tiptap Editor]
    end

    subgraph Backend [Next.js Server API & Actions]
        AuthAction[Better-Auth Handling]
        CourseAction[Course & Enrollment Actions]
        WebhookAPI[Webhook Receivers]
        CertificateAPI[Web3 Issuer]
    end

    subgraph Storage & ORM
        Prisma[Prisma Client]
        PG[(PostgreSQL Database)]
    end

    PublicUI --> CourseAction
    DashboardUI --> VideoPlayer
    TeacherUI --> RichText
    AdminUI --> AuthAction

    AuthAction --> Prisma
    CourseAction --> Prisma
    WebhookAPI --> Prisma
    CertificateAPI --> Prisma

    Prisma <--> PG
```

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    user ||--o{ session : authenticates
    user ||--o{ enrollment : takes
    user ||--o{ assignment_submission : submits
    user ||--o{ support_ticket : raises/solves

    course ||--o{ enrollment : has
    course ||--o{ chapter : contains
    course ||--o{ cart_item : sold_as
    course ||--o{ certificate : issues

    chapter ||--o{ lesson : contains

    lesson ||--o{ lesson_attachment : includes
    lesson ||--o| quiz : features
    lesson ||--o| assignment : features
    lesson ||--o{ tutor_chat : contextualizes
    lesson ||--o{ lesson_progress : tracks

    quiz ||--o{ quiz_question : contains
    quiz_question ||--o{ quiz_option : provides
    user ||--o{ quiz_attempt : takes
    quiz_attempt ||--o{ quiz_answer : logs

    user {
        string id PK
        string email
        string role
        string stripeCustomerId
    }
    course {
        string id PK
        string title
        int price
        string status
    }
    lesson {
        string id PK
        string videoKey
        string muxAssetId
        string transcript
    }
    lesson_progress {
        string id PK
        boolean completed
        float watchPercentage
    }
```

---

## 3. Sequence Diagrams (Data Workflows)

### 3.1 Course Payment & Enrollment Flow
```mermaid
sequenceDiagram
    participant S as Student
    participant UI as Browser (Client)
    participant SA as Server Action (LMS)
    participant ST as Stripe
    participant DB as Postgres

    S->>UI: Clicks "Enroll Now"
    UI->>SA: Trigger checkout processing
    SA->>DB: Create Pending Enrollment
    SA->>ST: Create Stripe Checkout Session
    ST-->>SA: Returns Session URL
    SA-->>UI: Redirect user
    UI->>ST: Student pays with card
    ST-->>UI: Success redirect
    ST->>SA: Webhook: checkout.session.completed
    SA->>DB: Update Enrollment to Active
```

### 3.2 Video Processing & Transcription Flow
```mermaid
sequenceDiagram
    participant T as Teacher
    participant LMS as Edris Server
    participant AWS as S3 Storage
    participant MUX as Mux Interface
    participant TS as Transcription Microservice
    participant DB as Postgres
    participant AI as Fine-Tuned Model

    T->>LMS: Save Lesson (Video File)
    LMS->>AWS: Create Presigned URL
    LMS->>MUX: Ingest video URL for streaming
    LMS->>TS: POST /jobs (dispatch async transcription)
    TS-->>LMS: Queue Acknowledged
    LMS->>DB: Lesson muxStatus=preparing, transcription=queued
    
    MUX->>LMS: Webhook: video.asset.ready
    LMS->>DB: Update muxStatus=ready

    TS->>LMS: Webhook: Transcribed Payload
    LMS->>DB: Store Transcript (transcriptionStatus=completed)
    LMS->>AI: Send Transcript for Summary Generation
    AI-->>LMS: Return Summary JSON/Text
    LMS->>DB: Store videoSummary
```

### 3.3 Blockchain Certificate Issuance Flow
```mermaid
sequenceDiagram
    participant Student
    participant LMS
    participant Blockchain (Polygon)
    participant DB

    Student->>LMS: Achieves 100% Course Completion
    LMS->>DB: Verify Eligibility
    LMS->>LMS: Hash Payload (Ethers keccak256)
    LMS->>Blockchain: issueCertificate(UniqueId, PayloadHash)
    Blockchain-->>LMS: Returns Transaction Hash (Pending)
    LMS->>DB: Store Cert Pending Status + TxHash
    LMS->>Blockchain: Wait for 1 Network Block Conf.
    Blockchain-->>LMS: Confirmed (BlockNumber)
    LMS->>DB: Update Cert to Active
```

### 3.4 AI Tutor RAG Chat Flow
```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API as /api/tutor/chat
    participant DB
    participant AI as Fine-Tuned Model
    
    User->>Browser: Types chat question
    Browser->>API: POST prompt + current video timestamp
    API->>DB: Fetch Lesson Transcript & Course Metadata
    API->>API: Extract Context Window for timestamp
    API->>AI: Compose System Prompt (RAG logic) + User History
    AI-->>API: Stream tokens asynchronously (Response)
    API-->>Browser: React output (Server-Sent Events)
```

---

## 4. State Machine Diagrams

### 4.1 Lesson Video Status Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> UploadingToS3: Teacher Uploads File
    UploadingToS3 --> S3Saved: Upload Complete
    S3Saved --> MuxPreparing: Trigger Mux Creation
    MuxPreparing --> MuxReady: Webhook (Success)
    MuxPreparing --> MuxErrored: Webhook (Failure)
    MuxReady --> [*]
```

### 4.2 Transcription Pipeline Lifecycle
```mermaid
stateDiagram-v2
    [*] --> NOT_STARTED
    NOT_STARTED --> QUEUED: Microservice Acknowledges
    QUEUED --> PROCESSING: Worker Picks Queue Item
    PROCESSING --> COMPLETED: Webhook Callback Returns Data
    PROCESSING --> FAILED: Missing Audio / Whisper Crash
    COMPLETED --> [*]
```

### 4.3 Support Ticket Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Open
    Open --> InProgress: Admin/Teacher assigns ticket
    InProgress --> Resolved: Issue successfully addressed
    InProgress --> Escalated: Passed to higher admin authorization
    Escalated --> Resolved
    Resolved --> Closed: Ticket locked
    Closed --> [*]
```

### 4.4 Quiz Attempt Cheating Telemetry
```mermaid
stateDiagram-v2
    [*] --> Ongoing
    Ongoing --> Ongoing: Copy/Paste Attempt
    Ongoing --> Ongoing: Tab Switched / Blurred
    Ongoing --> Ongoing: DevTools Activated
    Ongoing --> Completed: Manual Submit
    Ongoing --> Completed: Timer Expired
    Completed --> [*] : Persist Telemetry Analytics
```
