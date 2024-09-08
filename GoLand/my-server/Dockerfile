# 使用官方 Go 运行时作为基础镜像
FROM golang:1.20 AS builder

# 设置工作目录
WORKDIR /app

# 复制 go.mod 和 go.sum 并下载依赖
COPY go.mod go.sum ./
RUN go mod download

# 复制源代码
COPY . .

# 构建 Go 应用
RUN go build -o myapp .

# 使用一个更小的镜像来运行构建好的二进制文件
FROM alpine:latest

# 复制构建好的二进制文件
COPY --from=builder /app/myapp /myapp

# 设置默认命令
CMD ["/myapp"]
