-- EcoSync Hub Database Setup (PostgreSQL)
-- INSTRUCTIONS:
-- 1. Run this script in your Render Postgres SQL Editor or psql
-- 2. It will create all tables and sample data

-- Drop tables if they exist (Cascade handles foreign keys)
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS email_verifications CASCADE;
DROP TABLE IF EXISTS districts CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS product_comments CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS carbon_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS user_challenges CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS user_quizzes CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create tables

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) DEFAULT '',
    last_name VARCHAR(100) DEFAULT '',
    birth_date DATE,
    gender VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    bio TEXT,
    avatar_url TEXT,
    eco_points INT DEFAULT 0,
    carbon_saved_kg DECIMAL(10,2) DEFAULT 0.00,
    trees_planted INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    stock INT DEFAULT 0,
    image_url TEXT,
    eco_rating INT DEFAULT 5,
    co2_reduction_kg DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INT DEFAULT 0,
    co2_saving_kg DECIMAL(10,2) DEFAULT 0.00,
    duration_days INT DEFAULT 7,
    image_url TEXT,
    category VARCHAR(20) DEFAULT 'Week' CHECK (category IN ('Day', 'Week', 'Month')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User challenges table
CREATE TABLE user_challenges (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    progress INT DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ NULL
);

-- Quizzes table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_reward INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    option_a VARCHAR(255) NOT NULL,
    option_b VARCHAR(255) NOT NULL,
    option_c VARCHAR(255) NOT NULL,
    option_d VARCHAR(255) NOT NULL,
    correct_option CHAR(1) NOT NULL
);

-- User quizzes table
CREATE TABLE user_quizzes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    score INT NOT NULL,
    points_earned INT DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_intent_id VARCHAR(255),
    shipping_address TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_intent_id VARCHAR(255) UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

-- Carbon logs table
CREATE TABLE carbon_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_kg DECIMAL(10,2) NOT NULL,
    source VARCHAR(255) NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    rating INT DEFAULT 5,
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Product comments table
CREATE TABLE product_comments (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Post likes table
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, post_id)
);

-- Post comments table
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id INT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Friends table
CREATE TABLE friends (
    id SERIAL PRIMARY KEY,
    user_id_1 INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    action_user_id INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id_1, user_id_2)
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) DEFAULT 'Notification',
    message TEXT,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'challenge', 'order', 'friend')),
    reference_id INT DEFAULT NULL,
    reference_type VARCHAR(50) DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User addresses table
CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address_type VARCHAR(50) DEFAULT 'home',
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    house_flat_no VARCHAR(100),
    road_street VARCHAR(255),
    area_locality VARCHAR(255),
    post_office VARCHAR(100),
    thana_upazila VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    division VARCHAR(100),
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(100) DEFAULT 'BANGLADESH',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Wishlists table
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Districts table
CREATE TABLE districts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Email verifications table
CREATE TABLE email_verifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Password resets table
CREATE TABLE password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_cart_user ON cart_items(user_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_posts_user ON posts(user_id);

-- Sample Data

INSERT INTO users (username, email, password, first_name, last_name, role, eco_points, carbon_saved_kg, trees_planted, birth_date, gender) VALUES
('admin', 'rhasan211068@bscse.uiu.ac.bd', '$2a$12$O/3ctjUA1P3PCL61aMlBPeNaDDDMdp0o9krHMhLiT5pUOVnOSVDJ.', 'Admin', 'User', 'admin', 1000, 50.00, 10, '1995-01-01', 'male'),
('seller', 'sellerdemo@gmail.com', '$2a$12$by/I3.TxeuV1XfHREVl73.kEeYHkV4S3VVhZsbE0rfcINkEe57moK', 'Eco', 'Seller', 'seller', 500, 20.00, 5, '1990-05-15', 'female'),
('user', 'userdemo@gmail.com', '$2a$12$qzg3aUpyFS2mPcJH40o2Se/9hnXff9crAfwBFUe59j8VQXFzksCFG', 'Normal', 'User', 'user', 100, 5.00, 2, '2000-10-20', 'other');

INSERT INTO categories (name, description) VALUES
('Home & Living', 'Eco-friendly home products'),
('Personal Care', 'Sustainable personal care items'),
('Gadgets', 'Green technology');

INSERT INTO districts (name, code) VALUES
('Dhaka', 'DHK'),
('Chittagong', 'CTG'),
('Sylhet', 'SYL'),
('Rajshahi', 'RAJ'),
('Khulna', 'KHL');

INSERT INTO products (name, description, price, category_id, seller_id, stock, image_url, eco_rating, co2_reduction_kg, status) VALUES
('Bamboo Toothbrush', 'Pack of 4 biodegradable brushes with soft bristles', 550.00, 2, 2, 100, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 5, 0.50, 'approved'),
('Solar Power Bank', '20000mAh weather-proof portable green energy charger', 3500.00, 3, 2, 50, 'https://images.unsplash.com/photo-1609592806500-3e27a7b8b4b8?w=400', 5, 12.00, 'approved'),
('Organic Soap', 'Natural soap bar with organic ingredients', 250.00, 2, 2, 200, 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=400', 4, 0.10, 'approved');

INSERT INTO challenges (title, description, points_reward, co2_saving_kg, duration_days, category) VALUES
('Plastic Free Week', 'Use zero single-use plastics for 7 consecutive days', 100, 5.00, 7, 'Week'),
('Tree Planter', 'Plant 3 native trees in your local neighborhood', 500, 25.00, 30, 'Month'),
('Zero Waste Day', 'Go zero waste for a day', 50, 2.00, 1, 'Day');

INSERT INTO user_addresses (user_id, address_type, full_name, phone, house_flat_no, road_street, thana_upazila, district, division, postal_code) VALUES
(1, 'work', 'Admin User', '01712345678', '123 Main St', 'Dhanmondi Road', 'Dhanmondi', 'Dhaka', 'Dhaka', '1209'),
(3, 'home', 'Normal User', '01812345678', '456 Elm St', 'Banani Road', 'Banani', 'Dhaka', 'Dhaka', '1213');

INSERT INTO wishlists (user_id, product_id) VALUES (3, 2);
INSERT INTO cart_items (user_id, product_id, quantity) VALUES (3, 2, 1);

INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(3, 1, 5, 'Great quality bamboo!'),
(3, 2, 4, 'Takes a while to charge in sun, but works great.');

INSERT INTO friends (user_id_1, user_id_2, status, action_user_id) VALUES (1, 3, 'accepted', 1);

INSERT INTO orders (user_id, total_amount, status, shipping_address, payment_intent_id) VALUES
(3, 3800.00, 'delivered', 'Banani, Dhaka, Bangladesh', 'pi_demo_123'),
(3, 550.00, 'paid', 'Banani, Dhaka, Bangladesh', 'pi_demo_456');

INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 550.00),
(1, 2, 1, 3500.00),
(2, 1, 1, 550.00);

INSERT INTO payments (order_id, payment_intent_id, amount, currency, status, payment_method) VALUES
(1, 'pi_demo_123', 3800.00, 'BDT', 'succeeded', 'card'),
(2, 'pi_demo_456', 550.00, 'BDT', 'succeeded', 'card');

INSERT INTO carbon_logs (user_id, amount_kg, source) VALUES
(1, 10.00, 'Challenge completion'),
(3, 12.50, 'Eco-product purchase');

INSERT INTO user_challenges (user_id, challenge_id, status, progress, completed_at) VALUES
(1, 1, 'completed', 100, CURRENT_TIMESTAMP),
(1, 2, 'active', 60, NULL),
(3, 1, 'active', 20, NULL);

INSERT INTO posts (user_id, content, image_url) VALUES
(1, 'Just completed the Plastic Free Week challenge! #Sustainability', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'),
(3, 'Loving my new Solar Power Bank from EcoSync Hub!', 'https://images.unsplash.com/photo-1609592806500-3e27a7b8b4b8');

INSERT INTO post_likes (user_id, post_id) VALUES (3, 1), (1, 2);

INSERT INTO post_comments (user_id, post_id, content) VALUES
(3, 1, 'Legend! I am on day 3.'),
(1, 2, 'Great choice, hope it serves you well!');

INSERT INTO messages (sender_id, receiver_id, content) VALUES
(1, 3, 'Welcome to EcoSync Hub! Let us know if you need help.'),
(3, 1, 'Thanks! The app looks great.');

INSERT INTO quizzes (id, title, description, points_reward) VALUES 
(1, 'Eco-Warrior Basics', 'Test your knowledge on basic environmental sustainability.', 50);

INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES 
(1, 'Which of these is a renewable energy source?', 'Coal', 'Natural Gas', 'Solar', 'Nuclear', 'C'),
(1, 'What does the "R" in "Reduce, Reuse, Recycle" stand for?', 'Refill', 'Remove', 'Restore', 'Reduce', 'D'),
(1, 'Which material takes the longest to decompose?', 'Paper', 'Orange Peel', 'Plastic Bottle', 'Wool Sock', 'C'),
(1, 'What is the primary greenhouse gas emitted by human activities?', 'Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium', 'B');

-- Real-time Sync Triggers
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

CREATE TRIGGER users_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER products_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER categories_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON categories FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER orders_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER notifications_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON notifications FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER messages_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON messages FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER cart_items_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON cart_items FOR EACH ROW EXECUTE FUNCTION notify_db_change();
CREATE TRIGGER wishlists_notify_trigger AFTER INSERT OR UPDATE OR DELETE ON wishlists FOR EACH ROW EXECUTE FUNCTION notify_db_change();
