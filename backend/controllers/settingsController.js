const settingService = require("../services/settingService");

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingService.getSettings();

    res.status(200).json({
      success: true,
      settings,
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updatedBy = req.user?.id || req.user?._id;

    const settings = await settingService.updateSettings(
      req.body,
      updatedBy
    );

    res.status(200).json({
      success: true,
      message: "Company settings updated successfully.",
      settings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};