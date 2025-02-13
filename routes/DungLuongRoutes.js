const express = require('express')
const router = express.Router()
const DungLuong = require('../models/dungluongModel')
const LoaiSP = require('../models/LoaiSanPham')
const MauSac = require('../models/MauSacModel')

router.post('/postdungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp
    const { name } = req.body
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp)
    const dungluong = new DungLuong.dungluong({ name })
    loaisp.dungluongmay.push(dungluong._id)
    await dungluong.save()
    await loaisp.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/editdungluong/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong
    const { name } = req.body
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    dungluong.name = name
    await dungluong.save()
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/dungluong/:idloaisp', async (req, res) => {
  try {
    const idloaisp = req.params.idloaisp
    const loaisp = await LoaiSP.LoaiSP.findById(idloaisp)
    const dungluong = await Promise.all(
      loaisp.dungluongmay.map(async dl => {
        const dluong = await DungLuong.dungluong.findById(dl._id)
        return {
          _id: dluong._id,
          name: dluong.name
        }
      })
    )
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deletedungluong/:iddungluong/:idloaisp', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong
    const idloaisp = req.params.idloaisp
    const loaisp = await LoaiSP.TenSP.findById(idloaisp)
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    loaisp.dungluongmay = loaisp.dungluongmay.filter(
      dungluong1 => dungluong1.toString() !== dungluong._id
    )
    await Promise.all(
      dungluong.mausac.map(async mausac => {
        await MauSac.mausac.findByIdAndDelete(mausac._id)
      })
    )
    await loaisp.save()
    await DungLuong.dungluong.findByIdAndDelete(iddungluong)
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})


module.exports = router
