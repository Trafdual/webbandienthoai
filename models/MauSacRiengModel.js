const db = require('./db')

const mausacriengSchema = new db.mongoose.Schema({
  name: { type: String },
  price:{type:String}
})

const mausacrieng = db.mongoose.model('mausacrieng', mausacriengSchema
)
module.exports = { mausacrieng }
