```mermaid
erDiagram
    USER {
        uuid id PK
        text email
        text password_hash
        timestamp created_at
    }

    GUEST {
        uuid id PK
        timestamp created_at
    }

    PERFORMANCE {
        uuid id PK
        text title
        text description
        timestamp created_at
    }

    VENUE {
        uuid id PK
        text name
        text address
        text city
        text website_url
        timestamp created_at
    }

    PERFORMANCE_SEASON {
        uuid id PK
        uuid performance_id FK
        uuid venue_id FK
        date start_date
        date end_date
        text poster_url
        timestamp created_at
    }

    PERSON {
        uuid id PK
        text name
    }

    PERFORMANCE_PERSON {
        uuid id PK
        uuid performance_id FK
        uuid person_id FK
        text role
    }

    EVALUATION {
        uuid id PK
        uuid user_id FK
        uuid guest_id FK
        uuid season_id FK
        numeric star_rating
        numeric like_rating
        text comment
        timestamp created_at
        timestamp updated_at
    }

    PERFORMANCE ||--o{ PERFORMANCE_SEASON : has
    PERFORMANCE ||--o{ PERFORMANCE_PERSON : creators
    PERSON ||--o{ PERFORMANCE_PERSON : contributes

    VENUE ||--o{ PERFORMANCE_SEASON : "takes place at"

    PERFORMANCE_SEASON ||--o{ EVALUATION : evaluated

    USER ||--o{ EVALUATION : writes
    GUEST ||--o{ EVALUATION : writes
