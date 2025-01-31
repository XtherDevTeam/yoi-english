import React from "react";
import Api from "../Api";
import { useNavigate } from "react-router-dom";
import * as Mui from "../Components";
import theme from "../theme";

function Home() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = React.useState({
    name: "",
    email: "",
    level: 0
  });
  const [currentTab, setCurrentTab] = React.useState(0);
  const [sidebarStatus, setSidebarStatus] = React.useState(true);
  const [currentTheme, setCurrentTheme] = React.useState(theme.theme());
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertDetail, setAlertDetail] = React.useState({ type: 'info', title: '', message: '' });

  theme.listenToThemeModeChange(() => {
    setCurrentTheme(theme.theme());
  })

  const handleSignOutBtnClick = () => {
    // Api.signOut().then(response => {
    //     console.log(response);
    //     window.location.href = "/signin";
    // }).catch(error => {
    //     console.log(error);
    //     setAlertDetail({ type: 'error', title: 'Error', message: error.message });
    //     setAlertOpen(true);
    // });
    Api.signOut().then(response => {
      window.location.href = "/signin";
    })

  }

  React.useEffect(() => {
    Api.checkIfInitialized().then(response => {
      console.log(response);
      if (response === false) {
        window.location.href = "/initialize";
      } else {
        Api.checkIfLoggedIn().then(response => {
          if (response === false) {
            window.location.href = "/signin";
          }
          Api.userInfo().then(response => {
            if (response.status) {
              setUserInfo(response.data);
            }
          }).catch(error => {
            console.log(error);
          });
        }).catch(error => {
          console.log(error);
        });
      }
    }).catch(error => {
      console.log(error);
    });
  }, []);

  return <><Mui.Snackbar open={alertOpen} autoHideDuration={6000} onClose={() => { setAlertOpen(false) }}>
    <Mui.Alert severity={alertDetail.type} action={
      <Mui.IconButton aria-label="close" color="inherit" size="small" onClick={() => { setAlertOpen(false) }} >
        <Mui.Icons.Close fontSize="inherit" />
      </Mui.IconButton>
    }>
      <Mui.AlertTitle>{alertDetail.title}</Mui.AlertTitle>
      {alertDetail.message}
    </Mui.Alert>
  </Mui.Snackbar>
    <Mui.Box sx={{ display: 'flex', flexGrow: 1 }}>
      <Mui.CssBaseline />
      <Mui.AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Mui.Toolbar>
          <Mui.IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => { setSidebarStatus(!sidebarStatus) }}
          >
            <Mui.Icons.Menu />
          </Mui.IconButton>
          <Mui.Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Yoi English Server Management
          </Mui.Typography>
          <Mui.IconButton sx={{ float: 'right' }} onClick={() => {
            theme.rotateThemeMode()
          }}>
            <Mui.Icons.Brightness4 />
          </Mui.IconButton>
          <Mui.IconButton sx={{ float: 'right' }} onClick={() => {
            handleSignOutBtnClick()
          }}>
            <Mui.Icons.Logout />
          </Mui.IconButton>
        </Mui.Toolbar>
      </Mui.AppBar>
      <Mui.Drawer
        variant='persistent'
        open={sidebarStatus}
        onClose={() => setSidebarStatus(false)}
        sx={{
          width: sidebarStatus ? '20%' : '0px',
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: "20%", boxSizing: 'border-box',
          },
        }}
      >
        <Mui.Toolbar />
        <Mui.Box sx={{ overflow: 'auto', }}>
          <Mui.List>
            <Mui.ListItem key="Profile" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(0) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.AccountBox />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="Profile" />
              </Mui.ListItemButton>
            </Mui.ListItem>

            <Mui.ListItem key="User Management" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(1) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.FilePresent />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="User Management" />
              </Mui.ListItemButton>
            </Mui.ListItem>

            <Mui.ListItem key="Examinations" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(2) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.Quiz />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="Examinations" />
              </Mui.ListItemButton>
            </Mui.ListItem>

            <Mui.ListItem key="Artifacts" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(3) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.CloudUpload />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="Artifacts" />
              </Mui.ListItemButton>
            </Mui.ListItem>

            <Mui.ListItem key="ExaminationResults" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(4) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.Assessment />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="Examination Results" />
              </Mui.ListItemButton>
            </Mui.ListItem>

            <Mui.ListItem key="OngoingSessions" disablePadding>
              <Mui.ListItemButton onClick={() => { setCurrentTab(5) }}>
                <Mui.ListItemIcon>
                  <Mui.Icons.AccessTime />
                </Mui.ListItemIcon>
                <Mui.ListItemText primary="Ongoing Sessions" />
              </Mui.ListItemButton>
            </Mui.ListItem>
          </Mui.List>
        </Mui.Box>
      </Mui.Drawer>
      <Mui.Box component="main" sx={{
        flexGrow: 1, p: 3,
        backgroundColor: currentTheme.palette.surfaceContainer.main
      }}>
        <Mui.Toolbar />
        <Mui.Paper style={{ padding: 0, borderTopLeftRadius: 30, height: `calc(100vh - 64px)`, overflowY: 'scroll' }}>
          <Mui.TransitionGroup>
            {currentTab === 0 && <Mui.Fade in={true}>
              {currentTab === 0 && <Mui.Fade key={0} exit={false}><div style={{ width: "100%" }}><Mui.Profile /></div></Mui.Fade>}
            </Mui.Fade>}
            {currentTab === 1 && <Mui.Fade in={true}>
              {currentTab === 1 && <Mui.Fade key={1} exit={false}><div style={{ width: "100%" }}><Mui.UserManagement /></div></Mui.Fade>}
            </Mui.Fade>}
            {currentTab === 2 && <Mui.Fade in={true}>
              {currentTab === 2 && <Mui.Fade key={2} exit={false}><div style={{ width: "100%" }}><Mui.Examination /></div></Mui.Fade>}
            </Mui.Fade>}
            {currentTab === 3 && <Mui.Fade in={true}>
              {currentTab === 3 && <Mui.Fade key={3} exit={false}><div style={{ width: "100%" }}><Mui.Artifacts /></div></Mui.Fade>}
            </Mui.Fade>}
            {currentTab === 4 && <Mui.Fade in={true}>
              {currentTab === 4 && <Mui.Fade key={4} exit={false}><div style={{ width: "100%" }}><Mui.ExaminationResult /></div></Mui.Fade>}
            </Mui.Fade>}
            {currentTab === 5 && <Mui.Fade in={true}>
              {currentTab === 5 && <Mui.Fade key={5} exit={false}><div style={{ width: "100%" }}><Mui.OngoingSession /></div></Mui.Fade>}
            </Mui.Fade>}
          </Mui.TransitionGroup>
        </Mui.Paper>
      </Mui.Box>
    </Mui.Box>
  </>;
}

export default Home;