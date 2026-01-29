
--PostgreSQL Seed File
--Generated from SQLite

DROP TABLE IF EXISTS surveys;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_recipes;
DROP TABLE IF EXISTS product_option_links;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS options;
DROP TABLE IF EXISTS option_groups;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;

CREATE TABLE IF NOT EXISTS settings(
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

CREATE TABLE categories(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_visible INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        image_url TEXT
    );



CREATE TABLE option_groups(
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        is_multi_select INTEGER DEFAULT 0,
        is_required INTEGER DEFAULT 0,
        is_visible INTEGER DEFAULT 1
    );


CREATE TABLE options(
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        price_modifier INTEGER DEFAULT 0,
        is_available INTEGER DEFAULT 1,
        is_visible INTEGER DEFAULT 1,
        image_url TEXT,
        price_modifiers_json TEXT,
        sort_order INTEGER DEFAULT 0,
        image_focus TEXT,
        crop_data TEXT
    );



CREATE TABLE products(
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES categories(id),
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        is_available INTEGER DEFAULT 1,
        is_visible INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE ingredients(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cost_per_gram REAL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE product_sizes(
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        size_name TEXT NOT NULL,
        price INTEGER NOT NULL
    );

CREATE TABLE product_option_links(
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES option_groups(id) ON DELETE CASCADE,
        PRIMARY KEY(product_id, group_id)
    );

CREATE TABLE product_recipes(
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        ingredient_id INTEGER, --Weak link if ingredients table not present
    quantity REAL NOT NULL,
        size_name TEXT
);

CREATE TABLE orders(
            id SERIAL PRIMARY KEY,
            items TEXT,
            total INTEGER,
            details TEXT,
            worker_id INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            display_id INTEGER
        );


CREATE TABLE surveys(
            id SERIAL PRIMARY KEY,
            order_id INTEGER,
            worker_id INTEGER,
            quality INTEGER,
            time INTEGER,
            manner INTEGER,
            overall INTEGER,
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

-- Data for categories
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (8, 'Matcha', 'M: 4g - L: 5.5g - 1L3: 8g (Bột Nhật Bản)', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (9, 'Matcha Cold Whisk', 'M: 5g - L: 7g - 1L3: 10g', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (10, 'Houjicha', 'Trà rang Nhật Bản - Thơm hạt rang, Bùi béo', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (11, 'Cacao', 'Đậm đà, thơm ngon', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (12, 'Oreo', 'Đá xay cùng bánh Oreo vụn + Lớp kem muối', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (13, 'Trà Hoa', 'Trà đã có topping Thạch Dừa - Ly 700ml', 1, 0, NULL);
INSERT INTO categories (id, name, description, is_visible, sort_order, image_url) VALUES (15, 'Dessert', 'Bánh ngọt', 1, 0, '');

-- Data for options
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (23, 5, 'Nhiều đá (50%)', '', 0, 1, 1, '', '{"L":0,"1L3":0}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (24, 5, 'Ít đá (30%)', '', 0, 1, 1, '', '{"L":0,"1L3":0}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (25, 5, 'Không đá (0%)', '', 0, 1, 1, '', '{"L":0,"1L3":0}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (33, 7, 'MK4', 'Đậm đà, béo hạt, ko tanh.', 0, 1, 1, '/uploads/IMG_1224-1769637637451-14218546.PNG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (34, 7, 'Fuji Haru 02', 'Thơm trà, hậu ngọt, đắng chát nhẹ.', 0, 1, 1, '/uploads/IMG_1225-1769637866159-71970667.JPG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (35, 7, 'Fuji No Haru', 'Thơm hoa cỏ, có xíu nutty, vị chát nhẹ.', 0, 1, 1, '/uploads/IMG_1226-1769637876119-556474106.JPG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (36, 7, 'Maruyama Seicha', 'Nhẹ nhàng, cỏ non, đắng chát nhẹ.', 0, 1, 1, '/uploads/IMG_1227-1769637885639-498378144.JPG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (37, 7, 'Matsu (G40)', 'Đắng nhẹ, hoa cỏ, hậu ngọt dịu.', 0, 1, 1, '/uploads/IMG_1228-1769637897388-624457887.JPG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (38, 7, 'Fuji 03', 'Béo thơm, đậm đà, ko đắng chát.', 0, 1, 1, '/uploads/IMG_1229-1769637923551-777626375.PNG', '{"L":5000,"1L3":10000}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (39, 7, 'Kasuga', 'Thuần trà, béo phô mai, ko đắng chát +5K/+10K', 0, 1, 1, '/uploads/IMG_1231-1769637929035-24695270.JPG', '{"L":5000,"1L3":10000}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (40, 6, 'Tàu hủ núng nính', NULL, 3000, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (41, 6, 'Trân châu đen', NULL, 5000, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (42, 6, 'Kem muối', NULL, 3000, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (43, 6, 'Bánh Oreo vụn', NULL, 3000, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (44, 6, 'Phô mai bò cười dầm', NULL, 5000, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (45, 4, 'Sữa đặc (Mặc định)', NULL, 0, 1, 1, NULL, NULL, 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (46, 4, 'Syrup Earl Grey', NULL, 0, 1, 1, NULL, NULL, 1, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (47, 4, 'Nước đường', NULL, 0, 1, 1, NULL, NULL, 2, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (48, 4, 'Không đường', NULL, 0, 1, 1, NULL, NULL, 3, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (50, 8, 'Type A', 'Thơm hạt rang, bùi béo, khói nhẹ. Hậu vị dễ chịu.', 0, 1, 1, '/uploads/Houjicha Type A-1769635977568-665407515.JPG', '{"L":0,"1L3":0}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (51, 8, 'Type B', 'Hạt dẻ, caramel, béo bùi, rang đậm đà.', 0, 1, 1, '/uploads/Houjicha Type B-1769635989188-69705222.JPG', '{"L":0,"1L3":0}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (52, 9, 'Mặc Định', '', 0, 1, 1, '/uploads/IMG_1219-1769637934366-182112925.PNG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (53, 9, 'Đổi Free', '', 0, 1, 1, '/uploads/IMG_1222-1769637940331-568021265.JPG', '{"L":0,"1L3":0}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (54, 9, 'Boring Oat Milk', '', 0, 1, 1, '/uploads/IMG_1223-1769637945529-95161158.PNG', '{"L":5000,"1L3":10000}', 0, 'center', '{"scale":1,"x":0,"y":0}');
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (55, 10, 'Fuji Test', '', 0, 0, 0, '', '{"L":5000,"1L3":10000}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (56, 11, 'Fuji Test', '', 0, 0, 0, '', '{"L":5000,"1L3":10000}', 0, 'center', NULL);
INSERT INTO options (id, group_id, name, description, price_modifier, is_available, is_visible, image_url, price_modifiers_json, sort_order, image_focus, crop_data) VALUES (57, 12, 'Fuji Test', '', 0, 0, 0, '', '{"L":5000,"1L3":10000}', 0, 'center', NULL);

-- Data for option_groups
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (4, 'Độ Ngọt (Sugar)', 'Chọn mức đường mong muốn', 0, 1, 1);
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (5, 'Đá (Ice)', 'Chọn lượng đá', 0, 1, 1);
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (6, 'Topping', 'Thêm topping hấp dẫn', 1, 0, 1);
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (7, 'Loại Bột (Matcha Type)', 'Chọn loại bột Matcha bạn thích', 0, 1, 1);
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (8, 'Loại Bột (Cold Whisk)', '', 0, 1, 1);
INSERT INTO option_groups (id, name, description, is_multi_select, is_required, is_visible) VALUES (9, 'Sữa', '', 0, 1, 1);

-- Data for products
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (18, 8, 'Matcha Latte', '', '', 1, 1, '2026-01-28 05:13:32');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (19, 8, 'Matcha Dâu/Chuối/Xoài', 'Mix vị trái cây tươi mát', '', 1, 1, '2026-01-28 05:13:32');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (20, 8, 'Matcha Caramel', '', '', 1, 1, '2026-01-28 05:13:32');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (21, 8, 'Matcha Oreo', '', '', 1, 1, '2026-01-28 05:13:32');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (22, 8, 'Choco Matcha Latte', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (23, 9, 'Cold Whisk Nước Dừa', 'Matcha đánh bông với sữa yến mạch + nước dừa', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (24, 9, 'Matcha Cold Whisk', 'Matcha đánh trực tiếp với sữa', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (25, 10, 'Houjicha Latte', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (26, 11, 'Cacao Sữa', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (27, 11, 'Cacao Dâu/Chuối/Xoài', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (28, 11, 'Cacao Bạc Hà', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (29, 11, 'Cacao Hạt Điều', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (30, 12, 'Oreo Choco', 'Oreo vụn + Lớp kem muối', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (31, 12, 'Oreo Choco Mint', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (32, 12, 'Oreo Choco Chuối', '', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (33, 13, 'Trà Lê Hoa Cúc', 'Có sẵn thạch dừa', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (34, 13, 'Trà Vải Hoa Hồng', 'Có sẵn thạch dừa', '', 1, 1, '2026-01-28 05:13:33');
INSERT INTO products (id, category_id, name, description, image_url, is_available, is_visible, created_at) VALUES (35, 15, 'Bánh chuối', '', '', 1, 1, '2026-01-28 14:12:49');

-- Data for product_sizes
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (54, 20, 'M', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (55, 20, 'L', 40000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (56, 20, '1L3', 53000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (57, 21, 'M', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (58, 21, 'L', 40000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (59, 21, '1L3', 53000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (60, 22, 'M', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (61, 22, 'L', 40000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (62, 22, '1L3', 53000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (72, 26, 'M', 25000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (73, 26, 'L', 30000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (74, 26, '1L3', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (75, 27, 'M', 30000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (76, 27, 'L', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (77, 27, '1L3', 45000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (78, 28, 'M', 28000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (79, 28, 'L', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (80, 28, '1L3', 45000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (81, 29, 'M', 30000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (82, 29, 'L', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (83, 29, '1L3', 45000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (84, 30, 'M', 28000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (85, 30, 'L', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (86, 30, '1L3', 40000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (87, 31, 'M', 32000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (88, 31, 'L', 37000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (89, 31, '1L3', 48000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (90, 32, 'M', 33000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (91, 32, 'L', 38000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (92, 32, '1L3', 48000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (93, 33, 'Ly 700ml', 25000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (94, 34, 'Ly 700ml', 25000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (95, 25, 'M', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (96, 25, 'L', 42000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (97, 25, '1L3', 60000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (104, 35, 'M', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (105, 35, 'L', 50000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (109, 18, 'M', 30000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (110, 18, 'L', 37000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (111, 18, '1L3', 50000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (115, 24, 'M', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (116, 24, 'L', 42000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (117, 24, '1L3', 60000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (121, 19, 'M', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (122, 19, 'L', 42000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (123, 19, '1L3', 55000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (124, 23, 'M', 35000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (125, 23, 'L', 45000);
INSERT INTO product_sizes (id, product_id, size_name, price) VALUES (126, 23, '1L3', 65000);

-- Data for product_option_links
INSERT INTO product_option_links (product_id, group_id) VALUES (20, 7);
INSERT INTO product_option_links (product_id, group_id) VALUES (20, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (20, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (20, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (21, 7);
INSERT INTO product_option_links (product_id, group_id) VALUES (21, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (21, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (21, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (22, 7);
INSERT INTO product_option_links (product_id, group_id) VALUES (22, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (22, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (22, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (26, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (26, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (26, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (27, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (27, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (27, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (28, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (28, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (28, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (29, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (29, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (29, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (30, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (30, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (30, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (31, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (31, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (31, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (32, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (32, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (32, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (33, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (33, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (33, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (34, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (34, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (34, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (25, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (25, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (25, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (25, 8);
INSERT INTO product_option_links (product_id, group_id) VALUES (18, 7);
INSERT INTO product_option_links (product_id, group_id) VALUES (18, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (18, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (18, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (24, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (24, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (24, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (24, 8);
INSERT INTO product_option_links (product_id, group_id) VALUES (24, 9);
INSERT INTO product_option_links (product_id, group_id) VALUES (19, 7);
INSERT INTO product_option_links (product_id, group_id) VALUES (19, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (19, 5);
INSERT INTO product_option_links (product_id, group_id) VALUES (19, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (23, 8);
INSERT INTO product_option_links (product_id, group_id) VALUES (23, 9);
INSERT INTO product_option_links (product_id, group_id) VALUES (23, 4);
INSERT INTO product_option_links (product_id, group_id) VALUES (23, 6);
INSERT INTO product_option_links (product_id, group_id) VALUES (23, 5);

-- Data for ingredients
INSERT INTO ingredients (id, name, cost_per_gram, updated_at) VALUES (1, 'Banana Mix Powder', 348.04, '2026-01-28 14:37:58');
