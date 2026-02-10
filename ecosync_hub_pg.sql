-- EcoSync Hub - Complete PostgreSQL Database Schema
-- Synchronized with MySQl.sql structure (February 2026 version)
-- PostgreSQL 14+ compatible

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- =============================================================================
-- DROP EXISTING TABLES (safe re-run)
-- =============================================================================

DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS saved_posts CASCADE;
DROP TABLE IF EXISTS post_tags CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS user_follows CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS seller_stats CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_quizzes CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS carbon_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_comments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS reels CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS upazilas CASCADE;
DROP TABLE IF EXISTS districts CASCADE;

-- =============================================================================
-- 1. GEOGRAPHY (Bangladesh)
-- =============================================================================

CREATE TABLE districts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    division VARCHAR(100) NOT NULL,
    bn_name VARCHAR(100),
    code VARCHAR(10) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE upazilas (
    id BIGSERIAL PRIMARY KEY,
    district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bn_name VARCHAR(100),
    code VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 2. USERS
-- =============================================================================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    display_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    gender VARCHAR(20) CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
    birth_date DATE,
    bio TEXT,
    profile_picture VARCHAR(500),
    cover_photo VARCHAR(500),
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    upazila_id BIGINT REFERENCES upazilas(id) ON DELETE SET NULL,
    eco_points BIGINT DEFAULT 0,
    carbon_saved_kg DECIMAL(12,2) DEFAULT 0.00,
    trees_planted INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    follower_count BIGINT DEFAULT 0,
    following_count BIGINT DEFAULT 0,
    friend_count BIGINT DEFAULT 0,
    last_active_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'moderator', 'admin')),
    last_seen TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_sessions_user_token ON user_sessions(user_id, session_token);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_active ON users(role, is_active);

-- =============================================================================
-- 3. SOCIAL CONTENT
-- =============================================================================

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'photo', 'video', 'reel', 'poll', 'shared')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'friends', 'only_me')),
    parent_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    media JSONB,
    location_district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    poll_options JSONB,
    poll_expires_at TIMESTAMPTZ,
    total_reactions INT DEFAULT 0,
    total_comments INT DEFAULT 0,
    total_shares INT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    is_eco_impact BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_time ON posts(user_id, created_at DESC);
CREATE INDEX idx_posts_visibility_time ON posts(visibility, created_at DESC);
CREATE INDEX idx_posts_district_time ON posts(location_district_id, created_at DESC);
CREATE INDEX idx_posts_eco_time ON posts(is_eco_impact, created_at DESC);


CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE post_tags (
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);


CREATE TABLE saved_posts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id)
);

CREATE TABLE reels (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    duration_seconds INT DEFAULT 0,
    views_count BIGINT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stories (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    media_url VARCHAR(500) NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    caption TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    is_eco_story BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 4. INTERACTIONS
-- =============================================================================

CREATE TABLE reactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    reel_id BIGINT REFERENCES reels(id) ON DELETE CASCADE,
    story_id BIGINT REFERENCES stories(id) ON DELETE CASCADE,
    reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('like', 'love', 'haha', 'wow', 'sad', 'angry', 'care')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id, reel_id, story_id)
);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    reel_id BIGINT REFERENCES reels(id) ON DELETE CASCADE,
    parent_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 5. SOCIAL GRAPH & GROUPS
-- =============================================================================

CREATE TABLE friendships (
    id BIGSERIAL PRIMARY KEY,
    user_id_1 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    action_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id_1, user_id_2)
);


CREATE TABLE user_follows (
    id BIGSERIAL PRIMARY KEY,
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (follower_id, following_id)
);

CREATE TABLE groups (
    id BIGSERIAL PRIMARY KEY,
    creator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'closed', 'secret')),
    cover_photo VARCHAR(500),
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id BIGSERIAL PRIMARY KEY,
    group_id BIGINT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (group_id, user_id)
);

-- =============================================================================
-- 6. MARKETPLACE
-- =============================================================================

CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INT DEFAULT 0,
    eco_rating INT DEFAULT 5,
    co2_saving_kg DECIMAL(10,2) DEFAULT 0.00,
    images JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE wishlist (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE product_comments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_district_id BIGINT NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    shipping_upazila_id BIGINT NOT NULL REFERENCES upazilas(id) ON DELETE RESTRICT,
    shipping_address TEXT NOT NULL,
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    price_at_purchase DECIMAL(12,2) NOT NULL
);

-- =============================================================================
-- 7. SUSTAINABILITY & INSIGHTS
-- =============================================================================

CREATE TABLE carbon_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_kg DECIMAL(10,2) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    district_id BIGINT REFERENCES districts(id) ON DELETE SET NULL,
    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenges (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points_reward INT DEFAULT 0,
    co2_saving_estimate DECIMAL(10,2) DEFAULT 0.00,
    duration_days SMALLINT DEFAULT 7,
    image_url VARCHAR(500),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_challenges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    progress INT DEFAULT 0,
    proof_media JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    UNIQUE (user_id, challenge_id)
);

-- =============================================================================
-- 7.1 QUIZZES
-- =============================================================================

CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_questions (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('a', 'b', 'c', 'd')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_quizzes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    points_earned INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, quiz_id)
);


-- =============================================================================
-- 7.2 GAMIFICATION (Badges)
-- =============================================================================

CREATE TABLE badges (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria_type VARCHAR(50) NOT NULL CHECK (criteria_type IN ('eco_points', 'carbon_saved', 'trees_planted', 'streak')),
    criteria_threshold INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_badges (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id BIGINT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, badge_id)
);

-- =============================================================================
-- 8. MESSAGES & NOTIFICATIONS
-- =============================================================================

CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY,
    is_group BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversation_participants (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    last_read_message_id BIGINT,
    UNIQUE (conversation_id, user_id)
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'location')),
    attachment_url VARCHAR(500),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('like', 'comment', 'order', 'message', 'challenge', 'friend_request', 'eco_alert')),
    target_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- 9. SUPPORTING TABLES
-- =============================================================================

CREATE TABLE reports (
    id BIGSERIAL PRIMARY KEY,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'reel', 'product', 'user', 'comment')),
    target_id BIGINT NOT NULL,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('spam', 'fake', 'hate', 'violence', 'nudity', 'other')),
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_status_history (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    note TEXT,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seller_stats (
    seller_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_sales DECIMAL(14,2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- TRIGGERS (PostgreSQL style)
-- =============================================================================

-- Reaction counts
CREATE OR REPLACE FUNCTION handle_reaction_change() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts SET total_reactions = total_reactions + 1 WHERE id = NEW.post_id;
        END IF;
        IF NEW.reel_id IS NOT NULL THEN
            UPDATE reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts SET total_reactions = total_reactions - 1 WHERE id = OLD.post_id;
        END IF;
        IF OLD.reel_id IS NOT NULL THEN
            UPDATE reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reaction_change
AFTER INSERT OR DELETE ON reactions
FOR EACH ROW EXECUTE FUNCTION handle_reaction_change();

-- Comment counts
CREATE OR REPLACE FUNCTION handle_comment_change() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.post_id IS NOT NULL THEN
            UPDATE posts SET total_comments = total_comments + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.post_id IS NOT NULL THEN
            UPDATE posts SET total_comments = total_comments - 1 WHERE id = OLD.post_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comment_change
AFTER INSERT OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION handle_comment_change();

-- Stock management
CREATE OR REPLACE FUNCTION handle_order_paid() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE products p
        SET stock = p.stock - oi.quantity
        FROM order_items oi
        WHERE oi.product_id = p.id AND oi.order_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_paid
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION handle_order_paid();

-- Carbon logging impact
CREATE OR REPLACE FUNCTION handle_carbon_log() RETURNS TRIGGER AS $$
BEGIN
    UPDATE users SET carbon_saved_kg = carbon_saved_kg + NEW.amount_kg
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_carbon_log
AFTER INSERT ON carbon_logs
FOR EACH ROW EXECUTE FUNCTION handle_carbon_log();

-- Social Graph Counts
CREATE OR REPLACE FUNCTION handle_social_counts() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (TG_TABLE_NAME = 'user_follows') THEN
            UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
            UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF (TG_TABLE_NAME = 'user_follows') THEN
            UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
            UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
        ELSIF (TG_TABLE_NAME = 'friendships') THEN
            IF OLD.status = 'accepted' THEN
                UPDATE users SET friend_count = friend_count - 1 WHERE id = OLD.user_id_1;
                UPDATE users SET friend_count = friend_count - 1 WHERE id = OLD.user_id_2;
            END IF;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (TG_TABLE_NAME = 'friendships') THEN
            IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
                UPDATE users SET friend_count = friend_count + 1 WHERE id = NEW.user_id_1;
                UPDATE users SET friend_count = friend_count + 1 WHERE id = NEW.user_id_2;
            ELSIF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
                UPDATE users SET friend_count = friend_count - 1 WHERE id = NEW.user_id_1;
                UPDATE users SET friend_count = friend_count - 1 WHERE id = NEW.user_id_2;
            END IF;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_follow_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION handle_social_counts();

CREATE TRIGGER trg_friend_counts
AFTER UPDATE OR DELETE ON friendships
FOR EACH ROW EXECUTE FUNCTION handle_social_counts();

-- Badge Automation Trigger
CREATE OR REPLACE FUNCTION award_badges() RETURNS TRIGGER AS $$
BEGIN
    -- Eco Champion
    IF NEW.eco_points >= 1000 AND OLD.eco_points < 1000 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT NEW.id, id FROM badges WHERE name = 'Eco Champion'
        ON CONFLICT DO NOTHING;
    END IF;
    -- Carbon Hero
    IF NEW.carbon_saved_kg >= 500 AND OLD.carbon_saved_kg < 500 THEN
        INSERT INTO user_badges (user_id, badge_id)
        SELECT NEW.id, id FROM badges WHERE name = 'Carbon Hero'
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_badges
AFTER UPDATE OF eco_points, carbon_saved_kg ON users
FOR EACH ROW EXECUTE FUNCTION award_badges();

-- Real-time LISTEN/NOTIFY
CREATE OR REPLACE FUNCTION notify_db_change() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'db_changes',
    json_build_object(
      'table', TG_TABLE_NAME,
      'action', TG_OP,
      'data', CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE row_to_json(NEW) END
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_notify AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER trg_posts_notify AFTER INSERT OR UPDATE OR DELETE ON posts FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER trg_orders_notify AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION notify_db_change();

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW leaderboard_national AS
SELECT 
    u.id, u.username, u.display_name, u.profile_picture,
    u.eco_points, u.carbon_saved_kg, u.streak_days, u.trees_planted,
    (u.eco_points + u.carbon_saved_kg * 10 + u.trees_planted * 50) AS impact_score,
    DENSE_RANK() OVER (ORDER BY (u.eco_points + u.carbon_saved_kg * 10 + u.trees_planted * 50) DESC) AS rank
FROM users u
WHERE u.is_active = TRUE AND u.deleted_at IS NULL
ORDER BY impact_score DESC
LIMIT 200;

CREATE OR REPLACE VIEW district_eco_stats AS
SELECT 
    d.id AS district_id, d.name AS district_name, d.division,
    COUNT(DISTINCT u.id) AS active_users,
    SUM(u.carbon_saved_kg) AS total_carbon_saved_kg,
    AVG(u.carbon_saved_kg) AS avg_per_user,
    SUM(u.trees_planted) AS total_trees
FROM districts d
LEFT JOIN users u ON u.district_id = d.id AND u.is_active = TRUE AND u.deleted_at IS NULL
GROUP BY d.id
ORDER BY total_carbon_saved_kg DESC;


CREATE OR REPLACE VIEW trending_hashtags AS
SELECT 
    t.name AS tag_name,
    COUNT(pt.post_id) AS usage_count
FROM tags t
JOIN post_tags pt ON pt.tag_id = t.id
JOIN posts p ON p.id = pt.post_id
WHERE p.created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
  AND p.deleted_at IS NULL
GROUP BY t.id, t.name
ORDER BY usage_count DESC
LIMIT 10;


CREATE OR REPLACE VIEW unread_messages_count AS
SELECT 
    cp.user_id,
    cp.conversation_id,
    COUNT(m.id) AS unread_count
FROM conversation_participants cp
JOIN messages m ON m.conversation_id = cp.conversation_id
WHERE (cp.last_read_message_id IS NULL OR m.id > cp.last_read_message_id)
  AND m.sender_id != cp.user_id
  AND m.deleted_at IS NULL
GROUP BY cp.user_id, cp.conversation_id;

-- Sample Data (Districts & Admin)
INSERT INTO districts (name, division, code) VALUES 
('Dhaka', 'Dhaka', 'DHK'),
('Chittagong', 'Chittagong', 'CTG');

INSERT INTO users (username, full_name, display_name, email, phone, password_hash, role, is_verified) VALUES
('admin', 'EcoSync Admin', 'Admin', 'admin@ecosync.com', '01700000000', '$2a$12$O/3ctjUA1P3PCL61aMlBPeNaDDDMdp0o9krHMhLiT5pUOVnOSVDJ.', 'admin', TRUE);
