import express, {Application, Request, Response} from "express"
import cors from "cors"
import bodyParser from "body-parser"
import dotenv from "dotenv"
dotenv.config()

const server: Application = express()
server.use(cors())
server.use(bodyParser.json())

server.get("/webhook", (req: Request, res: Response) => {
  const [mode] = req.query["hub.mode"] as string 
  const [token] = req.query["hub.verify_token"] as string 
  const [challenge] = req.query["hub.challenge"] as string 
  
  if(mode === "subcscribe" && token === process.env.VERIFY_TOKEN){
    console.log("WebHook Verified")
    res.status(200).send(challenge)
  }else{
    res.sendStatus(403)
  }
})

server.post("/webhook", (req: Request, res: Response) => {
  console.log("Received Message:", req.body)
  res.sendStatus(200)
})

server.listen(process.env.PORT, () => console.log("Server has started running at " + process.env.PORT))