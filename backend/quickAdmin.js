// Run: node quickAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

mongoose.connect(process.env.MONGODB_URL).then(async () => {
    const Admin = mongoose.model('Admin', new mongoose.Schema({
        email: String,
        password: String,
        role: String,
        isActive: Boolean
    }));

    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await Admin.create({
        email: 'admin@whatsapp.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true
    });

    console.log('✅ Admin Created!');
    console.log('Email: admin@whatsapp.com');
    console.log('Password: admin123');
    process.exit(0);
}).catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
