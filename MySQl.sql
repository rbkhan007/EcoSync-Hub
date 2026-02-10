-- =============================================================================
--                   EcoSync Hub - Complete MySQL Database Schema
--         Social Network + Marketplace + Sustainability Platform
--                   MySQL 8.0+ / InnoDB / utf8mb4
--                   Single-file - no migrations needed
--                   Updated: February 2026 version
-- =============================================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET TIME_ZONE = '+06:00';   -- Bangladesh Standard Time
SET GLOBAL event_scheduler = ON;  -- Enable for auto-cleanup / leaderboards

-- =============================================================================
-- DROP EXISTING TABLES (safe re-run)
-- =============================================================================

DROP TABLE IF EXISTS user_badges;
DROP TABLE IF EXISTS badges;
DROP TABLE IF EXISTS saved_posts;
DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS user_follows;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS seller_stats;
DROP TABLE IF EXISTS order_status_history;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS user_quizzes;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS user_challenges;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS carbon_logs;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_comments;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS wishlist;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS reactions;
DROP TABLE IF EXISTS stories;
DROP TABLE IF EXISTS reels;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS upazilas;
DROP TABLE IF EXISTS districts;

-- =============================================================================
-- 1. USERS
-- =============================================================================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    display_name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(255) UNIQUE DEFAULT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) DEFAULT NULL,
    gender ENUM('male','female','other','prefer_not_to_say') DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    profile_picture VARCHAR(500) DEFAULT NULL,
    cover_photo VARCHAR(500) DEFAULT NULL,
    district_id BIGINT UNSIGNED DEFAULT NULL,
    upazila_id BIGINT UNSIGNED DEFAULT NULL,
    eco_points BIGINT UNSIGNED DEFAULT 0,
    carbon_saved_kg DECIMAL(12,2) DEFAULT 0.00,
    trees_planted INT UNSIGNED DEFAULT 0,
    streak_days INT UNSIGNED DEFAULT 0,
    follower_count BIGINT UNSIGNED DEFAULT 0,
    following_count BIGINT UNSIGNED DEFAULT 0,
    friend_count BIGINT UNSIGNED DEFAULT 0,
    last_active_date DATE DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    role ENUM('user','seller','moderator','admin') DEFAULT 'user',
    last_seen TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_phone (phone),
    INDEX idx_username (username),
    INDEX idx_district (district_id),
    INDEX idx_role_active (role, is_active),
    FULLTEXT INDEX ft_name (full_name, display_name, username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE user_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_token (user_id, session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 2. GEOGRAPHY (Bangladesh)
-- =============================================================================

CREATE TABLE districts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    division VARCHAR(100) NOT NULL,
    bn_name VARCHAR(100) DEFAULT NULL,
    code VARCHAR(10) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_division (division)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE upazilas (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    district_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(100) NOT NULL,
    bn_name VARCHAR(100) DEFAULT NULL,
    code VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    INDEX idx_district (district_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 3. SOCIAL CONTENT
-- =============================================================================

CREATE TABLE posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    content TEXT NOT NULL,
    post_type ENUM('text','photo','video','reel','poll','shared') DEFAULT 'text',
    visibility ENUM('public','friends','only_me') DEFAULT 'public',
    parent_id BIGINT UNSIGNED NULL,
    media JSON DEFAULT NULL,
    location_district_id BIGINT UNSIGNED DEFAULT NULL,
    poll_options JSON DEFAULT NULL,
    poll_expires_at TIMESTAMP NULL,
    total_reactions INT UNSIGNED DEFAULT 0,
    total_comments INT UNSIGNED DEFAULT 0,
    total_shares INT UNSIGNED DEFAULT 0,
    views_count BIGINT UNSIGNED DEFAULT 0,
    is_eco_impact TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (location_district_id) REFERENCES districts(id) ON DELETE SET NULL,

    FULLTEXT INDEX ft_content (content),
    INDEX idx_user_time (user_id, created_at DESC),
    INDEX idx_visibility_time (visibility, created_at DESC),
    INDEX idx_district_time (location_district_id, created_at DESC),
    INDEX idx_eco_time (is_eco_impact, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE tags (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE post_tags (
    post_id BIGINT UNSIGNED NOT NULL,
    tag_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE saved_posts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_save (user_id, post_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE reels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    video_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    caption TEXT,
    duration_seconds INT UNSIGNED DEFAULT 0,
    views_count BIGINT UNSIGNED DEFAULT 0,
    likes_count BIGINT UNSIGNED DEFAULT 0,
    district_id BIGINT UNSIGNED DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,

    INDEX idx_user (user_id),
    INDEX idx_district_views (district_id, views_count DESC),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE stories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    media_url VARCHAR(500) NOT NULL,
    media_type ENUM('image','video') NOT NULL,
    caption TEXT,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL 24 HOUR),
    is_eco_story TINYINT(1) DEFAULT 0,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 4. INTERACTIONS
-- =============================================================================

CREATE TABLE reactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NULL,
    reel_id BIGINT UNSIGNED NULL,
    story_id BIGINT UNSIGNED NULL,
    reaction_type ENUM('like','love','haha','wow','sad','angry','care') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_reaction (user_id, post_id, reel_id, story_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
    FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,

    INDEX idx_post (post_id),
    INDEX idx_reel (reel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    post_id BIGINT UNSIGNED NULL,
    reel_id BIGINT UNSIGNED NULL,
    parent_id BIGINT UNSIGNED NULL,
    content TEXT NOT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (reel_id) REFERENCES reels(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,

    FULLTEXT INDEX ft_content (content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 5. SOCIAL GRAPH & GROUPS
-- =============================================================================

CREATE TABLE friendships (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id_1 BIGINT UNSIGNED NOT NULL,
    user_id_2 BIGINT UNSIGNED NOT NULL,
    status ENUM('pending','accepted','blocked') DEFAULT 'pending',
    action_user_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_friendship (user_id_1, user_id_2),
    FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (action_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE user_follows (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    follower_id BIGINT UNSIGNED NOT NULL,
    following_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_follow (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE groups (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creator_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    privacy ENUM('public','closed','secret') DEFAULT 'public',
    cover_photo VARCHAR(500) DEFAULT NULL,
    district_id BIGINT UNSIGNED DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE group_members (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role ENUM('admin','moderator','member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_member (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 6. MARKETPLACE
-- =============================================================================

CREATE TABLE categories (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    parent_id BIGINT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE products (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    seller_id BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    stock INT UNSIGNED DEFAULT 0,
    eco_rating TINYINT UNSIGNED DEFAULT 5,
    co2_saving_kg DECIMAL(10,2) DEFAULT 0.00,
    images JSON DEFAULT NULL,
    status ENUM('draft','pending','approved','rejected') DEFAULT 'draft',
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,

    FULLTEXT INDEX ft_name_desc (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE cart_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_cart_item (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE wishlist (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_wishlist (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_review (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE product_comments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE orders (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    seller_id BIGINT UNSIGNED NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('pending','paid','processing','shipped','delivered','cancelled') DEFAULT 'pending',
    shipping_district_id BIGINT UNSIGNED NOT NULL,
    shipping_upazila_id BIGINT UNSIGNED NOT NULL,
    shipping_address TEXT NOT NULL,
    payment_intent_id VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (shipping_district_id) REFERENCES districts(id) ON DELETE RESTRICT,

    INDEX idx_status_time (status, created_at DESC),
    INDEX idx_buyer_time (user_id, created_at DESC),
    INDEX idx_seller_status (seller_id, status),
    INDEX idx_seller_created (seller_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE payments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE order_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    quantity INT UNSIGNED NOT NULL,
    price_at_purchase DECIMAL(12,2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,

    INDEX idx_order_product (order_id, product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 7. SUSTAINABILITY & INSIGHTS
-- =============================================================================

CREATE TABLE carbon_logs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    amount_kg DECIMAL(10,2) NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    district_id BIGINT UNSIGNED DEFAULT NULL,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE SET NULL,

    INDEX idx_district_time (district_id, logged_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE challenges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    points_reward INT UNSIGNED DEFAULT 0,
    co2_saving_estimate DECIMAL(10,2) DEFAULT 0.00,
    duration_days SMALLINT UNSIGNED DEFAULT 7,
    image_url VARCHAR(500) DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE user_challenges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    challenge_id BIGINT UNSIGNED NOT NULL,
    status ENUM('active','completed','failed') DEFAULT 'active',
    progress INT UNSIGNED DEFAULT 0,
    proof_media JSON DEFAULT NULL,
    is_verified TINYINT(1) DEFAULT 0,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    UNIQUE KEY unique_participation (user_id, challenge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,

    INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 7.1 QUIZZES
-- =============================================================================

CREATE TABLE quizzes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INT UNSIGNED DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE quiz_questions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT UNSIGNED NOT NULL,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option ENUM('a','b','c','d') NOT NULL,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_quizzes (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    quiz_id BIGINT UNSIGNED NOT NULL,
    score INT UNSIGNED NOT NULL,
    points_earned INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_quiz_completion (user_id, quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 7.2 GAMIFICATION (Badges)
-- =============================================================================

CREATE TABLE badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    criteria_type ENUM('eco_points','carbon_saved','trees_planted','streak') NOT NULL,
    criteria_threshold INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE user_badges (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    badge_id BIGINT UNSIGNED NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_badge (user_id, badge_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 8. MESSAGES & NOTIFICATIONS
-- =============================================================================

CREATE TABLE conversations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    is_group TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


CREATE TABLE conversation_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    last_read_message_id BIGINT UNSIGNED DEFAULT NULL,

    UNIQUE KEY unique_participant (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;


CREATE TABLE messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id BIGINT UNSIGNED NOT NULL,
    content TEXT,
    message_type ENUM('text','image','file','location') DEFAULT 'text',
    attachment_url VARCHAR(500) DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_conversation_time (conversation_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    type ENUM('like','comment','order','message','challenge','friend_request','eco_alert') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    INDEX idx_user_read_time (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- 9. SUPPORTING TABLES
-- =============================================================================

CREATE TABLE reports (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('post','reel','product','user','comment') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    reason ENUM('spam','fake','hate','violence','nudity','other') NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('pending','reviewed','resolved') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE order_status_history (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT UNSIGNED NOT NULL,
    old_status ENUM('pending','paid','processing','shipped','delivered','cancelled') DEFAULT NULL,
    new_status ENUM('pending','paid','processing','shipped','delivered','cancelled') NOT NULL,
    changed_by BIGINT UNSIGNED NULL,
    note TEXT DEFAULT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_order_time (order_id, changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE seller_stats (
    seller_id BIGINT UNSIGNED PRIMARY KEY,
    total_sales DECIMAL(14,2) DEFAULT 0.00,
    total_orders INT UNSIGNED DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- =============================================================================
-- TRIGGERS
-- =============================================================================

DELIMITER //

-- Reactions (posts & reels)
CREATE TRIGGER after_reaction_insert
AFTER INSERT ON reactions
FOR EACH ROW
BEGIN
    IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET total_reactions = total_reactions + 1 WHERE id = NEW.post_id;
    END IF;
    IF NEW.reel_id IS NOT NULL THEN
        UPDATE reels SET likes_count = likes_count + 1 WHERE id = NEW.reel_id;
    END IF;
END //

CREATE TRIGGER after_reaction_delete
AFTER DELETE ON reactions
FOR EACH ROW
BEGIN
    IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET total_reactions = total_reactions - 1 WHERE id = OLD.post_id;
    END IF;
    IF OLD.reel_id IS NOT NULL THEN
        UPDATE reels SET likes_count = likes_count - 1 WHERE id = OLD.reel_id;
    END IF;
END //

-- Comments
CREATE TRIGGER after_comment_insert
AFTER INSERT ON comments
FOR EACH ROW
BEGIN
    IF NEW.post_id IS NOT NULL THEN
        UPDATE posts SET total_comments = total_comments + 1 WHERE id = NEW.post_id;
    END IF;
END //

CREATE TRIGGER after_comment_delete
AFTER DELETE ON comments
FOR EACH ROW
BEGIN
    IF OLD.post_id IS NOT NULL THEN
        UPDATE posts SET total_comments = total_comments - 1 WHERE id = OLD.post_id;
    END IF;
END //

-- Orders & Stock
CREATE TRIGGER after_order_item_insert
AFTER INSERT ON order_items
FOR EACH ROW
BEGIN
    UPDATE orders SET total_amount = total_amount + (NEW.quantity * NEW.price_at_purchase)
    WHERE id = NEW.order_id;
END //

CREATE TRIGGER after_order_paid_stock
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        UPDATE products p
        JOIN order_items oi ON oi.product_id = p.id
        SET p.stock = p.stock - oi.quantity
        WHERE oi.order_id = NEW.id AND p.stock >= oi.quantity;
    END IF;
END //

CREATE TRIGGER after_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
        VALUES (NEW.id, OLD.status, NEW.status, @current_user_id);
    END IF;
END //

-- Carbon logs
CREATE TRIGGER after_carbon_log
AFTER INSERT ON carbon_logs
FOR EACH ROW
BEGIN
    UPDATE users SET carbon_saved_kg = carbon_saved_kg + NEW.amount_kg
    WHERE id = NEW.user_id;
END //

-- Challenge completion
CREATE TRIGGER after_challenge_complete
AFTER UPDATE ON user_challenges
FOR EACH ROW
BEGIN
    END IF;
END //

-- Social Graph Triggers
CREATE TRIGGER after_follow_insert
AFTER INSERT ON user_follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
END //

CREATE TRIGGER after_follow_delete
AFTER DELETE ON user_follows
FOR EACH ROW
BEGIN
    UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
END //

CREATE TRIGGER after_friendship_update
AFTER UPDATE ON friendships
FOR EACH ROW
BEGIN
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        UPDATE users SET friend_count = friend_count + 1 WHERE id = NEW.user_id_1;
        UPDATE users SET friend_count = friend_count + 1 WHERE id = NEW.user_id_2;
    END IF;
    IF NEW.status != 'accepted' AND OLD.status = 'accepted' THEN
        UPDATE users SET friend_count = friend_count - 1 WHERE id = NEW.user_id_1;
        UPDATE users SET friend_count = friend_count - 1 WHERE id = NEW.user_id_2;
    END IF;
END //

CREATE TRIGGER after_friendship_delete
AFTER DELETE ON friendships
FOR EACH ROW
BEGIN
    IF OLD.status = 'accepted' THEN
        UPDATE users SET friend_count = friend_count - 1 WHERE id = OLD.user_id_1;
        UPDATE users SET friend_count = friend_count - 1 WHERE id = OLD.user_id_2;
    END IF;
END //

-- Badge Automation
CREATE TRIGGER after_user_stats_update
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    -- Eco Champion Badge (1000 points)
    IF NEW.eco_points >= 1000 AND OLD.eco_points < 1000 THEN
        INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_at)
        SELECT NEW.id, id, CURRENT_TIMESTAMP FROM badges WHERE name = 'Eco Champion';
    END IF;
    -- Carbon Hero (500kg saved)
    IF NEW.carbon_saved_kg >= 500 AND OLD.carbon_saved_kg < 500 THEN
        INSERT IGNORE INTO user_badges (user_id, badge_id, awarded_at)
        SELECT NEW.id, id, CURRENT_TIMESTAMP FROM badges WHERE name = 'Carbon Hero';
    END IF;
END //

DELIMITER ;


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
WHERE u.is_active = 1 AND u.deleted_at IS NULL
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
LEFT JOIN users u ON u.district_id = d.id AND u.is_active = 1 AND u.deleted_at IS NULL
GROUP BY d.id
ORDER BY total_carbon_saved_kg DESC;


CREATE OR REPLACE VIEW trending_hashtags AS
SELECT 
    t.name AS tag_name,
    COUNT(pt.post_id) AS usage_count
FROM tags t
JOIN post_tags pt ON pt.tag_id = t.id
JOIN posts p ON p.id = pt.post_id
WHERE p.created_at >= (CURRENT_TIMESTAMP - INTERVAL 7 DAY)
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


-- =============================================================================
-- FINISH
-- =============================================================================

-- Sample Data (Districts & Admin)
INSERT INTO districts (name, division, code) VALUES 
('Dhaka', 'Dhaka', 'DHK'),
('Chittagong', 'Chittagong', 'CTG');

INSERT INTO users (username, full_name, display_name, email, phone, password_hash, role, is_verified) VALUES
('admin', 'EcoSync Admin', 'Admin', 'admin@ecosync.com', '01700000000', '$2a$12$O/3ctjUA1P3PCL61aMlBPeNaDDDMdp0o9krHMhLiT5pUOVOSVDJ.', 'admin', 1);

SET FOREIGN_KEY_CHECKS = 1;

-- End of complete schema
-- Ready for use in EcoSync Hub
-- Includes tables, triggers, and useful views