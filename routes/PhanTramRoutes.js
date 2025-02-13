const express = require('express')
const router = express.Router()
const MauSac = require('../models/MauSacModel')
const DungLuong = require('../models/dungluongModel')

router.post('/postphantram/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    const { name, price } = req.body
    mausac.chitiet.push({ name, price })
    await mausac.save()
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/postphantram2/:iddungluong', async (req, res) => {
  try {
    const iddungluong = req.params.iddungluong

    const dungluong = await DungLuong.dungluong.findById(iddungluong)
    const { name, price } = req.body
    await Promise.all(
      dungluong.mausac.map(async mausac => {
        const mausac1 = await MauSac.mausac.findById(mausac._id)
        mausac1.chitiet.push({ name, price })
        await mausac1.save()
      })
    )
    res.json(dungluong)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.get('/phantram/:idmausac', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const mausac = await MauSac.mausac.findById(idmausac)
    const phantram = await Promise.all(
      mausac.chitiet.map(ct => {
        return {
          _id: ct._id,
          name: ct.name,
          price: ct.price
        }
      })
    )
    res.json(phantram)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/editphantram/:idmausac/:id', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const id = req.params.id
    const { name, price } = req.body
    const mausac = await MauSac.mausac.findById(idmausac)
    const index = mausac.chitiet.findIndex(ct => ct._id.toString() === id)

    if (index !== -1) {
      mausac.chitiet[index].name = name
      mausac.chitiet[index].price = price
    } else {
      return res
        .status(404)
        .json({ message: 'Không tìm thấy id trong danh sách phần trăm' })
    }
    await mausac.save()

    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

router.post('/deletephantram/:idmausac/:id', async (req, res) => {
  try {
    const idmausac = req.params.idmausac
    const id = req.params.id
    const mausac = await MauSac.mausac.findById(idmausac)
    mausac.chitiet = mausac.chitiet.filter(c => c._id.toString() !== id)
    await mausac.save()
    res.json(mausac)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: `Đã xảy ra lỗi: ${error}` })
  }
})

module.exports = router
