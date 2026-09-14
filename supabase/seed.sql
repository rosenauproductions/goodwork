insert into public.jobs (id, title, category, requestor, volunteer, status, risk, date, amount, notes)
values
  ('JF-101', 'Exterior car wash', 'Vehicle', 'Kevin Patel', 'Noah B.', 'Needs review', 'Green', 'Oct 14, 2:00 PM', 35, 'Budget and safety details need one final review.'),
  ('JF-102', 'Church welcome table setup', 'Events', 'Grace Church', 'Amelia T.', 'Payment pending', 'Green', 'Oct 6, 9:00 AM', 80, 'Payment was collected but waiting for final confirmation.'),
  ('JF-103', 'Dog walking, two afternoons', 'Pet services', 'Daniel Cho', 'Unassigned', 'Ready to assign', 'Yellow', 'Sat, Oct 12', 60, 'Needs a volunteer and a safety confirmation.'),
  ('JF-104', 'Leaf cleanup and bagging', 'Yard', 'Mara Ellis', 'Jonah R.', 'Awaiting parent', 'Green', 'Today, 4:30 PM', 45, 'Parent approval is pending for the schedule change.')
on conflict (id) do nothing;

insert into public.families (id, name, "familyType", "activeJobs", "totalRaised", "nextStep", contact, status)
values
  ('FAM-101', 'Mara Ellis', 'Service family', 2, 220, 'Parent approval due', 'mara.ellis@example.com', 'Needs follow-up'),
  ('FAM-102', 'Daniel Cho', 'New family', 1, 90, 'Assign volunteer', 'daniel.cho@example.com', 'Healthy'),
  ('FAM-103', 'Grace Church', 'Group partner', 3, 360, 'Payment confirmation', 'hello@gracechurch.org', 'Healthy'),
  ('FAM-104', 'Kevin Patel', 'Returning family', 1, 140, 'Safety review', 'kevin.patel@example.com', 'At risk')
on conflict (id) do nothing;

insert into public.fundraising_goals (id, label, raised, target, status)
values
  ('GOAL-101', 'Roof repair fund', 2160, 3000, 'On pace'),
  ('GOAL-102', 'Youth missions trip', 1440, 3000, 'Needs attention'),
  ('GOAL-103', 'Community meals', 1620, 2000, 'Ahead')
on conflict (id) do nothing;

insert into public.workspace_members (email, display_name, role)
values
  ('rosenauproductions@gmail.com', 'Jordan Miller', 'admin'),
  ('capri2_77@yahoo.com', 'Mara Ellis', 'parent'),
  ('silverlbud@gmail.com', 'Noah B.', 'volunteer')
on conflict (email) do nothing;