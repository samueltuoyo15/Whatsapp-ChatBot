import express, { Application, Request, Response } from "express"
import cors from "cors"
import bodyParser from "body-parser"
import axios from "axios"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const server: Application = express()
server.use(cors())
server.use(bodyParser.json())

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "")
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

const generate = async (prompt: string): Promise<string> => {
  if (!prompt) return "Invalid or missing prompt"

  const systemInstructions = `Act like a WhatsApp AI agent. You are a chatbot agent for Nexus Botix, an AI-powered tech startup specializing in chatbots and AI agents.`
  const userPrompt = `${systemInstructions}\n\nUser: ${prompt}\nBot: `

  try {
    const result = await textModel.generateContent(userPrompt)
    return result.response.text() || "sorry i didn't get that"
  } catch (error) {
    console.error(error)
    return "error generating content"
  }
}

server.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string
  const token = req.query["hub.verify_token"] as string
  const challenge = req.query["hub.challenge"] as string

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("WebHook Verified")
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }
})

server.post("/webhook", async (req: Request, res: Response): Promise<any> => {
  const body = req.body
  if (!body) return res.status(400).send({ message: "Empty Body" })

  try {
    if (body.object === "whatsapp_business_account") {
      const entry = body.entry?.[0]
      const changes = entry.changes?.[0]
      const message = changes?.value?.messages?.[0]

      if (message) {
        const from = message.from
        const text = message.text?.body

        console.log(`Message from ${from}: ${text}`)

        const aiResponse = await generate(text)
        await sendMessage(from, aiResponse)
      }
    }
    return res.sendStatus(200)
  } catch (error) {
    console.error(error)
    return res.status(500).send({ message: "an error occurred" })
  }
})

const sendMessage = async (to: string, text: string) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    )
    console.log(`Sent message to ${to}: ${text}`)
  } catch (error) {
    console.log(error)
  }
}

server.listen(Number(process.env.PORT || 3000), () => console.log("Server has started running at " + process.env.PORT))