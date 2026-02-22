require('dotenv').config();

// Use Google DNS to resolve MongoDB Atlas SRV records
// (local DNS servers often can't resolve SRV records)
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn('⚠️  Server will continue in limited mode without DB.');
  }
};

module.exports = connectDB;
