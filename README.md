# FoxESS Solar Monitoring Telegram Bot | Real-time Solar System Tracking

[![Node.js](https://img.shields.io/badge/Node.js-v14+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v4+-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Keywords: FoxESS, solar monitoring, solar tracking, solar system, solar energy, telegram bot, real-time monitoring, solar power, energy management, solar inverter, FoxESS API

This project is a Telegram bot that allows monitoring and obtaining real-time information from a FoxESS solar system. The bot provides access to important data about solar energy production, consumption, and system status, making it an essential tool for solar system owners and energy management.

## 🌟 Key Features

The bot offers the following features through an interactive menu:

1. **📊 Real-time Solar Monitoring**
   - Grid Voltage
   - Solar Power Output
   - Load Power Consumption
   - Ambient Temperature
   - System Frequency
   - Last Update Time

2. **⚡ Solar Energy Production Tracking**
   - Energy Generation Metrics
   - Grid Feed-in Statistics
   - Grid Consumption Analysis
   - Battery Charged Energy
   - Battery Discharged Energy

3. **🔄 Solar System Status**
   - System State (Online/Offline)
   - Last Update Time
   - Device Type Information
   - System Version Details
   - System Configuration (Battery/Solar Panels)

4. **📊 Solar Energy History**
   - Daily Solar Power Production
   - Total Energy Consumption
   - Grid Feed-in History
   - Temperature Records
   - PV1 Voltage and Current Data

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- Telegram Account
- FoxESS Solar System
- FoxESS API Credentials:
  - API Key
  - Device Serial Number (SN)
  - Telegram Bot Token

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/mesaque/foxess.git
   cd foxess-telegram-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in the `.env` file:
   ```
   TELEGRAM_TOKEN=your_telegram_token
   FOXESS_API_KEY=your_foxess_api_key
   DEVICE_SN=your_device_serial_number
   ```

## 💡 Usage Guide

1. Start the FoxESS monitoring bot:
   ```bash
   npm start
   ```

2. On Telegram, start a conversation with the bot using the `/start` command

3. Use the interactive menu to access different solar monitoring features

## 🔧 Technologies Used

- Node.js - Runtime environment
- TypeScript - Programming language
- Telegram Bot API - Bot framework
- FoxESS Cloud API - Solar system integration
- Axios - HTTP client
- dotenv - Environment management

## 🔒 Security Features

- Secure credential storage in environment variables
- MD5 signature authentication for FoxESS API
- HTTPS encrypted communications
- Regular security updates

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests for improvements
- Share your experience with the community

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Related Projects

- [FoxESS Cloud API Documentation](https://portal.foxesscloud.us:30004/public/i18n/en/OpenApiDocument.html)
- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)