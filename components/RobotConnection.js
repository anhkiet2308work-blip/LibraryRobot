import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import Card from './Card'
import Button from './Button'
import { getMQTTClient } from '../lib/MQTTClient'

export default function RobotConnection() {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('disconnected') // disconnected, connecting, connected, error
  const [mqttClient] = useState(() => getMQTTClient())

  // Kiểm tra kết nối khi component mount
  useEffect(() => {
    checkConnectionStatus()

    // Setup event listeners
    mqttClient.on('mqtt_connected', handleMQTTConnected)
    mqttClient.on('mqtt_disconnected', handleMQTTDisconnected)
    mqttClient.on('mqtt_error', handleMQTTError)
    mqttClient.on('mqtt_reconnecting', handleMQTTReconnecting)

    // Cleanup
    return () => {
      mqttClient.off('mqtt_connected', handleMQTTConnected)
      mqttClient.off('mqtt_disconnected', handleMQTTDisconnected)
      mqttClient.off('mqtt_error', handleMQTTError)
      mqttClient.off('mqtt_reconnecting', handleMQTTReconnecting)
    }
  }, [])

  // Event handlers
  const handleMQTTConnected = () => {
    setIsConnected(true)
    setConnectionStatus('connected')
    setIsConnecting(false)
    toast.success('Đã kết nối MQTT broker')
  }

  const handleMQTTDisconnected = () => {
    setIsConnected(false)
    setConnectionStatus('disconnected')
    setIsConnecting(false)
  }

  const handleMQTTError = ({ error }) => {
    setConnectionStatus('error')
    setIsConnecting(false)
    toast.error('Lỗi MQTT: ' + error)
  }

  const handleMQTTReconnecting = () => {
    setConnectionStatus('connecting')
    toast('Đang kết nối lại MQTT...', { icon: '🔄' })
  }

  // Kiểm tra trạng thái kết nối
  const checkConnectionStatus = () => {
    const status = mqttClient.getStatus()
    setIsConnected(status.isConnected)
    setConnectionStatus(status.isConnected ? 'connected' : 'disconnected')
  }

  // Kết nối MQTT
  const handleConnect = async () => {
    if (isConnecting) return

    setIsConnecting(true)
    setConnectionStatus('connecting')

    try {
      await mqttClient.connect()
      // Event handler sẽ update state
    } catch (error) {
      console.error('Connect error:', error)
      toast.error('Không thể kết nối MQTT: ' + error.message)
      setConnectionStatus('error')
      setIsConnecting(false)
    }
  }

  // Ngắt kết nối MQTT
  const handleDisconnect = async () => {
    try {
      mqttClient.disconnect()
      setIsConnected(false)
      setConnectionStatus('disconnected')
      toast.success('Đã ngắt kết nối MQTT')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Lỗi khi ngắt kết nối')
    }
  }

  // Render status icon
  const renderStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return '🟢'
      case 'connecting':
        return '🟡'
      case 'error':
        return '🔴'
      default:
        return '⚪'
    }
  }

  // Render status text
  const renderStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Đã kết nối MQTT'
      case 'connecting':
        return 'Đang kết nối...'
      case 'error':
        return 'Lỗi kết nối'
      default:
        return 'Chưa kết nối'
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            🤖 Kết nối Robot (MQTT)
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{renderStatusIcon()}</span>
            <span className="text-sm text-gray-600">
              {renderStatusText()}
            </span>
          </div>
        </div>

        {/* MQTT Broker Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <strong>MQTT Broker:</strong> HiveMQ Public Broker
          </p>
          <p className="text-sm text-blue-700 mt-1">
            📤 Publish: <code className="bg-blue-100 px-2 py-1 rounded">robot_thu_vien/command</code>
          </p>
          <p className="text-sm text-blue-700 mt-1">
            📥 Subscribe: <code className="bg-blue-100 px-2 py-1 rounded">robot_thu_vien/data</code>
          </p>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1"
            >
              {isConnecting ? '🔄 Đang kết nối...' : '🔌 Kết nối MQTT'}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="secondary"
              className="flex-1"
            >
              🔌 Ngắt kết nối
            </Button>
          )}
        </div>

        {/* Help text */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-xs text-gray-600">
            💡 <strong>Hướng dẫn:</strong>
          </p>
          <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>Kết nối MQTT một lần trước khi mượn/trả sách</li>
            <li>Robot sẽ nhận lệnh qua MQTT topic</li>
            <li>Kết nối được giữ khi đổi giữa các trang</li>
            <li>Không cần chọn cổng COM</li>
          </ul>
        </div>
      </div>
    </Card>
  )
}
