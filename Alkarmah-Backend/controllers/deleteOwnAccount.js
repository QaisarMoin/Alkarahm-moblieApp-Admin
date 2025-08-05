import User from "../models/User.js";

// Controller to delete the authenticated user's account
const deleteOwnAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await User.deleteOne({ _id: userId });
    return res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete account', error: err.message });
  }
};

export default deleteOwnAccount;
