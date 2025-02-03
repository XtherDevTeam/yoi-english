
import * as React from 'react'
import * as Mui from '../Components'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import theme from '../theme'

import { useNavigate, useHref } from "react-router-dom"
import Api from '../Api'

export default function NotMatch() {
  const navigate = useNavigate()
  let [currentTheme, setCurrentTheme] = React.useState(theme.theme())
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [alertOpen, setAlertOpen] = React.useState(false)
  const [alertDetail, setAlertDetail] = React.useState({ type: "error", title: "错误", message: "" })

  theme.listenToThemeModeChange((v) => {
    setCurrentTheme(theme.theme())
  })

  React.useEffect(() => {
    console.log(theme.theme())
  }, [currentTheme])

  React.useEffect(() => {
    Api.checkIfInitialized().then(response => {
      console.log(response);
      if (response === false) {
        window.location.href = "/initialize";
      } else {
        Api.checkIfLoggedIn().then(response => {
          if (response === true) {
            window.location.href = "/";
          }
        }).catch(error => {
          console.log(error);
        });
      }
    }).catch(error => {
      console.log(error);
    });
  }, []);

  return (
    <>
      <theme.Background img={theme.imgBackground3} />
      <Mui.Card sx={{ maxWidth: 500, top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "absolute" }}>
        <Mui.CardContent>
          <Mui.Typography gutterBottom variant="h5" component="div">
            {"登录"}
          </Mui.Typography>
          <Mui.Typography variant="body2" color="text.secondary">
            {"管理您的 Yoi 英语服务器，创建和管理您的考试等等。"}
          </Mui.Typography>
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
          <Mui.Button size="small" onClick={() => {
            Api.signin(email, password).then((res) => {
              if (res.status) {
                navigate("/")
              } else {
                console.log(res)
                setAlertDetail({ type: "error", title: "错误", message: res.message })
                setAlertOpen(true)
              }
            }).catch((err) => {
              console.log(err)
              setAlertDetail({ type: "error", title: "错误", message: "" + err })
              setAlertOpen(true)
            })
          }}>前往</Mui.Button>
          <Mui.Button size="small" onClick={() => {
            Api.signin("test_acc@mail.xiaokang00010.top", "evaluation").then((res) => {
              if (res.status) {
                navigate("/")
              } else {
                console.log(res)
                setAlertDetail({ type: "error", title: "错误", message: res.message })
                setAlertOpen(true)
              }
            }).catch((err) => {
              console.log(err)
              setAlertDetail({ type: "error", title: "错误", message: "" + err })
              setAlertOpen(true)
            })
          }}>使用测试账户登录</Mui.Button>
        </Mui.CardActions>
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