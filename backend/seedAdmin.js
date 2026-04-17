require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('DB connected');
        const exist = await Admin.findOne({ username: 'admin' });
        if (!exist) {
            await Admin.create({ username: 'admin', password: 'password123' });
            console.log('Admin user created: admin / password123');
        } else {
            console.log('Admin already exists');
        }
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
