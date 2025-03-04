import React from "react";
import Api from "../Api"
import * as Mui from '../Components'
import Dialog from "./InputDialog";
import { Input } from "@mui/material";

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

const ServerConfiguration = () => {
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({ type: "success", title: "", message: "" });
  const [chatbotName, setChatbotName] = React.useState("");
  const [chatbotPersona, setChatbotPersona] = React.useState("");
  const [AIDubEndpoint, setAIDubEndpoint] = React.useState("");
  const [AIDubModel, setAIDubModel] = React.useState("");
  const [googleAPIKey, setGoogleAPIKey] = React.useState("");
  const [enableRegister, setEnableRegister] = React.useState(false);
  const [enableGenerativeAI, setEnableGenerativeAI] = React.useState(false);
  const [pendingAIInvocation, setPendingAIInvocation] = React.useState(null);

  React.useEffect(() => {
    Api.getConfig().then(r => {
      if (r.status) {
        setChatbotName(r.data.chatbotName)
        setChatbotPersona(r.data.chatbotPersona)
        setAIDubEndpoint(r.data.AIDubEndpoint)
        setAIDubModel(r.data.AIDubModel)
        setGoogleAPIKey(r.data.googleApiKey)
        setEnableRegister(r.data.enableRegister)
      } else {
        setAlertDetail({ type: "error", title: "Error", message: `Failed to fetch server configuration: ${r.message}` });
        setAlertOpen(true);
      }
    }).catch(e => {
      setAlertDetail({ type: "error", title: "Error", message: `Failed to fetch server configuration: Network error.` });
      setAlertOpen(true);
    });
  }, [])

  return <>
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
    <Mui.CardContent style={{ padding: "20px" }}>
      <Mui.Grid container spacing={1}>
        <Mui.Grid item xs={12}>
          <Mui.Typography variant="h5" gutterBottom>
            服务器配置
          </Mui.Typography>
          <Mui.Typography variant="body2" gutterBottom>
            在这里配置服务器的基本信息，包括口语练习机器人名称、描述，以及其他相关配置。
          </Mui.Typography>
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField
            label="口语练习机器人名称"
            value={chatbotName}
            onChange={(e) => {
              setChatbotName(e.target.value)
              if (enableGenerativeAI) {
                if (pendingAIInvocation !== null) {
                  // clear timeout
                  clearTimeout(pendingAIInvocation)
                }
                setPendingAIInvocation(setTimeout(() => {
                  // fetch a possible persona from the AI
                  Api.ask_ai('gemini-2.0-flash-thinking-exp-01-21', 0.5, "", PromptForGeneratingChatbotPersona.replace("{{charName}}", e.target.value), googleAPIKey).then(response => {
                    // console.log(response.status, response)
                    if (response.status) {
                      setChatbotPersona(response.data.answer)
                    } else {
                      console.error(response)
                    }
                  })
                }, 1000))
              }
            }}
            fullWidth
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField
            label="口语练习机器人描述"
            value={chatbotPersona}
            onChange={(e) => setChatbotPersona(e.target.value)}
            fullWidth
            multiline
            rows={4}
          />
          <Mui.FormControl>
            <Mui.FormControlLabel style={{ padding: 10 }} control={<Mui.Switch checked={enableGenerativeAI} onChange={(e) => setEnableGenerativeAI(e.target.checked)} />} label="启用生成式AI辅助生成描述" />
          </Mui.FormControl>
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField
            label="AIDub中间件端点"
            value={AIDubEndpoint}
            onChange={(e) => setAIDubEndpoint(e.target.value)}
            fullWidth
          />
        </Mui.Grid>
        <Mui.Grid item xs={6}>
          <Mui.TextField
            label="AIDub模型名称"
            value={AIDubModel}
            onChange={(e) => setAIDubModel(e.target.value)}
            fullWidth
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.TextField
            label="Google API Key"
            value={googleAPIKey}
            onChange={(e) => setGoogleAPIKey(e.target.value)}
            fullWidth
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.FormControlLabel
            control={
              <Mui.Switch
                checked={enableRegister}
                onChange={(e) => setEnableRegister(e.target.checked)}
                name="enableRegister"
                color="primary"
              />
            }
            label="启用用户注册"
          />
        </Mui.Grid>
        <Mui.Grid item xs={12}>
          <Mui.Button variant="contained" color="primary" onClick={() => {
            Api.updateConfig(chatbotName, chatbotPersona, AIDubEndpoint, AIDubModel, enableRegister, googleAPIKey).then(r => {
              if (r.status) {
                setAlertDetail({ type: "success", title: "Success", message: "成功地更新了服务器配置." });
                setAlertOpen(true);
              } else {
                setAlertDetail({ type: "error", title: "Error", message: `Failed to update server configuration: ${r.message}` });
                setAlertOpen(true);
              }
            }).catch(e => {
              setAlertDetail({ type: "error", title: "Error", message: `无法更新服务器配置: 网络错误.` });
              setAlertOpen(true);
            });
          }}>
            保存修改
          </Mui.Button>
        </Mui.Grid>
      </Mui.Grid>
    </Mui.CardContent>
  </>
}

export default ServerConfiguration;