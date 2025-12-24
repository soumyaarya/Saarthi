import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    pin: {
        type: String,
        required: true
    },
    name: {
        type: String,
        default: 'User'
    }
}, {
    timestamps: true
});

// Hash PIN before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('pin')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.pin = await bcrypt.hash(this.pin, salt);
});

// Compare entered PIN with hashed PIN
userSchema.methods.matchPin = async function (enteredPin) {
    return await bcrypt.compare(enteredPin, this.pin);
};

const User = mongoose.model('User', userSchema);

export default User;
