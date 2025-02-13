import express, {Application, Request, Response} from "express"
import cors from "cors"
import { Client, LocalAuth } from "whatsapp-web.js"
import qrcode from "qrcode-terminal"
import bodyParser from "body-parser"
import axios from "axios"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const server: Application = express()
server.use(cors())
server.use(bodyParser.json())

const client = new Client({
  authStrategy: new LocalAuth(),
})

client.on("qr", (qr) => {
  console.log("Scan yhe qr code to login.")
  qrcode.generate(qr, {small: true})
})

client.on("ready", () => {
  console.log("What'sapp Bot is Ready")
})

client.on("message", async (message) => {
  console.log(`Message from ${message.from}: ${message.body}`)
  const aiResponse = await generate(message.body)
  client.sendMessage(message.from, aiResponse)
})

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "");
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
export const generate = async (prompt: string): Promise<string> => {

  if (!prompt) {
    return "Invalid or missing prompt"
  }

  const systemInstructions = `Act like a whatsap WhatsApp ai agent. u are a ChatBot agent for Nexis Botix an ai tech powered driven startup specializing in creating chatbots, ai agents e.tc. `
  const userPrompt = `${systemInstructions}\n\nUser: ${prompt}\nBot: `

  try {
    const result = await textModel.generateContent(userPrompt)
     const response: string | undefined = result.response.text() || "sorry i didn't get that"
    return response 
  } catch (error: any) {
    console.error("Error generating content:", error)
    return "error generating content"
  }
}



server.listen(Number(process.env.PORT || 3000), () => console.log("Server has started running at " + process.env.PORT))
