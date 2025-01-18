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
  const [alertDetail, setAlertDetail] = React.useState({ type: "error", title: "Error", message: "" })

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
            {"Sign In"}
          </Mui.Typography>
          <Mui.Typography variant="body2" color="text.secondary">
            {"Manage your Yoi English server, create and manage your exams, and more."}
          </Mui.Typography>
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
          <Mui.Button size="small" onClick={() => {
            Api.signin(email, password).then((res) => {
              if (res.status) {
                navigate("/")
              } else {
                setAlertDetail({ type: "error", title: "Error", message: res.data })
                setAlertOpen(true)
              }
            }).catch((err) => {
              setAlertDetail({ type: "error", title: "Error", message: toString(err) })
              setAlertOpen(true)
            })
          }}>Go</Mui.Button>
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