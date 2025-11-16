# OpenConductor - Current System Architecture

> **Complete system overview showing how everything is wired together**

## 🏗️ **Overall System Architecture**

```mermaid
graph TB
    subgraph Frontend[Frontend - Next.js :3000]
        Homepage[Homepage<br/>BaseHub Aesthetic + npm Messaging]
        Discover[/discover - Server Browser]
        AdminDash[/admin - Admin Dashboard]
        AdminServers[/admin/servers - Server Management]
        AdminMarketing[/admin/marketing - Campaign Manager]
        AdminRoadmap[/admin/roadmap - 3-Month Tracker]
        EcoPages[Ecosystem Pages<br/>/vercel /supabase /v0 /basehub]
    end
    
    subgraph API[API Server - Express :3002]
        PublicAPI[/v1/servers - Public API]
        AdminAPI[/v1/admin - Admin API]
        Auth[Admin Auth Middleware]
        Routes[Server Routes]
    end
    
    subgraph Database[Database Layer]
        Supabase[(Supabase PostgreSQL<br/>✅ Connected)]
        Tables[(Tables:<br/>• mcp_servers<br/>• server_stats<br/>• api_keys<br/>• background_jobs)]
        Redis[(Redis Cache<br/>⚠️ Local/Optional)]
    end
    
    subgraph Workers[Background Workers]
        GitHubSync[GitHub Sync Worker<br/>⚠️ Credential Issues]
        JobProcessor[Background Job Processor<br/>✅ Active]
    end
    
    Frontend --> API
    API --> Database
    API --> Workers
    Auth --> Tables
    
    style Frontend fill:#e1f5fe
    style API fill:#f3e5f5
    style Database fill:#e8f5e8
    style Workers fill:#fff3e0
```

## 🔑 **Authentication & Admin Flow**

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant Browser as Browser
    participant Frontend as Frontend
    participant API as API Server
    participant DB as Database
    
    Admin->>Browser: Set admin API key in localStorage
    Admin->>Frontend: Visit /admin/servers
    Frontend->>API: Request with Authorization header
    API->>Auth: Validate admin API key
    Auth->>DB: Check api_keys table
    DB-->>Auth: Key valid + permissions
    Auth-->>API: Admin authenticated
    API->>DB: Query mcp_servers table
    DB-->>API: Server data
    API-->>Frontend: Server list + management interface
    Frontend-->>Admin: Server management UI
```

## 📦 **Server Management Workflow**

```mermaid
flowchart TD
    A[Admin adds new server] --> B[Fill server form]
    B --> C{Valid GitHub URL?}
    C -->|Yes| D[Auto-extract owner/repo]
    C -->|No| E[Show validation error]
    D --> F[Generate slug from name]
    F --> G[Auto-create CLI command]
    G --> H[Submit to API]
    H --> I[Admin auth check]
    I --> J[Validate data with Zod]
    J --> K[Insert into mcp_servers table]
    K --> L[Create server_stats entry]
    L --> M[Clear cache]
    M --> N[Server available for CLI install]
    
    style A fill:#e1f5fe
    style N fill:#e8f5e8
```

## 🎯 **Marketing Campaign System**

```mermaid
graph LR
    subgraph Templates[Campaign Templates]
        PH[Product Hunt Template]
        TW[Twitter Thread Template]
        LI[LinkedIn Template]
        PT[Partnership Template]
    end
    
    subgraph Campaigns[Active Campaigns]
        Launch[Saturday Launch Campaign]
        Social[Social Media Campaign]
        Partnership[Partnership Outreach]
    end
    
    subgraph Schedule[Launch Week Schedule]
        Sat[Sat: Product Hunt + npm messaging]
        Sun[Sun: Ecosystem integration]
        Mon[Mon: Stack workflows]
        Tue[Tue: Platform benefits]
        Wed[Wed: Metrics sharing]
        Thu[Thu: Partnership news]
        Fri[Fri: Strategic vision]
    end
    
    Templates --> Campaigns
    Campaigns --> Schedule
    
    style Templates fill:#f3e5f5
    style Campaigns fill:#e8f5e8
    style Schedule fill:#fff3e0
```

## 📊 **Database Schema Current State**

```mermaid
erDiagram
    mcp_servers {
        uuid id PK
        varchar slug UK
        varchar name
        varchar tagline
        text description
        varchar repository_url UK
        varchar repository_owner
        varchar repository_name
        varchar npm_package
        server_category category
        text_array tags
        text install_command
        jsonb config_example
        boolean verified
        boolean featured
        timestamptz created_at
        timestamptz updated_at
    }
    
    server_stats {
        uuid id PK
        uuid server_id FK
        integer github_stars
        integer github_forks
        integer cli_installs
        integer page_views
        decimal popularity_score
        decimal trending_score
        timestamptz updated_at
    }
    
    api_keys {
        uuid id PK
        varchar key_hash UK
        varchar name
        jsonb permissions
        integer rate_limit_per_hour
        boolean active
        timestamptz expires_at
        timestamptz last_used_at
    }
    
    background_jobs {
        uuid id PK
        varchar job_type
        jsonb payload
        varchar status
        integer attempts
        integer max_attempts
        text error
        timestamptz created_at
        timestamptz completed_at
    }
    
    mcp_servers ||--|| server_stats : has
    api_keys ||--o{ background_jobs : authenticates
```

## 🌐 **API Endpoints Currently Active**

```mermaid
graph LR
    subgraph PublicAPI[Public API - /v1/]
        Servers[/servers - List/search servers]
        Categories[/categories - Server categories]
        Stats[/stats - Platform statistics]
    end
    
    subgraph AdminAPI[Admin API - /v1/admin/]
        AdminServers[/servers - CRUD operations]
        AdminVerify[/servers/:id/verify]
        AdminFeature[/servers/:id/feature]
        AdminBulk[/servers/bulk-import]
        AdminStats[/stats - Admin dashboard]
    end
    
    subgraph Auth[Authentication]
        Anonymous[Anonymous - Rate limited]
        APIKey[API Key - Higher limits]
        AdminKey[Admin Key - Full access]
    end
    
    PublicAPI --> Anonymous
    PublicAPI --> APIKey
    AdminAPI --> AdminKey
    
    style PublicAPI fill:#e1f5fe
    style AdminAPI fill:#f3e5f5
    style Auth fill:#fff3e0
```

## 🚀 **Current Launch Status**

```mermaid
journey
    title OpenConductor Launch Readiness
    
    section Messaging
        Homepage: 5: Proven copy + BaseHub aesthetic
        README: 5: Strategic positioning
        Product Hunt: 5: npm-first messaging
    
    section Admin System
        API Key Generated: 5: Admin access ready
        Server Management: 5: Add/edit/delete servers
        Campaign Manager: 5: Launch content ready
        Database: 5: Supabase connected
    
    section Launch Prep
        Strategic Positioning: 5: Complete framework
        Integration Guides: 5: 4 ecosystem guides
        Partnership Templates: 5: Ready for outreach
        Roadmap Tracking: 5: 3-month dashboard
```

## ⚡ **Current System Status**

```mermaid
graph TD
    A[OpenConductor Platform] --> B{System Health Check}
    
    B --> C[✅ Frontend - Compiled & Running]
    B --> D[✅ API Server - Active on :3002]
    B --> E[✅ Database - Supabase Connected]
    B --> F[✅ Admin System - Functional]
    B --> G[⚠️ GitHub Sync - Credential Issues]
    B --> H[✅ Background Jobs - Processing]
    
    C --> I[Homepage + Admin Interface Working]
    D --> J[Public + Admin APIs Active]
    E --> K[Server CRUD Operations Working]
    F --> L[Add Servers + Marketing Campaigns]
    G --> M[Manual Server Management Still Works]
    H --> N[Analytics + Stats Processing]
    
    style A fill:#e1f5fe
    style I fill:#e8f5e8
    style J fill:#e8f5e8
    style K fill:#e8f5e8
    style L fill:#e8f5e8
    style M fill:#fff3e0
    style N fill:#e8f5e8
```

## 🎯 **Your Admin Control Panel**

**Database:** ✅ **Fully operational** - You can add servers that install in 3 commands  
**Admin Interface:** ✅ **Ready** - Complete server and marketing management  
**Launch Materials:** ✅ **Complete** - All messaging and campaigns prepared  
**Ecosystem Strategy:** ✅ **Implemented** - Progressive positioning framework active  

**Ready for Saturday launch with complete admin control!**