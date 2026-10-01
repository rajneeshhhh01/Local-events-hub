-- Demo data, run after schema.sql
USE local_events_hub;

-- Admin password is Admin123, user password is User1234
INSERT INTO users (name, email, password_hash, role) VALUES
('Event Admin', 'admin@localevents.example', '$2a$10$VCWzkGwgdVOOprhScIuvH.Azm5ZeF8T0iA4vgFIQuXPEk2zHjl636', 'admin'),
('Priya Staff', 'priya@localevents.example', '$2a$10$VCWzkGwgdVOOprhScIuvH.Azm5ZeF8T0iA4vgFIQuXPEk2zHjl636', 'admin'),
('Sam Taylor', 'sam@example.com', '$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.', 'user'),
('Lee Nguyen', 'lee@example.com', '$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.', 'user'),
('Mia Brown', 'mia@example.com', '$2a$10$by9Ce9X2dydoHUcxS2j7m.0wD8l56pJvd.LHMkLZwqHDHKAXCbkB.', 'user');

INSERT INTO categories (name) VALUES
('Music'), ('Food and Market'), ('Sport'), ('Workshop'), ('Family'), ('Arts');

INSERT INTO events (title, description, category_id, venue, event_date, event_time, total_tickets, price, status, created_by) VALUES
('Spring Night Market', 'Street food, local farmers and handmade goods under the lights. Live acoustic music from 6pm. Bring the whole family.', 2, 'Town Square', '2026-10-17', '17:00', 400, 0.00, 'open', 1),
('Jazz by the River', 'An evening of smooth jazz with three local bands. Bring a picnic rug. Drinks and snacks for sale.', 1, 'Riverside Park Stage', '2026-10-24', '18:30', 250, 15.00, 'open', 1),
('Kids Coding Workshop', 'A fun two hour workshop for kids aged 8 to 12. Learn to make a small game with Scratch. Laptops are given.', 4, 'City Library Room 2', '2026-10-31', '10:00', 20, 5.00, 'open', 2),
('Community Fun Run 5K', 'A 5 km fun run and walk around the lake. All ages and all speeds. Medal for every finisher.', 3, 'Lakeside Reserve', '2026-11-08', '07:30', 300, 10.00, 'open', 1),
('Halloween Family Party', 'Costume parade, face painting, games and a small haunted house for kids. Prize for the best costume.', 5, 'Community Hall', '2026-10-31', '16:00', 150, 0.00, 'open', 2),
('Photography Walk', 'Walk through the old town with a local photographer. Learn tips for better photos with your phone.', 6, 'Meet at Clock Tower', '2026-11-14', '09:00', 25, 0.00, 'open', 1),
('Summer Rock Festival', 'Five rock bands on one stage. Food trucks and a chill zone. 18+ only after 8pm.', 1, 'Showground', '2026-12-05', '14:00', 1000, 35.00, 'open', 1),
('Pottery for Beginners', 'Make your own bowl and cup. All clay and tools are included. Pieces are ready to take home after 2 weeks.', 4, 'Art Centre Studio', '2026-11-21', '13:00', 12, 40.00, 'open', 2),
('Christmas Carols Night', 'Sing carols with the town choir. Candles are given at the gate. Gold coin donation for the food bank.', 1, 'Town Square', '2026-12-19', '19:00', 600, 0.00, 'open', 1),
('Winter Food Festival', 'Hot soups, curries and desserts from 20 local cafes. This event has finished.', 2, 'Town Square', '2026-07-11', '11:00', 500, 0.00, 'open', 1),
('Basketball 3 on 3', 'Street basketball competition for teams of three. Register as a team or join on the day.', 3, 'Youth Centre Courts', '2026-11-28', '09:00', 64, 0.00, 'open', 1),
('Old Movie Night (moved)', 'Classic film under the stars. This event is closed because of the weather.', 6, 'Riverside Park', '2026-10-10', '19:30', 200, 0.00, 'closed', 1);

INSERT INTO ticket_requests (event_id, user_id, quantity, note, status, updated_by) VALUES
(1, 3, 4, 'Two adults and two kids', 'approved', 1),
(2, 3, 2, NULL, 'pending', NULL),
(3, 4, 1, 'My son is 9', 'approved', 2),
(4, 4, 2, NULL, 'pending', NULL),
(5, 5, 3, 'We need a pram space', 'pending', NULL),
(7, 5, 2, NULL, 'rejected', 1),
(8, 3, 1, NULL, 'cancelled', 3);

INSERT INTO activity_log (user_id, action, item_type, item_id, details) VALUES
(1, 'create', 'event', 1, 'Added event: Spring Night Market'),
(1, 'create', 'event', 2, 'Added event: Jazz by the River'),
(2, 'create', 'event', 3, 'Added event: Kids Coding Workshop'),
(3, 'create', 'ticket_request', 1, 'Asked for 4 tickets for event 1'),
(1, 'approved', 'ticket_request', 1, 'Request approved'),
(2, 'approved', 'ticket_request', 3, 'Request approved'),
(1, 'rejected', 'ticket_request', 6, 'Request rejected'),
(3, 'cancel', 'ticket_request', 7, 'Request cancelled');
