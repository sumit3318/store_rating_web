-- Demo data. Run after schema.sql (npm run db:setup does both in the right order).
-- WARNING: uses fixed ids, so it only works on EMPTY tables. db:setup skips this file
-- automatically when users already exist.
--
-- Demo logins (passwords are stored as bcrypt hashes):
--   Admin       admin@storerating.com        Admin@123
--   Normal user user@storerating.com         User@1234
--   Normal user priya.user@storerating.com   User@1234
--   Normal user amit.user@storerating.com    User@1234
--   Store owner owner@storerating.com        Owner@123   (Sunrise Bakery)
--   Store owner owner2@storerating.com       Owner@123   (Greenfield Books)

USE store_rating;

INSERT INTO users (id, name, email, password_hash, address, role) VALUES
  (1, 'System Administrator Account', 'admin@storerating.com',      '$2b$10$Ra1eIlTCeR4oCWBfOy27lOlG5e8MzYchZIDEgMKLPboEFDxW6lG0u', '1 Admin Street, Kolkata, West Bengal', 'admin'),
  (2, 'Rahul Sharma Normal Account', 'user@storerating.com',        '$2b$10$gDvCcpXQw5/Zi5j9m.9eauKYuDQ7kar/0xIvHIfPTaAF0XcQLro5e', '22 Park Street, Kolkata, West Bengal', 'user'),
  (3, 'Priya Verma Demo Customer',    'priya.user@storerating.com', '$2b$10$gDvCcpXQw5/Zi5j9m.9eauKYuDQ7kar/0xIvHIfPTaAF0XcQLro5e', '14 MG Road, Bengaluru, Karnataka', 'user'),
  (4, 'Amit Kumar Demo Customer One', 'amit.user@storerating.com',  '$2b$10$gDvCcpXQw5/Zi5j9m.9eauKYuDQ7kar/0xIvHIfPTaAF0XcQLro5e', '8 Boring Road, Patna, Bihar', 'user'),
  (5, 'Sunrise Bakery Store Owner',   'owner@storerating.com',      '$2b$10$ztwgNGkMxTU0/9QnCT4uJOL30HOIenYop0IrLISmoMpw/6a7gg6/O', '5 Salt Lake, Kolkata, West Bengal', 'owner'),
  (6, 'Greenfield Books Store Owner', 'owner2@storerating.com',     '$2b$10$ztwgNGkMxTU0/9QnCT4uJOL30HOIenYop0IrLISmoMpw/6a7gg6/O', '30 College Street, Kolkata, West Bengal', 'owner');

INSERT INTO stores (id, name, email, address, owner_id) VALUES
  (1, 'Sunrise Bakery',     'contact@sunrisebakery.com',  '5 Salt Lake Sector V, Kolkata, West Bengal', 5),
  (2, 'Greenfield Books',   'hello@greenfieldbooks.com',  '30 College Street, Kolkata, West Bengal', 6),
  (3, 'Metro Electronics',  'sales@metroelectronics.com', '77 Brigade Road, Bengaluru, Karnataka', NULL);

INSERT INTO ratings (user_id, store_id, rating) VALUES
  (2, 1, 4),
  (3, 1, 5),
  (4, 1, 3),
  (2, 2, 5),
  (3, 3, 2);
