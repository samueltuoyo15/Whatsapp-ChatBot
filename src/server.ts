import express, {Application, Request, Response} from "express"
import cors from "cors"
import bodyParser from "body-parser"
import axios from "axios"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"
dotenv.config()

const server: Application = express()
server.use(cors())
server.use(bodyParser.json())

const genAI = new GoogleGenerativeAI(API_KEY || 'null');
const textModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

export const generate = async (prompt: string): Promise<string> => {

  if (!prompt) {
    return res.status(400).json({ message: "Invalid or missing prompt" })
  }

  const systemInstructions = `
    Act like a whatsap WhatsApp ai agent. u are a ChatBot agent for Nexis Botix an ai tech powered driven startup specializing in creating chatbots, ai agents e.tc. 
  `
  const userPrompt = `
    ${systemInstructions}

    User: ${prompt}
    Bot:
  `

  try {
    const result = await textModel.generateContent(userPrompt)
     const response: string | undefined = result.response.text()
    return response 
  } catch (error: any) {
    console.error("Error generating content:", error)
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

server.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"] as string 
  const token = req.query["hub.verify_token"] as string 
  const challenge = req.query["hub.challenge"] as string 
  
  if(mode === "subscribe" && token === process.env.VERIFY_TOKEN){
    console.log("WebHook Verified")
    res.status(200).send(challenge)
  }else{
    res.sendStatus(403)
  }
})

server.post("/webhook", async (req: Request, res: Response) => {
  const body = req.body
  if(!body) return res.status(400).send({message: "Empty Body"})
  
  if(body.object === "whatsapp_business_account"){
    const entry = body.entry?.[0]
    const changes = entry.changes?.[0]
    const message = changes?.value?.messages?.[0]
    
    if(message){
      const from = message.from
      const text = message.text?.body
      
      console.log(`Message from ${from}: ${text}`)
      
      const aiResponse = await generate(text)
      await sendMessage(from, aiResponse)
    }
  }
  res.sendStatus(200)
})

const sendMessage = (to: string, from: string) => {
  const response = axios.post("")
}

server.listen(Number(process.env.PORT || 3000), () => console.log("Server has started running at " + process.env.PORT))