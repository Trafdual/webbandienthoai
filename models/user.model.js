const db = require('./db')

const userSchema = new db.mongoose.Schema({
  hovaten: { type: String },
  phone: { type: String },
  email: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  hoadon: [{ type: db.mongoose.Schema.Types.ObjectId, ref: 'hoadon' }],
  date: { type: String }
})

const User = db.mongoose.model('user', userSchema)
module.exports = { User }
