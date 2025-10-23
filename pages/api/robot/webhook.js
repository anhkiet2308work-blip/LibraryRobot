/**
 * API Webhook để nhận response từ Robot
 * Robot sẽ POST JSON đến endpoint này: /api/robot/webhook
 * 
 * Body: { "process_status": "success" | "fail" }
 * 
 * Giải pháp đơn giản: Robot nên POST trực tiếp đến MQTT broker
 * hoặc dùng HiveMQ REST API để publish message
 */

// Lưu response tạm thời trong memory (không persist qua server restart)
// Trong production, nên dùng Redis hoặc database
let latestRobotResponse = null

export default async function handler(req, res) {
  // GET: Client polling để lấy response mới nhất
  if (req.method === 'GET') {
    const response = latestRobotResponse
    latestRobotResponse = null // Clear sau khi đọc
    
    return res.status(200).json({ 
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    })
  }

  // POST: Robot gửi response
  if (req.method === 'POST') {
    try {
      const data = req.body
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📡 Robot Webhook Received')
      console.log('   Data:', JSON.stringify(data))
      console.log('   Process Status:', data.process_status)
      
      // Validate data
      if (!data.process_status) {
        console.log('❌ Missing process_status field')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return res.status(400).json({ 
          error: 'Missing process_status field',
          example: { process_status: 'success' }
        })
      }

      // Validate process_status value
      if (data.process_status !== 'success' && data.process_status !== 'fail') {
        console.log('❌ Invalid process_status value:', data.process_status)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return res.status(400).json({ 
          error: 'Invalid process_status. Must be "success" or "fail"',
          received: data.process_status
        })
      }

      // Lưu response vào memory
      latestRobotResponse = {
        ...data,
        receivedAt: new Date().toISOString()
      }
      
      console.log('✅ Response saved. Clients can poll to receive.')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      // Echo lại cho robot
      return res.status(200).json({ 
        success: true,
        message: 'Response received successfully',
        received: data
      })
      
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.error('❌ Webhook Error:', error)
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
      })
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed. Use GET or POST.' })
}
