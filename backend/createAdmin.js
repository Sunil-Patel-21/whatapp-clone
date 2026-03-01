const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const adminSchema = new mongoose.Schema({
    email: String,
    password: String,
    role: String,
    isActive: Boolean,
    lastLogin: Date
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminSchema);

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('✅ Database connected');

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: 'admin@whatsapp.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('Use password: admin123');
            process.exit(0);
        }

        // Create new admin
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const admin = new Admin({
            email: 'admin@whatsapp.com',
            password: hashedPassword,
            role: 'super_admin',
            isActive: true
        });

        await admin.save();
        
        console.log('✅ Admin created successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email: admin@whatsapp.com');
        console.log('🔑 Password: admin123');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 Login URL: http://localhost:5173/admin/login');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

createAdmin();
