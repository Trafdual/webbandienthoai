const express = require('express')
const router = express.Router()
const MauSacRieng = require('../models/MauSacRiengModel')
const SP = require('../models/chitietSpModel')

router.post('/postmausacrieng/:idsp', async (req, res) => {
  try {
    const idsp = req.params.idsp
    const sanpham = await SP.ChitietSp.findById(idsp)
    const { name, price } = req.body
    const mausacrieng = new MauSacRieng.mausacrieng({ name, price })
    sanpham.mausacrieng.push(mausacrieng._id)
    await mausacrieng.save()
    await sanpham.save()
    res.json(mausacrieng)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/getmausacrieng/:tieude', async (req, res) => {
  try {
    const tieude = req.params.tieude
    const sanpham = await SP.ChitietSp.findOne({ namekhongdau: tieude })
    const mausacrieng = await Promise.all(
      sanpham.mausacrieng.map(async msr => {
        const mausac = await MauSacRieng.mausacrieng.findById(msr._id)
        return {
          _id: mausac._id,
          name: mausac.name,
          price: mausac.price
        }
      })
    )
    res.json(mausacrieng)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})
module.exports = router
