const express = require('express')
const router = express.Router()
const MauSac = require('../models/MauSacModel')
const DungLuong = require('../models/dungluongModel')

router.post('/postmausac/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    const { name } = req.body
    const mausac = new MauSac.mausac({ name })
    dungluong.mausac.push(mausac._id)
    await mausac.save()
    await dungluong.save()
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/mausac/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong
    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    const mausac = await Promise.all(
      dungluong.mausac.map(async ms => {
        const maus = await MauSac.mausac.findById(ms._id)
        return {
          _id: maus._id,
          name: maus.name
        }
      })
    )
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/putmausac/:idmausac', async (req, res) => {
  try {
    const { name } = req.body
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    mausac.name = name
    await mausac.save()
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deletemausac/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    const dungluong = await DungLuong.dungluong.findById(mausac.dungluong)
    dungluong.mausac = dungluong.mausac.filter(
      dungluong => dungluong._id.toString() !== idmausac
    )
    await MauSac.mausac.findByIdAndDelete(idmausac)
    await dungluong.save()
    res.json({ message: 'Xóa thành công' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

module.exports = router
