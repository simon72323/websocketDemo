package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

// 升級 HTTP 連線到 WebSocket 連線
var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // 允許所有來源，防止同源政策阻止連線
	},
}

// 客戶端結構體，包含 WebSocket 連線
type Client struct {
	Conn *websocket.Conn // WebSocket 連線對象
}

var clients = make(map[*Client]bool) // 儲存所有已連接的客戶端
var broadcast = make(chan Message)   // 廣播頻道，用於傳遞訊息

// 訊息結構體，用來封裝用戶名和訊息內容
type Message struct {
	Username string `json:"username"` // 用戶名
	Message  string `json:"message"`  // 訊息內容
}

func main() {
	// 設置 WebSocket 處理路徑，當請求 "/ws" 路徑時，會執行 handleConnections 函數
	http.HandleFunc("/ws", handleConnections)

	// 啟動一個 goroutine 來處理廣播的訊息
	go handleMessages()

	// 開啟 HTTP 伺服器，監聽 8080 端口
	fmt.Println("Server started on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil)) // 啟動伺服器並報告錯誤
}

// 處理客戶端連線
func handleConnections(w http.ResponseWriter, r *http.Request) {
	// 將 HTTP 連線升級為 WebSocket 連線
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
		return
	}

	// 建立一個新的客戶端並將其加入 clients 列表
	client := &Client{Conn: conn}
	clients[client] = true

	// 延遲執行，在函數結束時關閉客戶端並從 clients 列表中移除
	defer func() {
		delete(clients, client)
		client.Conn.Close()
	}()

	// 持續讀取客戶端的訊息
	for {
		var msg Message
		// 讀取客戶端發來的 JSON 資料並將其解析為 Message 結構體
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("error: %v", err) // 如果有錯誤，記錄錯誤並關閉連線
			delete(clients, client)      // 從客戶端列表中移除
			break
		}
		// 將訊息發送到廣播頻道，供其他客戶端接收
		broadcast <- msg
	}
}

//這是甚麼

// 廣播訊息給所有連接的客戶端
func handleMessages() {
	for {
		// 從廣播頻道中接收訊息
		msg := <-broadcast
		// 遍歷所有已連接的客戶端，將訊息廣播給每個客戶端
		for client := range clients {
			// 發送 JSON 訊息給每個客戶端
			err := client.Conn.WriteJSON(msg)
			if err != nil {
				log.Printf("error: %v", err) // 如果有錯誤，記錄錯誤
				client.Conn.Close()          // 關閉出錯的連線
				delete(clients, client)      // 從客戶端列表中移除
			}
		}
	}
}
