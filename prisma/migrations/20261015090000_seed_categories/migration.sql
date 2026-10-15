INSERT INTO categories (name) VALUES
  ('อาหาร'),
  ('เดินทาง'),
  ('ช้อปปิ้ง'),
  ('บิล/สาธารณูปโภค'),
  ('สุขภาพ'),
  ('บันเทิง'),
  ('อื่นๆ')
ON CONFLICT (name) DO NOTHING;
