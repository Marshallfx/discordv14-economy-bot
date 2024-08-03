const mongoose = require('mongoose');

const balanceSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lastSalary: { type: Date }
});

module.exports = mongoose.model('Balance', balanceSchema);
