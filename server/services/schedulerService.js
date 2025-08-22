const cron = require('node-cron');
const { sendDailyAdminReport } = require('./emailService');

// Schedule daily admin report to be sent at 11:59 PM every day
const scheduleDailyReport = () => {
  // Schedule for 11:59 PM every day (59 23 * * *)
  cron.schedule('59 23 * * *', async () => {
    console.log('🕚 Running daily admin report at:', new Date().toLocaleString('en-IN'));
    
    try {
      const result = await sendDailyAdminReport();
      if (result.success) {
        console.log('✅ Daily admin report sent successfully');
        console.log('📊 Report stats:', result.stats);
      } else {
        console.error('❌ Daily admin report failed:', result.error);
      }
    } catch (error) {
      console.error('❌ Scheduler error:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('📅 Daily admin report scheduler started - will run at 11:59 PM every day');
};

// Manual trigger for testing
const sendReportNow = async () => {
  console.log('🧪 Manually triggering daily admin report...');
  try {
    const result = await sendDailyAdminReport();
    if (result.success) {
      console.log('✅ Manual daily admin report sent successfully');
      console.log('📊 Report stats:', result.stats);
      return result;
    } else {
      console.error('❌ Manual daily admin report failed:', result.error);
      return result;
    }
  } catch (error) {
    console.error('❌ Manual report error:', error);
    return { success: false, error: error.message };
  }
};

// Schedule weekly summary (optional - every Sunday at 10 PM)
const scheduleWeeklyReport = () => {
  cron.schedule('0 22 * * 0', async () => {
    console.log('📅 Running weekly summary at:', new Date().toLocaleString('en-IN'));
    // You can implement weekly report here if needed
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('📅 Weekly summary scheduler started - will run every Sunday at 10 PM');
};

module.exports = {
  scheduleDailyReport,
  scheduleWeeklyReport,
  sendReportNow
};