const db = require('./db')

const LoaiSPSchema = new db.mongoose.Schema({
  name: { type: String },
  chitietsp: [{ type: db.mongoose.Schema.Types.ObjectId, ref: 'chitietsp' }],
  manhinh: { type: String },
  chip: { type: String },
  ram: { type: String },
  dungluong: { type: String },
  camera: { type: String },
  pinsac: { type: String },
  congsac: { type: String },
  hang: { type: String },
  thongtin: { type: String },
  dungluongmay: [{ type: db.mongoose.Schema.Types.ObjectId, ref: 'dungluong' }]
})

const LoaiSP = db.mongoose.model('loaisp', LoaiSPSchema)
module.exports = { LoaiSP }
