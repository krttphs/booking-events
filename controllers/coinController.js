const User = require('../models/User');
exports.addCoins = async (req, res) => {
  try {
    // เช็คว่ามี session user หรือยัง
    if (!req.session.user) {
      return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อน' });
    }

    const userId = req.session.user._id;
    const amount = parseInt(req.body.amount);

    if (![100, 500, 1000, 2000].includes(amount)) {
      return res.status(400).json({ success: false, message: 'จำนวนไม่ถูกต้อง' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    user.coin += amount; // ชื่อ field ใน schema ต้องเป็น coin
    await user.save();

    req.session.user.coin = user.coin; // update session

    res.json({
      success: true,
      message: `เติม ${amount} coin สำเร็จ!`,
      coins: user.coin
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};