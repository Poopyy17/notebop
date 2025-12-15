## This is where all the current tables are listed.
## Update this if there is a new column or table to be inserted
## Use this for migration

## Boards Table
CREATE TABLE boards (
  id UUID PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  emoji VARCHAR(10) DEFAULT '📋',
  is_private BOOLEAN DEFAULT false,
  boards ADD COLUMN is_favorite BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

  -- Indexes
  CREATE INDEX idx_boards_user_id ON boards(user_id);
  CREATE INDEX idx_boards_is_private ON boards(is_private);

## Notes Table
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL,  -- references users_sync.id
  
  -- Quill content (Delta JSON format)
  content JSONB NOT NULL DEFAULT '{"ops":[]}',
  
  -- Position (relative to board dropzone top-left)
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  
  -- Styles (colorIndex maps to frontend palette, zIndex for stacking)
  styles JSONB NOT NULL DEFAULT '{"colorIndex": 0, "zIndex": 0}',
  
  -- Meta
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

  -- Indexes
  CREATE INDEX idx_notes_board_id ON notes(board_id);
  CREATE INDEX idx_notes_author_id ON notes(author_id);

## Users Table
CREATE TABLE users_sync (
  raw_json JSONB NOT NULL,
  id TEXT PRIMARY KEY GENERATED ALWAYS AS ((raw_json ->> 'id'::text)) STORED,
  name TEXT GENERATED ALWAYS AS ((raw_json ->> 'display_name'::text)) STORED,
  email TEXT GENERATED ALWAYS AS ((raw_json ->> 'primary_email'::text)) STORED,
  created_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (to_timestamp((trunc((((raw_json ->> 'signed_up_at_millis'::text))::bigint)::double precision) / (1000)::double precision))) STORED,
  updated_atTIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT users_sync_pkeyPRIMARY KEY(id),
);

  -- Indexes
  INDEXusers_sync_deleted_at_idx … USING BTREE (deleted_at);
  UNIQUE INDEXusers_sync_pkey … USING BTREE (id);

## Friendships Table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,  -- who sent the request
  addressee_id TEXT NOT NULL,  -- who received the request
  status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'accepted'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(requester_id, addressee_id)
);

-- Indexes
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);

## Functionality and NPM packages to be used
1. Drag and drop functionality
NPM Package:
-DND kit

2. Text Editor for notes
NPM Package:
-Quill

3. Custom note styles
NPM Package:
-Tailwindcss

---

## Design Decisions

### Notes
- **Content**: Stored as Quill Delta JSON format
- **Position**: X/Y coordinates relative to board dropzone (excludes header)
- **Size**: Fixed dimensions (hardcoded in frontend)
- **Colors**: 5-color palette, stored as index (0-4), theme-aware on frontend
- **Z-Index**: Most recently updated note is on top (stored in styles.zIndex)

### Permissions
- **Public boards**: Any authenticated user can post (except owner)
- **Private boards**: Only friends of owner can post (not owner)
- **Owner**: Implicit via boards.user_id (no separate role)
- **Author**: Implicit via notes.author_id (no separate role)

### Friendships
- **Flow**: User X sends request → pending → User Y accepts → accepted
- **Bidirectional check**: Query both (X→Y) and (Y→X) with status='accepted'

## Frontend Constants
- Note colors: `frontend/src/lib/note-colors.ts`
- Note size: Fixed (to be defined in frontend constants)
- Board dropzone: Measured via ResizeObserver, excludes header

---

## Friends Feature Spec

### Routes
| Route | Page | Description |
|-------|------|-------------|
| `/friends` | Friends Page | Search & Manage Friends (2 tabs) |
| `/user/:userId` | User Profile | View another user's boards |

### Friends Page (`/friends`)

#### Tab 1: Search
- Search bar: By name only, submit on Enter or click search icon
- Results: Grid of Profile Cards (excludes self)
- Empty state: "No users found"

#### Tab 2: Manage Friends
- **Friend Requests**: Incoming pending requests (Accept/Decline buttons)
- **Sent Requests**: Outgoing pending requests (Cancel option)
- **My Friends**: List of accepted friends (Remove Friend option, with filter/search)
- Empty states per section

### Profile Card Component
| Element | Description |
|---------|-------------|
| Profile picture | User avatar |
| Name | Display name |
| Action button | Dynamic based on relationship |
| Click action | Navigate to `/user/:userId` |

#### Action Button States
| Relationship | Button |
|--------------|--------|
| No relationship | "Add Friend" |
| You sent request (pending) | "Request Sent" / "Cancel" |
| They sent request (pending) | "Accept" / "Decline" |
| Already friends | "Friends ✓" / "Remove" |

### User Profile Page (`/user/:userId`)

#### Sidebar Changes (when viewing another user)
- Header: "[User X's name]'s Boards"
- Public Boards: Always visible
- Private Boards: Only visible if friends
- Hidden: Favorites, Trash, Settings
- NavSecondary: "Back to My Profile" button

#### Board Visibility & Posting Permissions
| Scenario | Can View | Can Post Notes |
|----------|----------|----------------|
| Public board, not friends | ✓ | ✓ |
| Public board, friends | ✓ | ✓ |
| Private board, not friends | ✗ | ✗ |
| Private board, friends | ✓ | ✓ |
| Own board (any) | ✓ | ✗ (owner can't post) |

#### Empty State
- If user has no public boards (and not friends): "This user has no public boards"