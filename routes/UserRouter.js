const router = require('express').Router()
const bcrypt = require('bcryptjs')
const User = require('../models/user.model')
router.post('/register', async (req, res) => {
  try {
    const { hovaten, email, password, role, phone } = req.body

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' })
    }
    const exitphone = await User.User.findOne({ phone })
    if (exitphone) {
      return res.status(400).json({ message: 'Số điện thoại đã được đăng kí' })
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Email không hợp lệ' })
    }

    const existingUser = await User.User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được đăng ký' })
    }
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User.User({
      hovaten,
      email,
      password: hashedPassword,
      role,
      phone
    })
    await user.save()
    res.json(user)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

router.post('/loginfull', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.User.findOne({ email })

    if (!user) {
      return res.json({ message: 'email không chính xác' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      return res.json({ message: 'nhập sai mật khẩu' })
    }

    if (user.role === 'admin') {
      return res.json({ role: 'admin', user: user })
    } else {
      return res.json({ role: 'user', user: user })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Đã xảy ra lỗi.' })
  }
})

module.exports = router
