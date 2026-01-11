-- Update Custom Cakes pricing
UPDATE products SET basePrice = 75.00 WHERE name = 'Custom Birthday Cake';
UPDATE products SET basePrice = 110.00 WHERE name = 'Themed Celebration Cake';
UPDATE products SET basePrice = 150.00 WHERE name = 'Wedding Cake';

-- Update Sugar Cookies pricing
UPDATE products SET basePrice = 55.00 WHERE name LIKE '%Decorated Sugar Cookies%';
UPDATE products SET basePrice = 55.00 WHERE name LIKE '%Custom Shaped Sugar Cookies%';

-- Update Chocolate Covered Strawberries pricing
UPDATE products SET basePrice = 30.00 WHERE name LIKE '%Chocolate Covered Strawberries%';
UPDATE products SET basePrice = 30.00 WHERE categoryId = (SELECT id FROM categories WHERE slug = 'chocolate-covered-strawberries');
