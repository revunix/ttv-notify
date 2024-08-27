# ttv-notify

A bot that monitors the status of Twitch streams and sends notifications via Telegram.

## Prerequisites

- Docker
- Docker Compose

## Cloning the Repository

Clone the repository to your local machine:

```bash
git clone https://github.com/revunix/ttv-notify.git
cd ttv-notify
```

## Environment Variables

Edit the `docker-compose.yml` file to include your environment variables:

```yaml
name: ttv-notify

services:
  app:
    container_name: ttv-notify
    build: .
    environment:
      TELEGRAM_TOKEN: "your_telegram_bot_token"
      TELEGRAM_CHATID: "your_telegram_chat_id"
      TWITCH_CLIENT_ID: "your_twitch_client_id"
      TWITCH_CLIENT_SECRET: "your_twitch_client_secret"
      TWITCH_STREAMERS: "streamer1,streamer2,streamer3"
      MESSAGE_TEMPLATE: "{user_name} is now live playing {game_name} with {viewer_count} viewers! Watch here: {user_url}"
    network_mode: bridge
    restart: unless-stopped
```

## Running the Application

### With Docker Compose

1. Build and start the container:
    ```bash
    docker compose -p ttv-notify up -d --build
    ```

## License

This project is licensed under the GPL-3.0 License. See the `LICENSE` file for more details.
