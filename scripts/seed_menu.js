const mongoose = require('mongoose');
const Menu = require('../models/Menu');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dummyDishes = [
    {
        name: "Paneer Tikka",
        category: "Starters",
        price: 280,
        description: "Marinated cottage cheese cubes grilled to perfection with Indian spices.",
        image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Butter Chicken",
        category: "Main Course",
        price: 350,
        description: "Tender chicken pieces cooked in a rich, creamy tomato gravy.",
        image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: false,
        isAvailable: true
    },
    {
        name: "Dal Makhani",
        category: "Main Course",
        price: 240,
        description: "Creamy black lentils simmered overnight with butter and cream.",
        image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Garlic Naan",
        category: "Breads",
        price: 60,
        description: "Soft Indian bread topped with chopped garlic and coriander.",
        image: "https://images.unsplash.com/photo-1626074353765-517a681e40be?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Veg Biryani",
        category: "Rice",
        price: 220,
        description: "Aromatic basmati rice cooked with mixed vegetables and spices.",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: true,
        isAvailable: true
    },
    {
        name: "Gulab Jamun",
        category: "Desserts",
        price: 120,
        description: "Soft milk dumplings soaked in rose-flavored sugar syrup.",
        image: "https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        isVegetarian: true,
        isAvailable: true
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing items? Optional. Let's append or upsert.
        // For now, let's just insert.
        // await Menu.deleteMany({}); 

        for (const dish of dummyDishes) {
            // Check if exists to avoid duplicates
            const exists = await Menu.findOne({ name: dish.name });
            if (!exists) {
                await Menu.create(dish);
                console.log(`Added: ${dish.name}`);
            } else {
                console.log(`Skipped (Exists): ${dish.name}`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDB();
