-- Fairytale Farms Menu Pricing Updates (from FINAL PDF)

-- Custom Cakes
UPDATE products SET basePrice = 75.00 WHERE slug = 'custom-birthday-cake';
UPDATE products SET basePrice = 150.00 WHERE slug = 'wedding-cake';
UPDATE products SET basePrice = 110.00 WHERE slug = 'themed-celebration-cake';

-- Custom Sugar Cookies - $55 per dozen
UPDATE products SET basePrice = 55.00 WHERE slug = 'decorated-sugar-cookies-dozen';
UPDATE products SET basePrice = 55.00 WHERE slug = 'custom-shaped-sugar-cookies';

-- Brownies - Simple $4, Turtle/S'mores $5 each
UPDATE products SET basePrice = 24.00 WHERE slug = 'fudge-brownies-half-dozen';
UPDATE products SET basePrice = 48.00 WHERE slug = 'fudge-brownies-dozen';

-- Chocolate Covered Strawberries
UPDATE products SET basePrice = 18.00 WHERE slug = 'chocolate-strawberries-half-dozen';
UPDATE products SET basePrice = 30.00 WHERE slug = 'chocolate-strawberries-dozen';

-- Classic Cookies (Non-Decorated) - per dozen
UPDATE products SET basePrice = 18.00 WHERE name LIKE '%Chocolate Chip%' AND categoryId = 120003;
UPDATE products SET basePrice = 20.00 WHERE name LIKE '%Chocolate Crinkle%' AND categoryId = 120003;
UPDATE products SET basePrice = 18.00 WHERE name LIKE '%Sprinkle Sugar%' AND categoryId = 120003;
UPDATE products SET basePrice = 20.00 WHERE name LIKE '%Pecan Sandies%' AND categoryId = 120003;

-- Mini Tin Cakes - $5 each
UPDATE products SET basePrice = 5.00 WHERE name LIKE '%Mini Tin Cake%';

-- Individual Brownies
UPDATE products SET basePrice = 4.00 WHERE name LIKE '%Simple Brownie%';
UPDATE products SET basePrice = 5.00 WHERE name LIKE '%Turtle Brownie%';
UPDATE products SET basePrice = 5.00 WHERE name LIKE '%S_mores Brownie%';
