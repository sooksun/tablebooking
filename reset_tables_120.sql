-- Reset and create 120 tables (10 rows x 12 columns)
-- Rows: A-J (10 rows)
-- Columns: 1-12 (12 columns)

-- Delete all existing bookings first (foreign key)
DELETE FROM bookings;

-- Delete all existing tables
DELETE FROM tables;

-- Reset sequence for id (if using serial)
-- ALTER SEQUENCE tables_id_seq RESTART WITH 1;

-- Insert 120 tables (10 rows x 12 columns)
-- Row A (A-01 to A-12)
INSERT INTO tables (id, label, status, current_queue_count) VALUES
(1, 'A-01', 'AVAILABLE', 0), (2, 'A-02', 'AVAILABLE', 0), (3, 'A-03', 'AVAILABLE', 0), (4, 'A-04', 'AVAILABLE', 0),
(5, 'A-05', 'AVAILABLE', 0), (6, 'A-06', 'AVAILABLE', 0), (7, 'A-07', 'AVAILABLE', 0), (8, 'A-08', 'AVAILABLE', 0),
(9, 'A-09', 'AVAILABLE', 0), (10, 'A-10', 'AVAILABLE', 0), (11, 'A-11', 'AVAILABLE', 0), (12, 'A-12', 'AVAILABLE', 0),

-- Row B (B-01 to B-12)
(13, 'B-01', 'AVAILABLE', 0), (14, 'B-02', 'AVAILABLE', 0), (15, 'B-03', 'AVAILABLE', 0), (16, 'B-04', 'AVAILABLE', 0),
(17, 'B-05', 'AVAILABLE', 0), (18, 'B-06', 'AVAILABLE', 0), (19, 'B-07', 'AVAILABLE', 0), (20, 'B-08', 'AVAILABLE', 0),
(21, 'B-09', 'AVAILABLE', 0), (22, 'B-10', 'AVAILABLE', 0), (23, 'B-11', 'AVAILABLE', 0), (24, 'B-12', 'AVAILABLE', 0),

-- Row C (C-01 to C-12)
(25, 'C-01', 'AVAILABLE', 0), (26, 'C-02', 'AVAILABLE', 0), (27, 'C-03', 'AVAILABLE', 0), (28, 'C-04', 'AVAILABLE', 0),
(29, 'C-05', 'AVAILABLE', 0), (30, 'C-06', 'AVAILABLE', 0), (31, 'C-07', 'AVAILABLE', 0), (32, 'C-08', 'AVAILABLE', 0),
(33, 'C-09', 'AVAILABLE', 0), (34, 'C-10', 'AVAILABLE', 0), (35, 'C-11', 'AVAILABLE', 0), (36, 'C-12', 'AVAILABLE', 0),

-- Row D (D-01 to D-12)
(37, 'D-01', 'AVAILABLE', 0), (38, 'D-02', 'AVAILABLE', 0), (39, 'D-03', 'AVAILABLE', 0), (40, 'D-04', 'AVAILABLE', 0),
(41, 'D-05', 'AVAILABLE', 0), (42, 'D-06', 'AVAILABLE', 0), (43, 'D-07', 'AVAILABLE', 0), (44, 'D-08', 'AVAILABLE', 0),
(45, 'D-09', 'AVAILABLE', 0), (46, 'D-10', 'AVAILABLE', 0), (47, 'D-11', 'AVAILABLE', 0), (48, 'D-12', 'AVAILABLE', 0),

-- Row E (E-01 to E-12)
(49, 'E-01', 'AVAILABLE', 0), (50, 'E-02', 'AVAILABLE', 0), (51, 'E-03', 'AVAILABLE', 0), (52, 'E-04', 'AVAILABLE', 0),
(53, 'E-05', 'AVAILABLE', 0), (54, 'E-06', 'AVAILABLE', 0), (55, 'E-07', 'AVAILABLE', 0), (56, 'E-08', 'AVAILABLE', 0),
(57, 'E-09', 'AVAILABLE', 0), (58, 'E-10', 'AVAILABLE', 0), (59, 'E-11', 'AVAILABLE', 0), (60, 'E-12', 'AVAILABLE', 0),

-- Row F (F-01 to F-12)
(61, 'F-01', 'AVAILABLE', 0), (62, 'F-02', 'AVAILABLE', 0), (63, 'F-03', 'AVAILABLE', 0), (64, 'F-04', 'AVAILABLE', 0),
(65, 'F-05', 'AVAILABLE', 0), (66, 'F-06', 'AVAILABLE', 0), (67, 'F-07', 'AVAILABLE', 0), (68, 'F-08', 'AVAILABLE', 0),
(69, 'F-09', 'AVAILABLE', 0), (70, 'F-10', 'AVAILABLE', 0), (71, 'F-11', 'AVAILABLE', 0), (72, 'F-12', 'AVAILABLE', 0),

-- Row G (G-01 to G-12)
(73, 'G-01', 'AVAILABLE', 0), (74, 'G-02', 'AVAILABLE', 0), (75, 'G-03', 'AVAILABLE', 0), (76, 'G-04', 'AVAILABLE', 0),
(77, 'G-05', 'AVAILABLE', 0), (78, 'G-06', 'AVAILABLE', 0), (79, 'G-07', 'AVAILABLE', 0), (80, 'G-08', 'AVAILABLE', 0),
(81, 'G-09', 'AVAILABLE', 0), (82, 'G-10', 'AVAILABLE', 0), (83, 'G-11', 'AVAILABLE', 0), (84, 'G-12', 'AVAILABLE', 0),

-- Row H (H-01 to H-12)
(85, 'H-01', 'AVAILABLE', 0), (86, 'H-02', 'AVAILABLE', 0), (87, 'H-03', 'AVAILABLE', 0), (88, 'H-04', 'AVAILABLE', 0),
(89, 'H-05', 'AVAILABLE', 0), (90, 'H-06', 'AVAILABLE', 0), (91, 'H-07', 'AVAILABLE', 0), (92, 'H-08', 'AVAILABLE', 0),
(93, 'H-09', 'AVAILABLE', 0), (94, 'H-10', 'AVAILABLE', 0), (95, 'H-11', 'AVAILABLE', 0), (96, 'H-12', 'AVAILABLE', 0),

-- Row I (I-01 to I-12)
(97, 'I-01', 'AVAILABLE', 0), (98, 'I-02', 'AVAILABLE', 0), (99, 'I-03', 'AVAILABLE', 0), (100, 'I-04', 'AVAILABLE', 0),
(101, 'I-05', 'AVAILABLE', 0), (102, 'I-06', 'AVAILABLE', 0), (103, 'I-07', 'AVAILABLE', 0), (104, 'I-08', 'AVAILABLE', 0),
(105, 'I-09', 'AVAILABLE', 0), (106, 'I-10', 'AVAILABLE', 0), (107, 'I-11', 'AVAILABLE', 0), (108, 'I-12', 'AVAILABLE', 0),

-- Row J (J-01 to J-12)
(109, 'J-01', 'AVAILABLE', 0), (110, 'J-02', 'AVAILABLE', 0), (111, 'J-03', 'AVAILABLE', 0), (112, 'J-04', 'AVAILABLE', 0),
(113, 'J-05', 'AVAILABLE', 0), (114, 'J-06', 'AVAILABLE', 0), (115, 'J-07', 'AVAILABLE', 0), (116, 'J-08', 'AVAILABLE', 0),
(117, 'J-09', 'AVAILABLE', 0), (118, 'J-10', 'AVAILABLE', 0), (119, 'J-11', 'AVAILABLE', 0), (120, 'J-12', 'AVAILABLE', 0);
