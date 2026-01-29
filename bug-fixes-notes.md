# Bug Fixes Notes

## Issue 1: Navigation dropdown not closing

- The category filter pills at the top of the Products page are sticky (top-16 z-20)
- They stay visible when scrolling, which is expected behavior
- User may be referring to these category pills as "dropdown" - they should be in a collapsible dropdown instead of always visible

## Issue 2: View All button not working

- The View All button in CategorySection uses Link href={`/products?category=${category.id}`}
- This should work, but the Link component may need onClick handler to work properly
- The button is wrapped in a Link but the Button itself may be capturing the click

## Issue 3: Custom cake goes to product detail instead of inquiry

- Custom cakes show $110 price and go to /products/custom-birthday-cake
- Should instead go to the chatbot inquiry or a custom order form
- Need to check if custom cakes have isCustomizable flag and redirect accordingly

## Solutions:

1. Make category filter pills collapsible or use a proper dropdown
2. Fix View All button to properly navigate
3. For custom cakes, redirect to chatbot/inquiry instead of product detail
