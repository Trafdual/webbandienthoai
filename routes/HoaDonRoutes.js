const express = require('express')
const router = express.Router()
const HoaDon = require('../models/HoaDonModel')
const moment = require('moment')
const MaGiamGia = require('../models/MaGiamGiaModel')
const SanPham = require('../models/chitietSpModel')
const DungLuong = require('../models/DungLuongModel')
const momenttimezone = require('moment-timezone')

function sortObject (obj) {
  let sorted = {}
  let str = []
  let key
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key))
    }
  }
  str.sort()
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+')
  }
  return sorted
}

router.get('/gethoadon', async (req, res) => {
  try {
    const hoadon = await HoaDon.hoadon.find().lean()
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình xóa' })
  }
})

router.post('/posthoadon', async (req, res) => {
  try {
    const {
      name,
      phone,
      sex,
      giaotannoi,
      address,
      ghichu,
      magiamgia,
      sanphams
    } = req.body

    const hoadon = new HoaDon.hoadon({
      name,
      phone,
      sex,
      giaotannoi,
      ngaymua: moment().toISOString(),
      trangthai: 'Đang xử lý',
      tongtien: 0
    })
    let tongtien = 0

    for (const sanpham of sanphams) {
      const { idsp, soluong } = sanpham
      const sanpham1 = await SanPham.ChitietSp.findById(idsp)
      hoadon.sanpham.push({ idsp, soluong, price: sanpham1.price })
      tongtien += sanpham1.price * soluong
    }

    hoadon.tongtien = tongtien

    if (magiamgia) {
      const magiamgia1 = await MaGiamGia.magiamgia.findOne({ magiamgia })
      const ngayHienTai = moment()
      const ngayKetThuc = moment(magiamgia1.ngayketthuc)

      if (ngayHienTai.isAfter(ngayKetThuc)) {
        return res.json({ message: 'Mã giảm giá đã hết hạn' })
      }
      const daSuDung = await HoaDon.hoadon.findOne({ phone, magiamgia })
      if (daSuDung) {
        return res
          .status(400)
          .json({ message: 'Bạn đã sử dụng mã giảm giá này' })
      }
      hoadon.magiamgia = magiamgia
      const giamGia = magiamgia1.sophantram / 100
      hoadon.tongtien = tongtien - tongtien * giamGia
    }

    if (giaotannoi) {
      hoadon.address = address
    }
    if (ghichu) {
      hoadon.ghichu = ghichu
    }

    await hoadon.save()
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi trong quá trình thêm' })
  }
})

router.post('/create_payment_url', async (req, res) => {
  process.env.TZ = 'Asia/Ho_Chi_Minh'

  let date = new Date()
  let createDate = moment(date).format('YYYYMMDDHHmmss')

  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress

  let config = require('config')

  let tmnCode = config.get('vnp_TmnCode')
  let secretKey = config.get('vnp_HashSecret')
  let vnpUrl = config.get('vnp_Url')
  let returnUrl = config.get('vnp_ReturnUrl')
  let orderId = moment(date).format('DDHHmmss')
  let amount = req.body.amount
  let bankCode = req.body.bankCode

  let locale = 'vn'
  const { name, phone, sex, giaotannoi, address, ghichu, magiamgia, sanphams } =
    req.body

  let currCode = 'VND'
  let vnp_Params = {}
  vnp_Params['vnp_Version'] = '2.1.0'
  vnp_Params['vnp_Command'] = 'pay'
  vnp_Params['vnp_TmnCode'] = tmnCode
  vnp_Params['vnp_Locale'] = locale
  vnp_Params['vnp_CurrCode'] = currCode
  vnp_Params['vnp_TxnRef'] = orderId
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId
  vnp_Params['vnp_OrderType'] = 'other'
  vnp_Params['vnp_Amount'] = amount * 100
  vnp_Params['vnp_ReturnUrl'] = returnUrl
  vnp_Params['vnp_IpAddr'] = ipAddr
  vnp_Params['vnp_CreateDate'] = createDate
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode
  }
  const ngaymua = momenttimezone().toDate()
  const hoadon = new HoaDon.hoadon({
    name,
    phone,
    sex,
    giaotannoi,
    ngaymua,
    trangthai: 'Đang xử lý',
    tongtien: 0,
    orderId
  })

  hoadon.maHDL = 'HD' + hoadon._id.toString().slice(-4)
  let tongtien = 0

  for (const sanpham of sanphams) {
    const { idsp, soluong, dungluong, mausac, price } = sanpham
    hoadon.sanpham.push({
      idsp,
      soluong,
      price,
      dungluong,
      mausac
    })
    tongtien += price * soluong
  }

  hoadon.tongtien = tongtien

  if (magiamgia) {
    const magiamgia1 = await MaGiamGia.magiamgia.findOne({ magiamgia })
    if (!magiamgia1) {
      return res.json({ message: 'Mã giảm giá không tồn tại' })
    }

    if (magiamgia1.soluong <= 0) {
      return res.json({ message: 'Mã giảm giá đã hết' })
    }

    const ngayHienTai = moment()
    const ngayKetThuc = moment(magiamgia1.ngayketthuc)

    if (ngayHienTai.isAfter(ngayKetThuc)) {
      return res.json({ message: 'Mã giảm giá đã hết hạn' })
    }
    const daSuDung = await HoaDon.hoadon.findOne({ phone, magiamgia })
    if (daSuDung) {
      return res.json({ message: 'Bạn đã sử dụng mã giảm giá này' })
    }
    hoadon.magiamgia = magiamgia
    const giamGia = magiamgia1.sophantram / 100
    hoadon.tongtien = tongtien - tongtien * giamGia
  }

  if (giaotannoi) {
    hoadon.address = address
  }
  if (ghichu) {
    hoadon.ghichu = ghichu
  }

  await hoadon.save()

  vnp_Params = sortObject(vnp_Params)

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')
  vnp_Params['vnp_SecureHash'] = signed
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false })

  res.json(vnpUrl)
})

router.get('/vnpay_return', async (req, res) => {
  let vnp_Params = req.query

  let secureHash = vnp_Params['vnp_SecureHash']
  let orderId = vnp_Params['vnp_TxnRef']
  let hoadon = await HoaDon.hoadon.findOne({ orderId: orderId })
  let magiamgia = await MaGiamGia.magiamgia.findOne({
    magiamgia: hoadon.magiamgia
  })

  delete vnp_Params['vnp_SecureHash']
  delete vnp_Params['vnp_SecureHashType']
  vnp_Params = sortObject(vnp_Params)

  let config = require('config')
  let secretKey = config.get('vnp_HashSecret')

  let querystring = require('qs')
  let signData = querystring.stringify(vnp_Params, { encode: false })
  let crypto = require('crypto')
  let hmac = crypto.createHmac('sha512', secretKey)
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex')

  if (secureHash === signed) {
    if (vnp_Params['vnp_ResponseCode'] === '00') {
      hoadon.thanhtoan = true
      magiamgia.soluong = magiamgia.soluong - 1
      await magiamgia.save()
      await hoadon.save()

      res.redirect('http://localhost:3000/thanhcong')
    }
  } else {
    res.redirect('http://localhost:3000/thanhcong')
  }
})

router.post('/settrangthai/:idhoadon', async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon
    const { trangthai } = req.body
    const hoadon = await HoaDon.hoadon.findById(idhoadon)
    hoadon.trangthai = trangthai
    await hoadon.save()
    res.json(hoadon)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'lỗi' })
  }
})

router.get('/getchitiethd/:idhoadon', async (req, res) => {
  try {
    const idhoadon = req.params.idhoadon

    const hoadon = await HoaDon.hoadon.findById(idhoadon)
    const hoadonsanpham = await Promise.all(
      hoadon.sanpham.map(async sanpham => {
        const sanpham1 = await SanPham.ChitietSp.findById(sanpham.idsp)
        const dungluong = await DungLuong.dungluong.findById(sanpham.dungluong)
        return {
          namesanpham: sanpham1.name,
          dungluong: dungluong.name,
          mausac: sanpham.mausac,
          soluong: sanpham.soluong,
          price: sanpham.price
        }
      })
    )
    const hoadonjson = {
      name: hoadon.name,
      phone: hoadon.phone,
      sex: hoadon.sex,
      address: hoadon.address,
      ghichu: hoadon.ghichu || '',
      magiamgia: hoadon.magiamgia || '',
      ngaymua: moment(hoadon.ngaymua).format('DD/MM/YYYY'),
      thanhtoan: hoadon.thanhtoan,
      trangthai: hoadon.trangthai,
      tongtien: hoadon.tongtien,
      hoadonsanpham: hoadonsanpham
    }
    res.json(hoadonjson)
  } catch (error) {
    console.error(error)
  }
})

router.get('/getdoanhthu', async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'Vui lòng nhập ngày bắt đầu và ngày kết thúc.' })
    }

    const start = moment(startDate, 'YYYY-MM-DD').startOf('day')
    const end = moment(endDate, 'YYYY-MM-DD').endOf('day')

    const hoadons = await HoaDon.hoadon.find({
      ngaymua: { $gte: start.toDate(), $lte: end.toDate() }
    })

    let doanhthuTheoNgay = {}
    let current = moment(start)

    while (current.isSameOrBefore(end, 'day')) {
      doanhthuTheoNgay[current.format('DD/MM/YYYY')] = 0
      current.add(1, 'days')
    }

    hoadons.forEach(hd => {
      const ngay = moment(hd.ngaymua).format('DD/MM/YYYY')
      doanhthuTheoNgay[ngay] += hd.tongtien
    })

    const doanhthuArray = Object.keys(doanhthuTheoNgay).map(ngay => ({
      ngay,
      doanhthu: doanhthuTheoNgay[ngay]
    }))

    res.json(doanhthuArray)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Lỗi server!' })
  }
})

router.post('/timkiemhoadon', async (req, res) => {
  try {
    const { phone } = req.body
    const hoadon = await HoaDon.hoadon.find({ phone })
    if (!hoadon) {
      return res.json({
        message: 'Không có đơn hàng tương ứng với số điện thoại'
      })
    }
    res.json(hoadon)
  } catch (error) {
    console.error(error)
  }
})

module.exports = router
