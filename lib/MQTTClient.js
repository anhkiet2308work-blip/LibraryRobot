/**
 * MQTTClient - MQTT WebSocket Client cho Robot Library
 * 
 * Kết nối tới HiveMQ broker qua WebSocket
 * - Publish commands: robot_thu_vien/command
 * - Subscribe data: robot_thu_vien/data
 * 
 * Usage:
 *   const client = getMQTTClient()
 *   await client.connect()
 *   await client.sendCommand({ action: 'borrow', books: [...] })
 *   client.on('robot_data', (data) => { ... })
 */

import mqtt from 'mqtt'

class MQTTClient {
  constructor() {
    this.client = null
    this._isConnected = false // Private property
    this.eventHandlers = {}
    
    // MQTT Topics
    this.TOPIC_COMMAND = 'robot_thu_vien/command'
    this.TOPIC_DATA = 'robot_thu_vien/data'
    
    // HiveMQ WebSocket broker
    this.brokerUrl = 'wss://broker.hivemq.com:8884/mqtt'
  }

  /**
   * Kết nối tới MQTT broker
   */
  async connect() {
    if (this._isConnected && this.client) {
      console.log('✅ Already connected to MQTT broker')
      return
    }

    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to MQTT broker:', this.brokerUrl)

      try {
        // Tạo MQTT client với WebSocket
        this.client = mqtt.connect(this.brokerUrl, {
          clientId: `library_robot_${Math.random().toString(16).substr(2, 8)}`,
          clean: true,
          connectTimeout: 10000,
          reconnectPeriod: 5000,
          protocol: 'wss',
          protocolVersion: 5
        })

        // Event: Connected
        this.client.on('connect', () => {
          console.log('✅ Connected to MQTT broker')
          this._isConnected = true

          // Subscribe to data topic
          this.client.subscribe(this.TOPIC_DATA, (err) => {
            if (err) {
              console.error('❌ Subscribe error:', err)
            } else {
              console.log('📥 Subscribed to:', this.TOPIC_DATA)
            }
          })

          this.emit('mqtt_connected')
          resolve()
        })

        // Event: Message received
        this.client.on('message', (topic, message) => {
          console.log('📥 MQTT message from', topic)
          console.log('   Data:', message.toString())

          if (topic === this.TOPIC_DATA) {
            this.handleRobotData(message.toString())
          }
        })

        // Event: Error
        this.client.on('error', (error) => {
          console.error('❌ MQTT error:', error)
          this.emit('mqtt_error', { error: error.message })
          reject(error)
        })

        // Event: Disconnected
        this.client.on('close', () => {
          console.log('🔌 Disconnected from MQTT broker')
          this._isConnected = false
          this.emit('mqtt_disconnected')
        })

        // Event: Reconnecting
        this.client.on('reconnect', () => {
          console.log('🔄 Reconnecting to MQTT broker...')
          this.emit('mqtt_reconnecting')
        })

      } catch (error) {
        console.error('❌ Failed to connect MQTT:', error)
        reject(error)
      }
    })
  }

  /**
   * Ngắt kết nối MQTT
   */
  disconnect() {
    if (this.client) {
      console.log('🔌 Disconnecting from MQTT broker...')
      this.client.end()
      this.client = null
      this._isConnected = false
    }
  }

  /**
   * Gửi command đến robot (publish to command topic)
   */
  async sendCommand(action, books) {
    if (!this._isConnected || !this.client) {
      throw new Error('MQTT not connected. Please connect first.')
    }

    const command = {
      action: action,
      timestamp: new Date().toISOString(),
      books: books.map((book, index) => ({
        sequence: index + 1,
        rfid: book.rfid,
        name: book.name,
        position: book.position || {
          x: book.position_x || null,
          y: book.position_y || null,
          z: book.position_z || null
        }
      }))
    }

    const jsonString = JSON.stringify(command)

    return new Promise((resolve, reject) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📤 Publishing to MQTT:', this.TOPIC_COMMAND)
      console.log('   Action:', action)
      console.log('   Books:', books.length)
      console.log('   Command:', jsonString)

      this.client.publish(this.TOPIC_COMMAND, jsonString, { qos: 1 }, (err) => {
        if (err) {
          console.error('❌ Publish error:', err)
          console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          reject(err)
        } else {
          console.log('✅ Command published to MQTT')
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          resolve({ success: true, command })
        }
      })
    })
  }

  /**
   * Xử lý data từ robot (from data topic)
   */
  handleRobotData(messageStr) {
    try {
      // Thử parse JSON
      const data = JSON.parse(messageStr)
      console.log('📊 Robot data (JSON):', data)
      
      // Xử lý process_status từ robot
      if (data.process_status) {
        if (data.process_status === 'success') {
          console.log('✅ Robot: Lấy sách thành công!')
          this.emit('robot_success', data)
        } else if (data.process_status === 'fail') {
          console.log('❌ Robot: Lấy sách thất bại!')
          this.emit('robot_fail', data)
        }
      }
      
      this.emit('robot_data', data)
    } catch (error) {
      // Không phải JSON, gửi raw text
      console.log('📊 Robot data (text):', messageStr)
      this.emit('robot_message', messageStr)
    }
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this._isConnected && this.client && this.client.connected
  }

  /**
   * Lấy thông tin status đầy đủ
   */
  getStatus() {
    return {
      isConnected: this._isConnected,
      broker: this.brokerUrl,
      topicCommand: this.TOPIC_COMMAND,
      topicData: this.TOPIC_DATA
    }
  }

  /**
   * Đăng ký event handler
   */
  on(eventType, handler) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = []
    }
    this.eventHandlers[eventType].push(handler)
  }

  /**
   * Hủy đăng ký event handler
   */
  off(eventType, handler) {
    if (!this.eventHandlers[eventType]) return

    this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(
      (h) => h !== handler
    )
  }

  /**
   * Trigger event
   */
  emit(eventType, data) {
    if (!this.eventHandlers[eventType]) return

    this.eventHandlers[eventType].forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error(`❌ Error in event handler (${eventType}):`, error)
      }
    })
  }
}

// Singleton instance
let mqttClientInstance = null

/**
 * Lấy singleton instance
 */
export function getMQTTClient() {
  if (!mqttClientInstance) {
    mqttClientInstance = new MQTTClient()
  }
  return mqttClientInstance
}

export default MQTTClient
