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
        {"Server Initialization"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        You are almost there! Let's get started by setting up your Yoi English server.
      </Mui.Typography>
    </Mui.CardContent>
    <Mui.CardActions>
      {/* <Mui.Button size="small" onClick={() => { navigate(-1) }}></Mui.Button> */}
      <Mui.Button size="small" onClick={() => onNext()}>Start</Mui.Button>
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
        {"Set up administrator account"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"Get started by creating an administrator account for your Yoi English server. This account will have full access to the server and can manage users, groups, and other settings."}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="Username"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <Mui.TextField
        fullWidth
        label="E-mail"
        variant="outlined"
        margin="normal"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Mui.TextField
        fullWidth
        label="Password"
        variant="outlined"
        margin="normal"
        required
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>Back</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(username, password, email)}>Next</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage3({ onBack, onErr, onNext }) {
  const [apiToken, setAPIToken] = React.useState("")

  return <>
    <Mui.CardContent>
      <Mui.Typography gutterBottom variant="h5" component="div">
        {"Set up Artificial Intelligence for Yoi English"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"Set up your Google API Token for Gemini Pro access."}
        {"Not having a Google API Token? Click "} <Mui.Link href={'https://aistudio.google.com'} underline="hover">here</Mui.Link>{" to get one."}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="Google API Token"
        variant="outlined"
        margin="normal"
        required
        autoFocus
        value={apiToken}
        onChange={(e) => setAPIToken(e.target.value)}
      />
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>Back</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(apiToken)}>Next</Mui.Button>
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
        {"Chatbot Configurations"}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"Pick a name and write a persona for the chatbot being used with Yoi English."}
      </Mui.Typography>
      <div style={{ height: 20 }}></div>
      <Mui.TextField
        fullWidth
        label="Chatbot Name"
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
        label="Chatbot Persona"
        variant="outlined"
        margin="normal"
        required
        value={chatbotPersona}
        onChange={(e) => setChatbotPersona(e.target.value)}
        multiline
        maxRows={5}
      />
      <Mui.FormControl>
        <Mui.FormControlLabel style={{ padding: 10 }} control={<Mui.Switch checked={enableGenerativeAI} onChange={(e) => setEnableGenerativeAI(e.target.checked)} />} label="Enable Generative AI for chatbot persona writing" />
      </Mui.FormControl>
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" onClick={() => onBack()}>Back</Mui.Button>
      <Mui.Button size="small" onClick={() => onNext(chatbotName, chatbotPersona)}>Next</Mui.Button>
    </Mui.CardActions>
  </>
}

function Stage5({ onBack, onNext, onErr, currentFields }) {
  const [readyToRedirect, setReadyToRedirect] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      Api.initialize(currentFields.username,
        currentFields.email,
        currentFields.password,
        currentFields.google_api_key,
        currentFields.chatbotName,
        currentFields.chatbotPersona).then(r => {
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
        {"Getting ready for you..."}
      </Mui.Typography>
      <Mui.Typography variant="body2" color="text.secondary">
        {"Your Yoi English server is now ready to use. You can now start experiencing Yoi English."}
      </Mui.Typography>
      {/* occupy the space of the card content */}
      <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Mui.CircularProgress />
      </div>
    </Mui.CardContent>
    <Mui.CardActions>
      <Mui.Button size="small" disabled>Back</Mui.Button>
      {readyToRedirect && <Mui.Button size="small" onClick={() => {
        onNext()
      }}>Finish</Mui.Button>}
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
          setAlertDetail({ type: "error", title: "Error", message: msg })
          setAlertOpen(true)
        }} />}
        {currentStage === 3 && <Stage3 onBack={() => setCurrentStage(2)} onNext={(google_api_key) => {
          setCurrentFields({ ...currentFields, google_api_key })
          setCurrentStage(4)
        }} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "Error", message: msg })
        }}/>}
        {currentStage === 4 && <Stage4 onBack={() => setCurrentStage(3)} onNext={(chatbotName, chatbotPersona) => {
          setCurrentFields({ ...currentFields, chatbotName, chatbotPersona })
          setCurrentStage(5)
        }} currentFields={currentFields} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "Error", message: msg })
        }}/>}
        {currentStage === 5 && <Stage5 onBack={() => setCurrentStage(4)} onNext={() => {
          navigate("/")
        }} currentFields={currentFields} onErr={(msg) => {
          setAlertDetail({ type: "error", title: "Error", message: msg })
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