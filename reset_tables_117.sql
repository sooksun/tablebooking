-- Reset and create 117 tables (9 rows x 13 columns)
-- Rows: A-I (9 rows)
-- Columns: 1-13 (13 columns)

DELETE FROM bookings;
DELETE FROM tables;

INSERT INTO tables (id, label, status, current_queue_count) VALUES
(1, 'A-01', 'AVAILABLE', 0), (2, 'A-02', 'AVAILABLE', 0), (3, 'A-03', 'AVAILABLE', 0), (4, 'A-04', 'AVAILABLE', 0),
(5, 'A-05', 'AVAILABLE', 0), (6, 'A-06', 'AVAILABLE', 0), (7, 'A-07', 'AVAILABLE', 0), (8, 'A-08', 'AVAILABLE', 0),
(9, 'A-09', 'AVAILABLE', 0), (10, 'A-10', 'AVAILABLE', 0), (11, 'A-11', 'AVAILABLE', 0), (12, 'A-12', 'AVAILABLE', 0), (13, 'A-13', 'AVAILABLE', 0),

(14, 'B-01', 'AVAILABLE', 0), (15, 'B-02', 'AVAILABLE', 0), (16, 'B-03', 'AVAILABLE', 0), (17, 'B-04', 'AVAILABLE', 0),
(18, 'B-05', 'AVAILABLE', 0), (19, 'B-06', 'AVAILABLE', 0), (20, 'B-07', 'AVAILABLE', 0), (21, 'B-08', 'AVAILABLE', 0),
(22, 'B-09', 'AVAILABLE', 0), (23, 'B-10', 'AVAILABLE', 0), (24, 'B-11', 'AVAILABLE', 0), (25, 'B-12', 'AVAILABLE', 0), (26, 'B-13', 'AVAILABLE', 0),

(27, 'C-01', 'AVAILABLE', 0), (28, 'C-02', 'AVAILABLE', 0), (29, 'C-03', 'AVAILABLE', 0), (30, 'C-04', 'AVAILABLE', 0),
(31, 'C-05', 'AVAILABLE', 0), (32, 'C-06', 'AVAILABLE', 0), (33, 'C-07', 'AVAILABLE', 0), (34, 'C-08', 'AVAILABLE', 0),
(35, 'C-09', 'AVAILABLE', 0), (36, 'C-10', 'AVAILABLE', 0), (37, 'C-11', 'AVAILABLE', 0), (38, 'C-12', 'AVAILABLE', 0), (39, 'C-13', 'AVAILABLE', 0),

(40, 'D-01', 'AVAILABLE', 0), (41, 'D-02', 'AVAILABLE', 0), (42, 'D-03', 'AVAILABLE', 0), (43, 'D-04', 'AVAILABLE', 0),
(44, 'D-05', 'AVAILABLE', 0), (45, 'D-06', 'AVAILABLE', 0), (46, 'D-07', 'AVAILABLE', 0), (47, 'D-08', 'AVAILABLE', 0),
(48, 'D-09', 'AVAILABLE', 0), (49, 'D-10', 'AVAILABLE', 0), (50, 'D-11', 'AVAILABLE', 0), (51, 'D-12', 'AVAILABLE', 0), (52, 'D-13', 'AVAILABLE', 0),

(53, 'E-01', 'AVAILABLE', 0), (54, 'E-02', 'AVAILABLE', 0), (55, 'E-03', 'AVAILABLE', 0), (56, 'E-04', 'AVAILABLE', 0),
(57, 'E-05', 'AVAILABLE', 0), (58, 'E-06', 'AVAILABLE', 0), (59, 'E-07', 'AVAILABLE', 0), (60, 'E-08', 'AVAILABLE', 0),
(61, 'E-09', 'AVAILABLE', 0), (62, 'E-10', 'AVAILABLE', 0), (63, 'E-11', 'AVAILABLE', 0), (64, 'E-12', 'AVAILABLE', 0), (65, 'E-13', 'AVAILABLE', 0),

(66, 'F-01', 'AVAILABLE', 0), (67, 'F-02', 'AVAILABLE', 0), (68, 'F-03', 'AVAILABLE', 0), (69, 'F-04', 'AVAILABLE', 0),
(70, 'F-05', 'AVAILABLE', 0), (71, 'F-06', 'AVAILABLE', 0), (72, 'F-07', 'AVAILABLE', 0), (73, 'F-08', 'AVAILABLE', 0),
(74, 'F-09', 'AVAILABLE', 0), (75, 'F-10', 'AVAILABLE', 0), (76, 'F-11', 'AVAILABLE', 0), (77, 'F-12', 'AVAILABLE', 0), (78, 'F-13', 'AVAILABLE', 0),

(79, 'G-01', 'AVAILABLE', 0), (80, 'G-02', 'AVAILABLE', 0), (81, 'G-03', 'AVAILABLE', 0), (82, 'G-04', 'AVAILABLE', 0),
(83, 'G-05', 'AVAILABLE', 0), (84, 'G-06', 'AVAILABLE', 0), (85, 'G-07', 'AVAILABLE', 0), (86, 'G-08', 'AVAILABLE', 0),
(87, 'G-09', 'AVAILABLE', 0), (88, 'G-10', 'AVAILABLE', 0), (89, 'G-11', 'AVAILABLE', 0), (90, 'G-12', 'AVAILABLE', 0), (91, 'G-13', 'AVAILABLE', 0),

(92, 'H-01', 'AVAILABLE', 0), (93, 'H-02', 'AVAILABLE', 0), (94, 'H-03', 'AVAILABLE', 0), (95, 'H-04', 'AVAILABLE', 0),
(96, 'H-05', 'AVAILABLE', 0), (97, 'H-06', 'AVAILABLE', 0), (98, 'H-07', 'AVAILABLE', 0), (99, 'H-08', 'AVAILABLE', 0),
(100, 'H-09', 'AVAILABLE', 0), (101, 'H-10', 'AVAILABLE', 0), (102, 'H-11', 'AVAILABLE', 0), (103, 'H-12', 'AVAILABLE', 0), (104, 'H-13', 'AVAILABLE', 0),

(105, 'I-01', 'AVAILABLE', 0), (106, 'I-02', 'AVAILABLE', 0), (107, 'I-03', 'AVAILABLE', 0), (108, 'I-04', 'AVAILABLE', 0),
(109, 'I-05', 'AVAILABLE', 0), (110, 'I-06', 'AVAILABLE', 0), (111, 'I-07', 'AVAILABLE', 0), (112, 'I-08', 'AVAILABLE', 0),
(113, 'I-09', 'AVAILABLE', 0), (114, 'I-10', 'AVAILABLE', 0), (115, 'I-11', 'AVAILABLE', 0), (116, 'I-12', 'AVAILABLE', 0), (117, 'I-13', 'AVAILABLE', 0);
