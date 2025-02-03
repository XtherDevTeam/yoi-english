
import * as React from 'react'
import * as Mui from '../Components'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import theme from '../theme'

import { useNavigate, useHref } from "react-router-dom"

export default function NotMatch() {
  const navigate = useNavigate()
  let [currentTheme, setCurrentTheme] = React.useState(theme.theme())
  theme.listenToThemeModeChange((v) => {
    setCurrentTheme(theme.theme())
  })

  React.useEffect(() => {
    console.log(theme.theme())
  }, [currentTheme])

  return (
    <>
      <theme.Background img={theme.imgBackground3} />
      <Mui.Card sx={{ maxWidth: 500, top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "absolute" }}>
        <Mui.CardMedia
          sx={{ height: 140 }}
          image={theme.imgOops}
          title="Oops"
        />
        <Mui.CardContent>
          <Mui.Typography gutterBottom variant="h5" component="div">
            {"哎呀，出错了 :("}
          </Mui.Typography>
          <Mui.Typography variant="body2" color="text.secondary">
            {"您要查找的页面丢失了，可能是您操作有误？XD"}
          </Mui.Typography>
        </Mui.CardContent>
        <Mui.CardActions>
          <Mui.Button size="small" onClick={() => { navigate(-1) }}>返回</Mui.Button>
          <Mui.Button size="small" onClick={() => { navigate("/") }}>主页</Mui.Button>
        </Mui.CardActions>
      </Mui.Card>
    </>
  )
}
