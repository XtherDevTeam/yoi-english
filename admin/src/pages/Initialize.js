
import * as React from 'react'
import * as Mui from '../Components'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import theme from '../theme'

import { useNavigate, useHref } from "react-router-dom"
import Api from '../Api'

const PromptForGeneratingChatbotPersona =
  `
You are an AI engineer, your task is to create a chatbot persona for {{charName}} for an English learning chatbot.
This chatbot will be used to help learners improve their English skills. 

Here is your workflow: 

1. Check if the {{charName}} is from a fictional character or a real-world entity.
2. If the {{charName}} is a real-world entity, briefly describe this person's background, characteristics and life experiences.
   If {{charName}} is from a fictional character, describe the character's **backstory** and **personality** concisely.
   Otherwise, write a persona include the personality traits which suitable for English learning helper based on the chatbot's name.
3. Return the generated persona to the user.

E.g. input: 'Kaedehara Kazuha'
Generated persona:

A wandering samurai of the once-famed Kaedehara Clan with an ability to read the sounds of nature, Kazuha is a temporary crewmember of The Crux. Despite being burdened by the many happenings of his past, Kazuha still maintains an easygoing disposition. 
`

function Stage1({ onNext, onErr }) {
  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"服务器初始化"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        您快完成了！让我们从设置您的 Yoi English 服务器开始。
      </Mui.Typography>
    </Mui.CardContent>
    <Mui.CardActions>
      {/* <Mui.Button size="small" onClick={() => { navigate(-1) }}></Mui.Button> */}
      <Mui.Button size="small" onClick={() => onNext()}>开始</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage2({ onBack, onErr, onNext }) {
  const [username, setUsername] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"设置管理员帐户"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"开始创建 Yoi English 服务器的管理员帐户。此帐户将拥有服务器的完全访问权限，并可以管理用户、组和其他设置。"}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="用户名"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Mui.TextField
        fullWidth
        label="电子邮件"
        variant="outlined"
        margin="normal"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Mui.TextField
        fullWidth
        label="密码"
        variant="outlined"
        margin="normal"
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>返回</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(username, password, email)}>下一步</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage3({ onBack, onErr, onNext }) {
  const [apiToken, setAPIToken] = React.useState("")

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"为 Yoi English 设置人工智能"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"设置您的 Gemini Pro 访问的 Google API 令牌。"}
        {"没有 Google API 令牌？点击 "} <Mui.Link href={'https://aistudio.google.com'} underline="hover">此处</Mui.Link>{" 获取一个。"}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="Google API 令牌"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={apiToken}
        onChange={(e) => setAPIToken(e.target.value)}
      />
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>返回</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(apiToken)}>下一步</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage4({ onBack, onNext, onErr, currentFields }) {
  const [pendingAIInvocation, setPendingAIInvocation] = React.useState(null)
  const [chatbotName, setChatbotName] = React.useState("")
  const [chatbotPersona, setChatbotPersona] = React.useState("")
  const [enableGenerativeAI, setEnableGenerativeAI] = React.useState(true)

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"聊天机器人配置"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"为与 Yoi English 一起使用的聊天机器人选择一个名称并编写一个角色设定。"}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="聊天机器人名称"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={chatbotName}
        onChange={(e) => {
          setChatbotName(e.target.value)
          if (pendingAIInvocation !== null) {
            // clear timeout
            clearTimeout(pendingAIInvocation)
          }
          setPendingAIInvocation(setTimeout(() => {
            // fetch a possible persona from the AI
            Api.ask_ai('gemini-1.5-flash', 0.5, "", PromptForGeneratingChatbotPersona.replace("{{charName}}", e.target.value), currentFields.google_api_key).then(response => {
              // console.log(response.status, response)
              if (response.status) {
                setChatbotPersona(response.data.answer)
              } else {
                console.error(response)
              }
            })
          }, 500))
        }}
      />
      <Mui.TextField
        fullWidth
        label="聊天机器人角色设定"
        variant="outlined"
        margin="normal"
        required
        value={chatbotPersona}
        onChange={(e) => setChatbotPersona(e.target.value)}
        multiline
        maxRows={5}
      />
      <Mui.FormControl>
        <Mui.FormControlLabel style={{ padding: 10 }} control={<Mui.Switch checked={enableGenerativeAI} onChange={(e) => setEnableGenerativeAI(e.target.checked)} />} label="启用聊天机器人角色设定生成式 AI" />
      </Mui.FormControl>
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>返回</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(chatbotName, chatbotPersona)}>下一步</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage5({ onBack, onNext, onErr, currentFields }) {
  // finish AIDubModel and AIDubEndpoint
  const [pendingAIInvocation, setPendingAIInvocation] = React.useState(null)
  const [AIDubModel, setAIDubModel] = React.useState("")
  const [AIDubEndpoint, setAIDubEndpoint] = React.useState("")

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"为 Yoi English 设置 AIDub 中间件"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        AIDub 中间件专门用于为英语口语考试提供 TTS 服务。
        正确配置 AIDub 中间件对于 Yoi English 的正常运行至关重要。
        请提供 AIDub 中间件的 AIDub 模型和端点。
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="AIDub 端点"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={AIDubEndpoint}
        onChange={(e) => {setAIDubEndpoint(e.target.value)}}
      />
      <Mui.TextField
        fullWidth
        label="AIDub 模型"
        variant="outlined"
        margin="normal"
        required
        value={AIDubModel}
        onChange={(e) => {setAIDubModel(e.target.value)}}
      />
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>返回</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(AIDubEndpoint, AIDubModel)}>下一步</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage6({ onBack, onNext, onErr, currentFields }) {
  const [readyToRedirect, setReadyToRedirect] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      Api.initialize(currentFields.username,
        currentFields.email,
        currentFields.password,
        currentFields.google_api_key,
        currentFields.chatbotName,
        currentFields.chatbotPersona,
        currentFields.AIDubEndpoint,
        currentFields.AIDubModel).then(r => {
          if (r.status) {
            setReadyToRedirect(true)
          } else {
            onErr(r.message)
          }
        })
      }, 500)
  }, [currentFields])

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"正在为您准备..."}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"您的 Yoi English 服务器现在可以使用了。您现在可以开始体验 Yoi English 了。"}
      </Mui.Typography>
      {/* occupy the space of the card content */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Mui.CircularProgress />
      </div>
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" disabled>返回</Mui.Button>
      {readyToRedirect && <Mui.Button size="small" onClick={() => {
        onNext()
      }}>完成</Mui.Button>}
    </Mui.CardActions>
  </>
}

export default function Initialize() {
  const navigate = useNavigate()
  let [currentTheme, setCurrentTheme] = React.useState(theme.theme())
  let [currentStage, setCurrentStage] = React.useState(1)
  let [currentFields, setCurrentFields] = React.useState({
    username: "",
    email: "",
    password: "",
    google_api_key: ""
  })
  let [alertOpen, setAlertOpen] = React.useState(false)
  let [alertDetail, setAlertDetail] = React.useState({ type: "success", title: "", message: "" })

  theme.listenToThemeModeChange((v) => {
    setCurrentTheme(theme.theme())
  })

  React.useEffect(() => {
    console.log(theme.theme())
  }, [currentTheme])

  React.useEffect(() => {
    if (Api.checkIfInitialized() === true) {
      navigate("/")
    }
  }, [])

  return (
    <>
      <theme.Background img={theme.imgBackground3} />
      <Mui.Card sx={{ maxWidth: 500, top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "absolute" }}>
        {currentStage === 1 && <Stage1 onNext={() => setCurrentStage(2)} />}
        {currentStage === 2 && <Stage2 onBack={() => setCurrentStage(1)} onNext={(username, email, password) => {
          setCurrentFields({ ...currentFields, username, email, password })
          setCurrentStage(3)
        }} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "错误", message: msg })
          setAlertOpen(true)
        }} />}
        {currentStage === 3 && <Stage3 onBack={() => setCurrentStage(2)} onNext={(google_api_key) => {
          setCurrentFields({ ...currentFields, google_api_key })
          setCurrentStage(4)
        }} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "错误", message: msg })
        }}/>}
        {currentStage === 4 && <Stage4 onBack={() => setCurrentStage(3)} onNext={(chatbotName, chatbotPersona) => {
          setCurrentFields({ ...currentFields, chatbotName, chatbotPersona })
          setCurrentStage(5)
        }} currentFields={currentFields} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "错误", message: msg })
        }}/>}
        {currentStage === 5 && <Stage5 onBack={() => setCurrentStage(4)} onNext={(AIDubEndpoint, AIDubModel) => {
          setCurrentFields({ ...currentFields, AIDubEndpoint, AIDubModel })
          setCurrentStage(6)
        }} currentFields={currentFields} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "错误", message: msg })
        }}/>}
        {currentStage === 6 && <Stage6 onBack={() => setCurrentStage(5)} onNext={() => {
          navigate("/")
        }} currentFields={currentFields} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "错误", message: msg })
        }}/>}

        <div style={{ height: 20 }}></div>
        <Mui.LinearProgress style={{ padding: 0, margin: 0, width: "100%" }} variant="determinate" value={(currentStage / 5) * 100} />
        <div style={{ height: 20 }}></div>
      </Mui.Card>
      <Mui.Container style={{ height: '100vh', overflowY: 'hidden' }}>
        <Mui.Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => { setAlertOpen(false) }}>
          <Mui.Alert severity={alertDetail.type} action={
            <Mui.IconButton aria-label="close" color="inherit" size="small" onClick={() => { setAlertOpen(false) }} >
              <Mui.Icons.Close fontSize="inherit" />
            </Mui.IconButton>
          }>
            <Mui.AlertTitle>{alertDetail.title}</Mui.AlertTitle>
            {alertDetail.message}
          </Mui.Alert>
        </Mui.Snackbar>
      </Mui.Container>
    </>
  )
}
