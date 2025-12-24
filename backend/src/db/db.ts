import mongoose from 'mongoose';

async function connectToDB(): Promise<void> {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to DB');
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
}

export default connectToDB;
