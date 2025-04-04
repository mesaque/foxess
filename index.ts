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
async function makeFoxESSRequest(path: string, body: any = {}, method: 'get' | 'post' = 'post') {
    const timestamp = Date.now();
    if (!FOXESS_API_KEY) throw new Error("FOXESS_API_KEY não configurado");

    const signature = calculateSignature(path, FOXESS_API_KEY, timestamp);
    const headers = {
        'Content-Type': 'application/json',
        'token': FOXESS_API_KEY,
        'signature': signature,
        'lang': 'en',
        'timestamp': timestamp.toString(),
    };

    let response;
    if (method === 'get') {
        response = await axios.get(`${BASE_URL}${path}`, {
            headers,
            params: body // body deve conter o parâmetro 'sn' (número de série do inversor)
        });
    } else {
        response = await axios.post(`${BASE_URL}${path}`, body, {
            headers
        });
    }
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
        const data = await makeFoxESSRequest(path, { sn: DEVICE_SN}, 'post');
        if (data.errno !== 0) throw new Error(`Invalid response code: ${data.errno.toString()}`);
        
        const realTimeData = data.result[0];
        //console.log(realTimeData);
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
        const path = '/op/v0/device/report/query';
        const dataReport = {
            sn: DEVICE_SN,
            year: new Date().getFullYear(),
            month : new Date().getMonth() + 1,
            day : new Date().getDate(),
            "dimension": "day",
            "variables" : ["generation","feedin","gridConsumption","chargeEnergyToTal","dischargeEnergyToTal"]
        };
        const data = await makeFoxESSRequest(path, dataReport, 'post');

        console.log( dataReport, JSON.stringify( data, null, 2));
        if (data.errno !== 0) throw new Error(`Invalid response code: ${data.errno.toString()}`);
        
        const energyData = data.result;
        const generation = energyData.find((item: any) => item.variable === 'generation');
        const feedin = energyData.find((item: any) => item.variable === 'feedin');
        const gridConsumption = energyData.find((item: any) => item.variable === 'gridConsumption');
        const chargeEnergy = energyData.find((item: any) => item.variable === 'chargeEnergyToTal');
        const dischargeEnergy = energyData.find((item: any) => item.variable === 'dischargeEnergyToTal');
        
        const message = `
⚡ **Produção de Energia**
🔆 Geração: ${generation?.values?.[0] || 'N/A'} ${generation?.unit || 'kWh'}
🔌 Injeção na Rede: ${feedin?.values?.[0] || 'N/A'} ${feedin?.unit || 'kWh'}
🏭 Consumo da Rede: ${gridConsumption?.values?.[0] || 'N/A'} ${gridConsumption?.unit || 'kWh'}
🔋 Energia Carregada: ${chargeEnergy?.values?.[0] || 'N/A'} ${chargeEnergy?.unit || 'kWh'}
🔋 Energia Descarregada: ${dischargeEnergy?.values?.[0] || 'N/A'} ${dischargeEnergy?.unit || 'kWh'}
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