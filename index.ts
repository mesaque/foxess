import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import { Md5 } from "ts-md5";

dotenv.config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const FOXESS_API_KEY = process.env.FOXESS_API_KEY;
const DEVICE_SN = process.env.DEVICE_SN;

if (!TELEGRAM_TOKEN || !FOXESS_API_KEY || !DEVICE_SN) {
    throw new Error('Variáveis de ambiente não configuradas corretamente');
}

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const BASE_URL = 'https://portal.foxesscloud.us:30004';

// Função para calcular a assinatura da API
function calculateSignature(path: string, apiKey: string, timestamp: number): string {
    if (!apiKey) throw new Error("API key is required");
    return Md5.hashStr(`${path}\\r\\n${apiKey}\\r\\n${timestamp.toString()}`);
}

// Função para fazer requisições à API FoxESS
async function makeFoxESSRequest(path: string, body: any = {}) {
    const timestamp = Date.now();
    if (!FOXESS_API_KEY) throw new Error("FOXESS_API_KEY não configurado");

    const signature = calculateSignature(path, FOXESS_API_KEY, timestamp);
    const response = await axios.post(`${BASE_URL}${path}`, body, {
        headers: {
            'Content-Type': 'application/json',
            'token': FOXESS_API_KEY,
            'signature': signature,
            'lang': 'en',
            'timestamp': timestamp.toString(),
        }
    });
    return response.data;
}

// Comando inicial do bot
bot.onText(/\/start/, async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Bem-vindo ao Bot da FoxESS! Escolha uma opção:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📊 Dados em tempo real", callback_data: "real_time" }],
                [{ text: "⚡ Produção de energia", callback_data: "energy" }],
                [{ text: "🔄 Atualizar Status", callback_data: "status" }]
            ]
        }
    });
});

// Responde aos botões do menu
bot.on("callback_query", async (callbackQuery: TelegramBot.CallbackQuery) => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) return;

    const action = callbackQuery.data;
    if (!action) return;

    if (action === "real_time") {
        await getRealTimeData(chatId);
    } else if (action === "energy") {
        await getEnergyData(chatId);
    } else if (action === "status") {
        await getStatusData(chatId);
    }
});

// Função para buscar dados em tempo real do FoxESS
async function getRealTimeData(chatId: number): Promise<void> {
    try {
        const path = '/op/v0/device/real/query';
        const data = await makeFoxESSRequest(path, { sn: DEVICE_SN});
        if (data.errno !== 0) throw new Error(`Invalid response code: ${data.errno.toString()}`);
        
        const realTimeData = data.result[0];
        console.log(realTimeData);
        const message = `
📡 **Dados em Tempo Real**
🔋 Tensão da Rede: ${realTimeData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'RVolt')?.value || 'N/A'}V
⚡ Potência Solar: ${realTimeData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'pvPower')?.value || 'N/A'} kW
🔌 Potência de Carga: ${realTimeData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'loadsPower')?.value || 'N/A'} kW
🌡️ Temperatura Ambiente: ${realTimeData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'ambientTemperation')?.value || 'N/A'} ℃
🔄 Frequência: ${realTimeData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'RFreq')?.value || 'N/A'} Hz
⏱️ Última Atualização: ${realTimeData?.time || 'N/A'}
        `;
        bot.sendMessage(chatId, message);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Erro ao buscar dados em tempo real.");
    }
}

// Função para buscar produção de energia
async function getEnergyData(chatId: number): Promise<void> {
    try {
        const path = '/op/v0/device/energy/query';
        const data = await makeFoxESSRequest(path, { sn: DEVICE_SN });
        
        if (data.errno !== 0) throw new Error(`Invalid response code: ${data.errno.toString()}`);
        
        const energyData = data.result[0];
        const message = `
⚡ **Produção de Energia**
🔆 Hoje: ${energyData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'daily')?.value || 'N/A'} kWh
📅 Mensal: ${energyData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'monthly')?.value || 'N/A'} kWh
📈 Total: ${energyData?.datas?.find((d: { variable: string; value: number }) => d.variable === 'total')?.value || 'N/A'} kWh
        `;
        bot.sendMessage(chatId, message);
    } catch (error) {
        bot.sendMessage(chatId, "Erro ao buscar dados de energia.");
    }
}

// Função para buscar status do sistema
async function getStatusData(chatId: number): Promise<void> {
    try {
        const path = '/op/v0/device/status/query';
        const data = await makeFoxESSRequest(path, { sn: DEVICE_SN });
        
        if (data.errno !== 0) throw new Error(`Invalid response code: ${data.errno.toString()}`);
        
        const statusData = data.result[0];
        const message = `
✅ **Status do Sistema**
⚙ Estado: ${statusData?.datas?.find((d: { variable: string; value: string }) => d.variable === 'status')?.value || 'N/A'}
🕒 Última Atualização: ${statusData?.time || 'N/A'}
        `;
        bot.sendMessage(chatId, message);
    } catch (error) {
        bot.sendMessage(chatId, "Erro ao buscar status do sistema.");
    }
} 