import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WebSocketExample')
export class WebSocketExample extends Component {
    private ws: WebSocket | null = null;
    private heartbeatInterval: number = 2000; // 心跳间隔，单位为毫秒
    private heartbeatTimer: number | null = null;

    start() {
        // 创建 WebSocket 连接
        // this.ws = new WebSocket('wss://ws.postman-echo.com/raw');
        this.ws = new WebSocket('ws://localhost:30001');
        // 监听连接打开事件
        this.ws.onopen = () => {
            console.log('WebSocket 連接開啟');
            // 向服务器发送一条消息
            this.sendMessage({ type: 'greeting', content: 'Hello, Server!' });
            // 开始发送心跳包
            this.startHeartbeat();
            this.scheduleOnce(()=>{
                if (this.ws) {
                    this.ws.close();
                }
            },2)
        };

        // 监听消息接收事件
        this.ws.onmessage = (event) => {
            console.log('WebSocket 接收訊息: ', event.data);

            // 尝试解析收到的消息为 JSON 对象
            try {
                const message = JSON.parse(event.data);
                this.handleServerMessage(message);
            } catch (e) {
                console.error('Failed to parse server message:', event.data);
            }
        };

        // 监听错误事件
        this.ws.onerror = (error) => {
            console.error('WebSocket error: ', error);
        };

        // 监听连接关闭事件
        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            // 停止心跳
            this.stopHeartbeat();
        };
    }

    // 发送消息方法，支持发送对象
    sendMessage(message: object) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageStr = JSON.stringify(message);
            this.ws.send(messageStr);
            console.log('傳送訊息: ', messageStr);
        } else {
            console.warn('WebSocket is not open. Cannot send message:', message);
        }
    }

    // 处理从服务器收到的消息
    handleServerMessage(message: any) {
        if (message.type === 'greeting') {
            console.log('接收 greeting:', message.content);
        } else if (message.type === 'heartbeat') {
            console.log('接收心跳');
        } else {
            console.log('Unknown message type:', message);
        }
    }

    // 开始发送心跳包
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            // console.log('發送心跳');
            this.sendMessage({ type: 'heartbeat' });
        }, this.heartbeatInterval);
    }

    // 停止发送心跳包
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    onDestroy() {
        if (this.ws) {
            this.ws.close();
        }
        // this.stopHeartbeat();
    }
}