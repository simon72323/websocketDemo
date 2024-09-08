import { _decorator, Component, EditBox, Label } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('ChatRoom')
export class ChatRoom extends Component {
    @property(EditBox)
    usernameInput: EditBox = null;

    @property(EditBox)
    messageInput: EditBox = null;

    @property(Label)
    chatDisplay: Label = null;

    private socket: WebSocket = null;

    onLoad() {
        this.connectToServer();
    }

    // 連接到 WebSocket 伺服器
    connectToServer() {
        this.socket = new WebSocket("ws://localhost:8080/ws");

        this.socket.onopen = () => {
            console.log("Connected to server");
        };

        this.socket.onmessage = (event) => {
            let data = JSON.parse(event.data);
            this.chatDisplay.string += `${data.username}: ${data.message}\n`;
        };

        this.socket.onclose = () => {
            console.log("Disconnected from server");
        };
    }

    // 發送訊息給伺服器
    sendMessage() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            let message = {
                username: this.usernameInput.string,
                message: this.messageInput.string
            };
            this.socket.send(JSON.stringify(message));
            this.messageInput.string = '';  // 清空輸入框
        }
    }
}