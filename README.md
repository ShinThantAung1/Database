# DBS Practical

## Setup

1. Clone this repository

2. Create a .env file with the following content

    ```
    DB_USER=
    DB_PASSWORD=
    DB_HOST=
    DB_DATABASE=
    DB_CONNECTION_LIMIT=1
    PORT=3000
    ```

3. Update the .env content with your database credentials accordingly.

4. Install dependencies by running `npm install`

5. Start the app by running `npm start`. Alternatively to use hot reload, start the app by running `npm run dev`.

6. You should see `App listening on port 3000`

8. (Optional) install the plugins recommended in `.vscode/extensions.json`

## Instructions

Open the page, `http://localhost:3000`, replace the port number accordingly if you app is not listening to port 3000


## CA2 Guide

# Admin

# DashBoard

1. Age Group Spending

- Click on the retrieve age group spending 
- Select the filter as you like 
- the result table will show up at the bottom 


2. Retrieve Customer lifetime Value 

- Click on retrieve customer lifetime value 
- Click on generate to start batch job 
- Go Pgadmin and look up the member table you will see the customer lifetime values there

# Sale Order

- There are filters that you can use to search 
- After the setting the filter click on button to filter the sale orders


# User

# Product 

1. Products

- Go to product tab 
- Click on show all product 
- There are option to view product, add to favourite and add to cart
- If you click view product, you will reach to product page
- If you click add to favourite, you will be directed to add to favourite page asking for product id but it will be automatically entered
- click on the add to favourite to add it
- If you click add to cart, you will reach to add to cart page

# Review

1. Create Review 

- Click on create review 
- Select the item you want to create review by click on 'Create Review' button 
- The product id will be automatically entered
- Enter the order id of that product order
- Enter rating between 1 to 5
- Enter the review text as you like 
- After that click create to create review 


2. Retrieve Review

- Click on retrieve all my review 
- You will be directed to retrieve all my review page 
- If you have create some review you will see those there
- For each review you can update or delete the review
- If you click update , you will be directed to update review page 
- you have to enter the review id that you want to update , the rating that you want to set again and the review text you want to change
- After that click update to fully update the view
- If you click delete, you will be directed to delete review page
- you have to enter review id that you want to delete after that click on delete button to delete it.

# Favourite

# Favourite page

- When you entered the favourite page you will see the items that you have favourited
- If you don't have any you can favourite the items in product page
- After doing that, you will see them
- For each item, there will be button to view product, remove from favourite and add to cart
- The view product and add to cart buttons are same as the one from product page
- If you click on the remove from favourite, it will automatically remove the item and refresh the page

# Cart

- Firstly add any product you like to the cart
- After adding, you can go to cart page to see your products
- You change the quantity as you like and click on update button to update the product's quantity
- If you want to delete that product, you can click on the delete button to delete it
- If you have multiple products, click on the select all and click bulk update to update them or bulk delete
- There is a cart summary of what you have shown under below 
- You can click on check out button to checkout

# Checkout

- When you are at the checkout page there are multiple shipping options, you can choose anyone you like
- Put in payment detail to complete purchase 
- After complete purchasing, you order will be entered into the database

